// scripts/mcp-test.mjs
// A quick test script to verify the local MCP server is running and list available tools

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import { join } from "path";

(async () => {
  // Start the MCP server as a child process using the local package
  const serverPath = join(process.cwd(), "node_modules", ".bin", "square-mcp-server");
  console.log(`Starting MCP server from: ${serverPath}`);
  
  const serverProcess = spawn(serverPath, ["start"], {
    env: {
      ...process.env,
      ACCESS_TOKEN: process.env.ACCESS_TOKEN || '',
      SANDBOX: process.env.SANDBOX || 'true'
    }
  });

  // Log server output for debugging
  serverProcess.stdout.on('data', (data) => console.log(`Server stdout: ${data}`));
  serverProcess.stderr.on('data', (data) => console.error(`Server stderr: ${data}`));

  // Give the server a moment to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  const transport = new StdioClientTransport({
    process: serverProcess,
    closeOnDisconnect: true
  });
  
  const client = new Client({ name: "mcp-test", version: "1.0.0" });

  try {
    await client.connect(transport);
    console.log("Connected. Testing API access...");

    // First get type info for orders.list
    const typeInfo = await client.callTool("get_type_info", {
      service: "orders",
      operation: "list"
    });
    console.log("\nType info for orders.list:", JSON.stringify(typeInfo, null, 2));

    // Then make the API request
    const orders = await client.callTool("make_api_request", {
      service: "orders",
      operation: "list",
      params: {}
    });
    console.log("\nOrders list result:", JSON.stringify(orders, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    serverProcess.kill();
  }
})(); 