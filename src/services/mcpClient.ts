import { createMCPClient } from '@ai-sdk/mcp';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

let mcpClientInstance: any = null;

/**
 * Initializes the MCP client using the AI SDK bridge.
 * Points to the Excalidraw MCP server.
 */
export async function getExcalidrawClient() {
  if (mcpClientInstance) return mcpClientInstance;

  const url = new URL('https://mcp.excalidraw.com/mcp');
  
  // Use the AI SDK library already in package.json
  mcpClientInstance = await createMCPClient({
    transport: new StreamableHTTPClientTransport(url),
  });

  return mcpClientInstance;
}

/**
 * Lists tools from the Excalidraw MCP server.
 */
export async function listExcalidrawTools() {
  const client = await getExcalidrawClient();
  return await client.tools();
}

/**
 * Calls a specific Excalidraw tool through the MCP server.
 */
export async function callExcalidrawTool(toolName: string, args: any) {
  const tools = await listExcalidrawTools();
  if (tools[toolName]) {
    const result = await tools[toolName].execute(args);
    return result;
  }
  throw new Error(`Tool ${toolName} not found on Excalidraw MCP server`);
}