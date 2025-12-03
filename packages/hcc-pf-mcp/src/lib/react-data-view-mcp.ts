import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpTool } from "./types";
import { getDescriptionTool } from "./tools/description.js";
import { getImplementationExampleTool } from "./tools/implementationExample";

export async function run() {
  const tools: McpTool[] = [
    getDescriptionTool(),
    getImplementationExampleTool(),
  ]
  let server: McpServer | undefined = undefined;

  async function stopServer() {
    if(server) {
      await server.close();
     return  process.exit(0);
    }

    throw new Error("PatternFly React Data View MCP server is not running");
  }


  try {
    server = new McpServer({
      name: 'PatternFly React Data View MCP Server',
      version: '1.0.0',
    }, {
      instructions: 'You are a Model Context Protocol (MCP) server that provides information about the @patternfly/react-data-view package and its capabilities. This package is used to create PatternFly data tables with advanced features like sorting, filtering, pagination, selection, and toolbar integration. Respond to tool calls with relevant information about the @patternfly/react-data-view package and how to implement it effectively in React applications.',
      capabilities: {
        resources: {},
        tools: {},
      }
    });
  
    tools.forEach(([name, config, func]) => {
      server?.registerTool(name, config, func);
    });
  
    process.on('SIGINT', async () => stopServer());
  
    const transport = new StdioServerTransport();
  
    await server.connect(transport);
    
    console.log('PatternFly React Data View MCP server is running...');
  } catch (error) {
    throw new Error(`Failed to start PatternFly React Data View MCP server: ${(error as Error).message}`);
  }
}
