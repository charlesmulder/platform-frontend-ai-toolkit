import { readJsonFile } from './readFile';
import { verifyLocalPackage } from './verifyLocalPackage';

const modulesCache: Map<string, {expiresAt: number, modulesMap: Record<string, string>}> = new Map();

function isCacheValid(cacheEntry: {expiresAt: number}): boolean {
  return cacheEntry.expiresAt > Date.now();
}

function setCache(packageName: string, modulesMap: Record<string, string>, ttlMs: number = 5 * 60 * 1000): void {
  const expiresAt = Date.now() + ttlMs;
  modulesCache.set(packageName, { expiresAt, modulesMap });
}

function getCache(packageName: string): Record<string, string> | null {
  const cacheEntry = modulesCache.get(packageName);
  if (cacheEntry && isCacheValid(cacheEntry)) {
    return cacheEntry.modulesMap;
  }
  modulesCache.delete(packageName);
  return null;
}

async function getModulesMap(cacheKey: string, packageRoot: string): Promise<Record<string, string>> {
  const cachedEntry = getCache(cacheKey);
  if (cachedEntry) {
    return cachedEntry;
  }
  const modulesMap = await readJsonFile<Record<string, string>>(`${packageRoot}/dist/dynamic-modules.json`);
  setCache(cacheKey, modulesMap);
  return modulesMap;
}

function createCacheKey(packageName: string, packageRoot: string): string {
  return packageRoot ? `${packageName}::${packageRoot}` : packageName;
}


export const getLocalModulesMap = async (packageName: string, nodeModulesRootPath?: string): Promise<Record<string, string>> => {
  let modulesMap: Record<string, string> = {};

  const status = await verifyLocalPackage(packageName, nodeModulesRootPath);

  if (!status.exists) {
    throw new Error(`Package "${packageName}" not found locally. ${status.error ? status.error.message : ''}`);
  }

  const cacheKey = createCacheKey(packageName, status.packageRoot);

  // exported map of module names to their paths
  try {
    modulesMap = await getModulesMap(cacheKey, status.packageRoot);
  } catch (error) {
    throw new Error(`Failed to import modules map from package "${packageName}": ${error}. Does the modules map exist?`);
  }

  return modulesMap;
};
