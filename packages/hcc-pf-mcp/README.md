# @redhat-cloud-services/hcc-pf-mcp

HCC PatternFly MCP package for Model Context Protocol integration with all PatternFly packages, including comprehensive component documentation, source code access, and CSS utility integration.

## ⚠️ Temporary Solution

This MCP server is a **temporary solution** until a pluggable architecture is established for the official PatternFly MCP server.

📋 **Official PatternFly MCP**: https://github.com/patternfly/patternfly-mcp

Once the official PatternFly MCP supports pluggable solutions, this package will be migrated or deprecated in favor of the official implementation.

## Installation

```bash
npm install @redhat-cloud-services/hcc-pf-mcp
```

## Usage

### As MCP Server

Start the MCP server using npx:

```bash
npx @redhat-cloud-services/hcc-pf-mcp
```

### MCP Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "hcc-pf-mcp": {
      "command": "npx",
      "args": ["@redhat-cloud-services/hcc-pf-mcp"]
    }
  }
}
```

Or using local installation:

```json
{
  "mcpServers": {
    "hcc-pf-mcp": {
      "command": "node",
      "args": ["./node_modules/@redhat-cloud-services/hcc-pf-mcp/dist/index.js"]
    }
  }
}
```

### Available Tools

Once the MCP server is running, these tools become available:

#### Data View Documentation and Examples

- **getPatternFlyDataViewDescription**
  - Get comprehensive documentation about the @patternfly/react-data-view package and its capabilities
  - No parameters required
  - Returns detailed documentation from the official PatternFly data view documentation

- **getPatternFlyDataViewExample**
  - Get implementation examples for various data table scenarios
  - **Parameter**: `exampleName` (required) - Choose from:
    - `minimalSetup` - Basic data view setup
    - `commonUsage` - Common patterns and configurations
    - `toolbarExample` - Toolbar integration examples
    - `filters` - Filtering implementation
    - `table` - Table component usage
    - `resizeableColumns` - Resizable column setup
    - `treeTable` - Tree table implementation
    - `loadingState` - Loading state management
    - `tableStates` - Various table state examples

#### PatternFly Module Discovery and Source Code

- **getAvailableModules**
  - Retrieve a list of available PatternFly modules in your local environment
  - **Parameters**:
    - `packageName` (required) - Package to scan: `@patternfly/react-core`, `@patternfly/react-icons`, `@patternfly/react-table`, `@patternfly/react-data-view`, or `@patternfly/react-component-groups`
    - `nodeModulesRootPath` (optional) - Absolute path to node_modules directory (defaults to current working directory)
  - Returns semicolon-separated list of available module names

- **getComponentSourceCode**
  - Retrieve the actual TypeScript/React source code for any PatternFly component
  - **Parameters**:
    - `componentName` (required) - Name of the PatternFly component (e.g., "Button", "Table", "DataView")
    - `packageName` (optional) - Package to search in: `@patternfly/react-core`, `@patternfly/react-table`, `@patternfly/react-data-view`, or `@patternfly/react-component-groups` (defaults to `@patternfly/react-core`)
    - `nodeModulesRootPath` (optional) - Absolute path to node_modules directory (defaults to current working directory)
  - Returns the complete source code of the specified component

#### PatternFly CSS Utilities

- **getReactUtilityClasses**
  - Retrieve PatternFly CSS utility classes from @patternfly/react-styles
  - **Parameters**:
    - `utilityName` (required) - Utility category to retrieve:
      - `Accessibility` - Screen reader and accessibility utilities
      - `Alignment` - Text and element alignment classes
      - `BackgroundColor` - Background color utilities
      - `BoxShadow` - Box shadow utility classes
      - `Display` - Display property utilities (block, flex, grid, etc.)
      - `Flex` - Flexbox layout utilities
      - `Float` - Float positioning utilities
      - `Sizing` - Width, height, and sizing utilities
      - `Spacing` - Margin and padding utilities
      - `Text` - Typography and text styling utilities
    - `nodeModulesRootPath` (optional) - Absolute path to node_modules directory (defaults to current working directory)
  - Returns the raw CSS utility classes for the specified category

## Usage Examples

### Tool Usage Examples

Here are examples of how to use each tool:

#### Get Data View Documentation
```json
{
  "method": "call_tool",
  "params": {
    "name": "getPatternFlyDataViewDescription"
  }
}
```

#### Get a Specific Implementation Example
```json
{
  "method": "call_tool",
  "params": {
    "name": "getPatternFlyDataViewExample",
    "arguments": {
      "exampleName": "commonUsage"
    }
  }
}
```

#### Discover Available PatternFly Components
```json
{
  "method": "call_tool",
  "params": {
    "name": "getAvailableModules",
    "arguments": {
      "packageName": "@patternfly/react-core"
    }
  }
}
```

#### Get Component Source Code
```json
{
  "method": "call_tool",
  "params": {
    "name": "getComponentSourceCode",
    "arguments": {
      "componentName": "Button",
      "packageName": "@patternfly/react-core"
    }
  }
}
```

#### Get CSS Utility Classes
```json
{
  "method": "call_tool",
  "params": {
    "name": "getReactUtilityClasses",
    "arguments": {
      "utilityName": "Spacing"
    }
  }
}
```

### Integration with AI Tools

This MCP server is designed to work seamlessly with AI development tools like Claude Code, Cursor, and other MCP-compatible environments. The tools provide:

- **Real-time component discovery** - Find available PatternFly components in your project
- **Source code analysis** - Get actual implementation details for any component
- **Design system integration** - Access to PatternFly's utility classes and design tokens
- **Implementation guidance** - Complete examples for complex data table scenarios

## Features

- **Model Context Protocol (MCP) server implementation for all PatternFly packages**
- **PatternFly DataView component assistance and examples**
  - Comprehensive @patternfly/react-data-view documentation and implementation examples
  - Multiple data table usage scenarios from basic to advanced
- **PatternFly module discovery and source code access**
  - Discover available components across all PatternFly packages
  - Access actual TypeScript/React source code for any PatternFly component
  - Support for all PatternFly packages: react-core, react-icons, react-table, react-data-view, react-component-groups
- **PatternFly CSS utility classes integration**
  - Access to all PatternFly CSS utility categories from @patternfly/react-styles
  - Raw CSS classes for direct implementation
  - Support for accessibility, layout, styling, and responsive utilities
- **Local environment integration**
  - Works with your local node_modules installations
  - Automatic package detection and validation
  - Configurable paths for different project structures
- **TypeScript support and comprehensive error handling**

## License

Licensed under the Apache License 2.0. See LICENSE file for details.