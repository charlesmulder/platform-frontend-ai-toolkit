import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { getLocalModulesMap } from '../utils/getLocalModulesMap';
import { McpTool } from '../types';

export const getAvailableModulesTool = (): McpTool => {

  const tool = async (args: any = {}): Promise<CallToolResult> => {
    const { packageName, nodeModulesRootPath } = args;

    if (typeof packageName !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Missing required parameter: packageName (must be a string): ${packageName}`
      );
    }
    let modulesList : string[] = [];

    try {
      // should be extended for other packages in the future
      const modulesMap = await getLocalModulesMap(packageName, nodeModulesRootPath);

      // no need to return paths, just the module names, reduce the context size
      modulesList = Object.keys(modulesMap);
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to retrieve available modules: ${error}`
      );
    }

    return {
      content: [
        {
          type: 'text',
          // Modules separated by semicolons to save context space
          text: modulesList.join(';')
        }
      ]
    };
  };

  return [
    'getAvailableModules',
    {
      description: 'Retrieves a list of available Patternfly react-core modules in the current environment.',
      inputSchema: {
        packageName: z.enum(['@patternfly/react-core', '@patternfly/react-icons', '@patternfly/react-table', '@patternfly/react-data-view', '@patternfly/react-component-groups']).describe('Name of the patternfly package to get modules for. For tables its always better to use the @patternfly/react-data-view package.').default('@patternfly/react-core'),
        nodeModulesRootPath: z.string().optional().describe('Optional absolute path to the node_modules directory root. If not provided, will use the current working directory.')
      }
    },
    tool
  ];
};
