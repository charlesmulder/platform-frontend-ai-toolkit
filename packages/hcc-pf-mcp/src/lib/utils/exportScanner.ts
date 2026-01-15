/**
 * Utility for scanning TypeScript/JavaScript source files to find exports.
 * Uses TypeScript's compiler API to accurately parse and extract export information.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import fg from 'fast-glob';

const readFile = promisify(fs.readFile);

export interface ExportInfo {
  name: string;
  filePath: string;
  kind: 'variable' | 'function' | 'class' | 'type' | 'interface' | 'enum' | 'reexport' | 'default';
  isDefault: boolean;
}

export interface ExportScanResult {
  exports: Map<string, ExportInfo>;
  errors: string[];
}

// Cache for scanned packages
const exportCache: Map<string, { expiresAt: number; result: ExportScanResult }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Glob pattern for source files, excluding test and example directories
 */
const SOURCE_GLOB_PATTERN = '**/*.{ts,tsx}';
const IGNORED_PATTERNS = [
  '**/examples/**',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/__snapshots__/**',
  '**/test/**',
  '**/tests/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/*.d.ts',
];

/**
 * Creates a cache key for the export scanner
 */
function createCacheKey(packageRoot: string): string {
  return `exports::${packageRoot}`;
}

/**
 * Checks if cache entry is still valid
 */
function isCacheValid(cacheEntry: { expiresAt: number }): boolean {
  return cacheEntry.expiresAt > Date.now();
}

/**
 * Gets cached result if available and valid
 */
function getFromCache(packageRoot: string): ExportScanResult | null {
  const cacheKey = createCacheKey(packageRoot);
  const cached = exportCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.result;
  }
  exportCache.delete(cacheKey);
  return null;
}

/**
 * Stores result in cache
 */
function setCache(packageRoot: string, result: ExportScanResult): void {
  const cacheKey = createCacheKey(packageRoot);
  exportCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result,
  });
}

/**
 * Collects all TypeScript/TSX source files in a directory using glob
 */
async function collectSourceFiles(srcDir: string): Promise<string[]> {
  try {
    const files = await fg(SOURCE_GLOB_PATTERN, {
      cwd: srcDir,
      absolute: true,
      ignore: IGNORED_PATTERNS,
    });
    return files;
  } catch (err) {
    console.error(`Error collecting source files in ${srcDir}:`, err);
    // Directory doesn't exist or can't be read
    return [];
  }
}

/**
 * Extracts the export name from a declaration
 */
function getExportedName(node: ts.Declaration): string | undefined {
  if (ts.isVariableDeclaration(node)) {
    return ts.isIdentifier(node.name) ? node.name.text : undefined;
  }
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
    return node.name?.text;
  }
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) {
    return node.name.text;
  }
  return undefined;
}

/**
 * Parses a single TypeScript file and extracts its exports
 */
function parseFileExports(filePath: string, sourceText: string): ExportInfo[] {
  const exports: ExportInfo[] = [];

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  function visit(node: ts.Node) {
    // Handle: export const X = ..., export function X(), export class X
    if (ts.isVariableStatement(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const isDefault = modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
        for (const declaration of node.declarationList.declarations) {
          const name = getExportedName(declaration);
          if (name) {
            exports.push({
              name,
              filePath,
              kind: 'variable',
              isDefault,
            });
          }
        }
      }
    }

    // Handle: export function X() {} or export default function X() {}
    if (ts.isFunctionDeclaration(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const isDefault = modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
        const name = node.name?.text;
        if (name) {
          exports.push({
            name,
            filePath,
            kind: 'function',
            isDefault,
          });
        }
      }
    }

    // Handle: export class X {}
    if (ts.isClassDeclaration(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const isDefault = modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
        const name = node.name?.text;
        if (name) {
          exports.push({
            name,
            filePath,
            kind: 'class',
            isDefault,
          });
        }
      }
    }

    // Handle: export interface X {}
    if (ts.isInterfaceDeclaration(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push({
          name: node.name.text,
          filePath,
          kind: 'interface',
          isDefault: false,
        });
      }
    }

    // Handle: export type X = ...
    if (ts.isTypeAliasDeclaration(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push({
          name: node.name.text,
          filePath,
          kind: 'type',
          isDefault: false,
        });
      }
    }

    // Handle: export enum X {}
    if (ts.isEnumDeclaration(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push({
          name: node.name.text,
          filePath,
          kind: 'enum',
          isDefault: false,
        });
      }
    }

    // Handle: export { X, Y, Z } (named exports from current file - local declarations)
    // We don't need to handle these specially as they refer to local declarations

    // Handle: export { X } from './module' (re-exports)
    // For re-exports, we track that the re-exporting file re-exports them
    // The actual source will be found by following the chain
    if (ts.isExportDeclaration(node)) {
      // Check if this is a re-export with a module specifier (from clause)
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        // This is a re-export from another module
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            // Use propertyName if aliased (export { X as Y }), otherwise use name
            const exportedName = element.name.text;
            exports.push({
              name: exportedName,
              filePath,
              kind: 'reexport',
              isDefault: false,
            });
          }
        }
        // Note: export * from './module' is not tracked here as individual names
        // We'd need type checking to resolve those
      } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        // export { X, Y } - exports of locally defined things
        // These are already captured by their original declarations
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exports;
}

/**
 * Scans the src directory of a package and returns all exports
 */
export async function scanPackageExports(packageRoot: string): Promise<ExportScanResult> {
  // Check cache first
  const cached = getFromCache(packageRoot);
  if (cached) {
    return cached;
  }

  const srcDir = path.join(packageRoot, 'src');
  const exports = new Map<string, ExportInfo>();
  const errors: string[] = [];

  try {
    const files = await collectSourceFiles(srcDir);

    for (const filePath of files) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const fileExports = parseFileExports(filePath, content);

        for (const exportInfo of fileExports) {
          // For each export name, prefer the actual source over re-exports
          const existing = exports.get(exportInfo.name);
          if (!existing || (existing.kind === 'reexport' && exportInfo.kind !== 'reexport')) {
            exports.set(exportInfo.name, exportInfo);
          }
        }
      } catch (error) {
        errors.push(`Failed to parse ${filePath}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to scan src directory: ${error}`);
  }

  const result: ExportScanResult = { exports, errors };
  setCache(packageRoot, result);
  return result;
}

/**
 * Finds the source file that exports a specific name
 */
export async function findExportSource(
  packageRoot: string,
  exportName: string
): Promise<ExportInfo | undefined> {
  const scanResult = await scanPackageExports(packageRoot);
  return scanResult.exports.get(exportName);
}

/**
 * Clears the export cache (useful for testing)
 */
export function clearExportCache(): void {
  exportCache.clear();
}
