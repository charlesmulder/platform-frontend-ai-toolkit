import { z } from 'zod';
import { verifyLocalPackage } from '../utils/verifyLocalPackage';
import { readFileAsync } from '../utils/readFile';
import { McpTool } from '../types';
import { CallToolResult } from '@modelcontextprotocol/sdk/types';

const utilityClassesMap: Record<string, string> = {
  Accessibility: 'css/utilities/Accessibility/accessibility.css',
  Alignment: 'css/utilities/Alignment/alignment.css',
  BackgroundColor: 'css/utilities/BackgroundColor/background-color.css',
  BoxShadow: 'css/utilities/BoxShadow/box-shadow.css',
  Display: 'css/utilities/Display/display.css',
  Flex: 'css/utilities/Flex/flex.css',
  Float: 'css/utilities/Float/float.css',
  Sizing: 'css/utilities/Sizing/sizing.css',
  Spacing: 'css/utilities/Spacing/spacing.css',
  Text: 'css/utilities/Text/text.css'
};

const utilities = Object.keys(utilityClassesMap) as [string, ...string[]];

export const getReactUtilityClasses = (): McpTool => {
  const tool = async (args: any = {}): Promise<CallToolResult> => {
    const { utilityName, nodeModulesRootPath } = args;
    let fileContent: string;

    if (typeof utilityName !== 'string' || !utilities.includes(utilityName)) {
      throw new Error(
        `Invalid or missing parameter: utilityName (must be one of: ${utilities.join(', ')}): ${utilityName}`
      );
    }
    const status = await verifyLocalPackage('@patternfly/react-styles', nodeModulesRootPath);

    if (!status.exists) {
      throw new Error(
        `Package "@patternfly/react-styles" not found locally. ${status.error ? status.error.message : ''}`
      );
    }

    const root = status.packageRoot;
    const utilityPath = utilityClassesMap[utilityName];
    const fullPath = `${root}/${utilityPath}`;

    try {
      fileContent = await readFileAsync(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to read utility classes file for "${utilityName}" at path "${fullPath}". ${error instanceof Error ? error.message : ''}`
      );
    }

    return {
      content: [{
        type: 'text',
        text: fileContent
      }]
    };
  };

  return [
    'getReactUtilityClasses',
    {
      description: 'Retrieves a list of available Patternfly react-styles utility classes in the current environment.',
      inputSchema: {
        utilityName: z.enum(utilities).describe('Name of a set of utility classes to retrieve from @patternfly/react-styles.'),
        nodeModulesRootPath: z.string().optional().describe('Optional absolute path to the node_modules directory root. If not provided, will use the current working directory.')
      }
    },
    tool
  ];
};
