# Scripts Documentation

This directory contains automation scripts for the HCC Frontend AI Toolkit.

## Available Scripts

### `sync-plugin-versions.js`
**Purpose:** Synchronize plugin manifests after NX Release updates package versions

**Usage:**
```bash
npm run sync-plugin-versions
# or
node scripts/sync-plugin-versions.js
```

**What it does:**
- Reads versions from `plugins/*/package.json`
- Updates corresponding `plugins/*/.claude-plugin/plugin.json`
- Updates version in `.claude-plugin/marketplace.json`
- Intended as NX Release post-version sync step

**Used in:**
- NX Release workflow (automated via post-version hook)
- Ensures plugin.json stays in sync with package.json versions

**Conventional commit analysis (handled by NX Release):**
- `fix:` → patch bump (1.0.0 → 1.0.1)
- `feat:` → minor bump (1.0.0 → 1.1.0)
- `feat!:` or `BREAKING CHANGE:` → major bump (1.0.0 → 2.0.0)

## Development Workflow

### Adding/Modifying Agents

1. **Edit** agent files in `plugins/{plugin-name}/agents/`
2. **Test** the agent locally with Claude Code
3. **Commit** with conventional commit message:
   ```bash
   git add plugins/frontend/agents/my-agent.md
   git commit -m "feat(my-agent): add new agent for X"
   ```
4. **Push** to branch and create PR
5. **Merge** to master → NX Release triggers
6. **Plugin version auto-bumps** based on your commit message

### Validating Commits Locally

To check your commit follows conventional format:

```bash
# View your last commit message
git log -1 --pretty=%B
```

Ensure it matches the pattern: `type(scope): description` where type is `feat`, `fix`, or includes `BREAKING CHANGE`.

## CI Integration

Scripts are integrated into the development pipeline:

### PR Checks
- Build, lint, and test all packages via CI

### Release Workflow (master merge)
- **NX Release:** Versions all projects (plugins + MCP packages) based on conventional commits
- **sync-plugin-versions:** Post-version hook syncs package.json → plugin.json & marketplace.json
- Creates GitHub releases and npm packages (packages only, plugins are private)