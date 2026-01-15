import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { getLocalModulesMap } from '../utils/getLocalModulesMap';
import { verifyLocalPackage } from '../utils/verifyLocalPackage';
import { readFileAsync } from '../utils/readFile';
import { findExportSource } from '../utils/exportScanner';
import { McpTool } from '../types';

export const getComponentSourceCode = (): McpTool => {

  const tool = async (args: any = {}): Promise<CallToolResult> => {
    const { componentName, packageName: packageNameArg, nodeModulesRootPath } = args;
    let fileContent: string;
    const packageName = packageNameArg || '@patternfly/react-core';

    if (typeof componentName !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Missing required parameter: componentName (must be a string): ${componentName}`
      );
    }

    // Verify the package exists locally
    const status = await verifyLocalPackage(packageName, nodeModulesRootPath);

    if (!status.exists) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Package "${packageName}" not found locally. ${status.error ? status.error.message : ''}`
      );
    }

    // Check if the component exists in the modules map (validates it's a known export)
    const modulesMap = await getLocalModulesMap(packageName, nodeModulesRootPath);
    if (!modulesMap[componentName]) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Component "${componentName}" not found in available modules for package "${packageName}".`
      );
    }

    // Scan the src directory to find the exact file that exports this component
    const exportInfo = await findExportSource(status.packageRoot, componentName);

    if (!exportInfo) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to find source file for component "${componentName}" in package "${packageName}".`
      );
    }

    // Read the source file
    try {
      fileContent = await readFileAsync(exportInfo.filePath, 'utf-8');
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read source code file for component "${componentName}": ${error}`
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: fileContent
        }
      ]
    };
  };

  return [
    'getComponentSourceCode',
    {
      description: 'Retrieve a source code of a specified Patternfly react-core module in the current environment.',
      inputSchema: {
        componentName: z.string().describe('Name of the PatternFly component (e.g., "Button", "Table")'),
        packageName: z.enum(['@patternfly/react-core', '@patternfly/react-table', '@patternfly/react-data-view', '@patternfly/react-component-groups']).optional().describe('Name of the patternfly package to get component from. For tables its always better to use the @patternfly/react-data-view package.').default('@patternfly/react-core'),
        nodeModulesRootPath: z.string().optional().describe('Optional absolute path to the node_modules directory root. If not provided, will use the current working directory.')
      }
    },
    tool
  ];
};
