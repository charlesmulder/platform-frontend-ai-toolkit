#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Sync versions from package.json to plugin.json files
 *
 * This script is called by NX Release after versioning package.json files.
 * It ensures plugin.json and marketplace.json stay in sync with package.json versions.
 */

const PLUGIN_DIRS = [
  'plugins/frontend',
  'plugins/infrastructure',
  'plugins/management'
];

const MARKETPLACE_PATH = path.join(__dirname, '../.claude-plugin/marketplace.json');

function syncPluginVersion(pluginDir) {
  const packageJsonPath = path.join(__dirname, '..', pluginDir, 'package.json');
  const pluginJsonPath = path.join(__dirname, '..', pluginDir, '.claude-plugin/plugin.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`${pluginDir}: package.json not found`);
  }

  if (!fs.existsSync(pluginJsonPath)) {
    throw new Error(`${pluginDir}: plugin.json not found`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));

  if (packageJson.version !== pluginJson.version) {
    pluginJson.version = packageJson.version;
    fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2) + '\n');
    console.log(`✓ Updated ${pluginDir}/plugin.json to version ${packageJson.version}`);
    return { name: pluginJson.name, version: packageJson.version };
  }

  console.log(`✓ ${pluginDir}/plugin.json already at version ${packageJson.version}`);
  return { name: pluginJson.name, version: packageJson.version };
}

function syncMarketplaceVersions(pluginVersions) {
  if (!fs.existsSync(MARKETPLACE_PATH)) {
    throw new Error('marketplace.json not found');
  }

  const marketplace = JSON.parse(fs.readFileSync(MARKETPLACE_PATH, 'utf-8'));
  let updated = false;

  for (const pluginVersion of pluginVersions) {
    if (!pluginVersion) continue;

    const plugin = marketplace.plugins.find(p => p.name === pluginVersion.name);
    if (plugin && plugin.version !== pluginVersion.version) {
      plugin.version = pluginVersion.version;
      updated = true;
      console.log(`✓ Updated marketplace.json ${pluginVersion.name} to ${pluginVersion.version}`);
    }
  }

  if (updated) {
    fs.writeFileSync(MARKETPLACE_PATH, JSON.stringify(marketplace, null, 2) + '\n');
  } else {
    console.log('✓ marketplace.json already up to date');
  }
}

function main() {
  try {
    console.log('\n🔄 Syncing plugin versions...\n');

    const pluginVersions = PLUGIN_DIRS.map(syncPluginVersion);

    console.log('\n📦 Updating marketplace.json...\n');
    syncMarketplaceVersions(pluginVersions);

    console.log('\n✅ Plugin version sync complete\n');
  } catch (error) {
    console.error(`\n❌ Plugin version sync failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { syncPluginVersion, syncMarketplaceVersions };
