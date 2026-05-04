# Plugin Development Guidelines

Guide for creating and maintaining Claude sub-agents and MCP servers in the HCC Frontend AI Toolkit.

## Creating a Claude Agent

### 1. Create the Agent File

Add a new Markdown file in the appropriate plugin's `agents/` directory with the `hcc-frontend-` prefix:

```bash
# Example: creating a new CSS utilities agent for frontend plugin
touch plugins/frontend/agents/hcc-frontend-css-utilities.md
```

### 2. Agent File Format

Use YAML frontmatter followed by the agent prompt:

```markdown
---
description: Brief description of what this agent specializes in
capabilities: ["specific-task-1", "specific-task-2", "specific-task-3"]
---

# Agent Name

Detailed prompt describing when and how Claude should use this agent.

## When to Use This Agent

- Specific scenario 1
- Specific scenario 2

## Examples

[Concrete usage examples with code snippets]
```

### 3. Agent Design Principles

- **Single responsibility** — one clear job per agent
- **Narrow scope** — avoid "general helper" agents
- **Clear boundaries** — state what the agent does NOT do
- **Composability** — agents should work well alongside others
- **Actionable capabilities** — list specific tasks, not vague descriptions

See [AGENT_GUIDELINES.md](../AGENT_GUIDELINES.md) for detailed examples of well-scoped vs poorly-scoped agents.

### 4. Test the Agent

Test the agent locally before submitting:

```bash
# Use Claude Code to test the agent
# Task with subagent_type='your-agent-name'
```

### 5. Use Conventional Commits

Plugin versions are **automatically managed** by CI. Your commit message controls the version bump:

```bash
# Patch version bump (1.0.0 → 1.0.1) - Bug fixes
git commit -m "fix(agent-name): fix bug in agent logic"

# Minor version bump (1.0.0 → 1.1.0) - New features/agents
git commit -m "feat(agent-name): add new agent for CSS utilities"

# Major version bump (1.0.0 → 2.0.0) - Breaking changes
git commit -m "feat(agent-name)!: redesign agent interface"

# Or with BREAKING CHANGE footer
git commit -m "feat(agent-name): change agent behavior

BREAKING CHANGE: This changes how the agent processes input"
```

**Important:** The automated release system:
- Detects changes in `plugins/*/agents/` when merged to master
- Analyzes your conventional commits to determine version bump
- Updates `plugin.json` and `marketplace.json` automatically
- Creates git tag `{plugin-name}@{version}` and GitHub release
- No manual version bumping required!

**Testing locally:** Validate commit format before pushing:

```bash
# Check your commit uses conventional format (feat/fix/BREAKING CHANGE)
git log -1 --pretty=%B
```

### 6. Commit the Agent

Commit the new agent with a conventional commit message:

```bash
git add plugins/frontend/agents/hcc-frontend-css-utilities.md
git commit -m "feat(css-utilities): add CSS utility specialist agent"
```

## Creating an MCP Server

### 1. Scaffold the Package

Create a new package in `packages/`:

```bash
mkdir -p packages/hcc-new-mcp/src/lib/tools
mkdir -p packages/hcc-new-mcp/src/lib/__tests__
```

### 2. Required Dependencies

Every MCP server must include `zod` — the MCP SDK uses Zod for schema validation:

```json
{
  "name": "@redhat-cloud-services/hcc-new-mcp",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.22.0",
    "tslib": "^2.3.0",
    "zod": "^3.25.76"
  }
}
```

### 3. Tool Implementation Pattern

Each tool follows the `[name, schema, handler]` tuple pattern:

```typescript
import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Type alias for tool registration
type McpTool = [string, { description: string; inputSchema: Record<string, any> }, (args: any) => Promise<CallToolResult>];

export function myTool(): McpTool {
  async function handler(args: any): Promise<CallToolResult> {
    const { query, includeExamples } = args;
    // Implementation here
    return {
      content: [{ type: 'text', text: 'result' }],
    };
  }

  return [
    'myToolName',
    {
      description: 'What this tool does',
      inputSchema: {
        query: z.string().describe('Search query'),
        includeExamples: z.boolean().optional().default(false).describe('Include examples'),
      },
    },
    handler,
  ];
}
```

### 4. Common Schema Patterns

```typescript
// Required string
z.string().describe('Description')

// Optional with default
z.string().optional().default('value').describe('Description')

// Enum
z.enum(['option1', 'option2']).describe('Description')

// Boolean
z.boolean().optional().default(true).describe('Description')

// Number
z.number().describe('Description')

// No parameters — use empty object
inputSchema: {}
```

**Never use JSON Schema syntax** (`{ type: 'object', properties: {...} }`). The MCP SDK calls `safeParseAsync()` on schemas, which requires Zod objects.

### 5. Register Tools in Entry Point

In `src/index.ts`, register all tools with the MCP server:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { myTool } from './lib/tools/myTool.js';

const server = new McpServer({
  name: 'hcc-new-mcp',
  version: '0.1.0',
});

server.tool(...myTool());

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 6. Add to Nx Release

Register the package in `nx.json` for automated releases:

```json
{
  "release": {
    "projects": [
      "@redhat-cloud-services/hcc-pf-mcp",
      "@redhat-cloud-services/hcc-feo-mcp",
      "@redhat-cloud-services/hcc-kessel-mcp",
      "@redhat-cloud-services/hcc-new-mcp"
    ]
  }
}
```

### 7. Testing

Write tests in `src/lib/__tests__/` using Jest:

```typescript
import { myTool } from '../tools/myTool';

describe('myTool', () => {
  const [name, schema, handler] = myTool();

  it('should return expected result', async () => {
    const result = await handler({ query: 'test' });
    expect(result.content[0].text).toContain('expected');
  });
});
```

Run tests:

```bash
npx nx test @redhat-cloud-services/hcc-new-mcp
```

### 8. Local Testing with MCP Inspector

Build and test interactively:

```bash
npm run build
npx @modelcontextprotocol/inspector node packages/hcc-new-mcp/dist/index.js
```

## CI Enforcement

### CI Pipeline (`ci.yml`)

Runs on all PRs and master pushes:
1. `npm ci` — install dependencies
2. `npx nx run-many -t build` — build all packages
3. `npx nx run-many -t lint` — lint all packages
4. `npx nx run-many -t test` — run all tests

## Checklist for New Agents

- [ ] File created in `plugins/{plugin-name}/agents/` with proper prefix
- [ ] YAML frontmatter with `description` and `capabilities`
- [ ] Focused scope with clear boundaries
- [ ] Usage examples included
- [ ] Tested locally with Claude Code
- [ ] Commit uses conventional commit format (`feat:`, `fix:`, etc.)
- [ ] ✅ Plugin version will auto-bump on merge to master (no manual version bump needed!)

## Checklist for New MCP Servers

- [ ] Package created in `packages/` with proper structure
- [ ] `zod` included as dependency
- [ ] Tool schemas use Zod constructors (not JSON Schema)
- [ ] Entry point registers tools and starts stdio transport
- [ ] Tests written in `src/lib/__tests__/`
- [ ] Package added to `nx.json` release config
- [ ] Package added to `plugin.json` mcpServers (if distributed via plugin)
- [ ] README.md documenting available tools
