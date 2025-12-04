import { CallToolResult, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { McpTool } from "../types";
import { cachedFetch } from "../cachedFetch";

export function getDescriptionTool(): McpTool {
  async function tool(_: any): Promise<CallToolResult>  {

    try {
      const description = await cachedFetch<string>('https://raw.githubusercontent.com/patternfly/react-data-view/refs/heads/main/packages/module/patternfly-docs/content/extensions/data-view/examples/DataView/DataView.md')
      return {
        content: [
          {
            type: "text",
            text: description,
          }
        ]
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch data view description: ${errorMessage}`
      );
    }
  }
  return [
    "getPatternFlyDataViewDescription",
    {
      description: "Get a description of the @patternfly/react-data-view package and its capabilities for building advanced data tables with PatternFly.",
      inputSchema: {},
    },
    tool
  ]
}
