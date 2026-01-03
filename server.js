import express from "express";
import {
  McpServer,
  Tool
} from "@modelcontextprotocol/sdk/server/index.js";

const app = express();
app.use(express.json());

/**
 * MCP SERVER
 */
const mcpServer = new McpServer({
  name: "SinapsisICU MCP Server",
  version: "1.0.0",
  description: "Clinical reasoning orchestration layer for SinapsisICU"
});

/**
 * TOOL: ping (obligatoria para validación)
 */
mcpServer.registerTool(
  new Tool({
    name: "ping",
    description: "Health check tool for MCP validation",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    execute: async () => ({
      status: "ok",
      message: "SinapsisICU MCP server is alive"
    })
  })
);

/**
 * === MCP REQUIRED ENDPOINTS ===
 */

/**
 * Tool discovery (ESTE ERA EL FALTANTE)
 * OpenAI llama aquí primero
 */
app.get("/.well-known/mcp/tools", (req, res) => {
  res.json({
    tools: mcpServer.listTools()
  });
});

/**
 * MCP protocol handler
 */
app.post("/mcp", async (req, res) => {
  try {
    const response = await mcpServer.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    console.error("MCP error:", error);
    res.status(500).json({
      error: "MCP server error",
      details: error.message
    });
  }
});

/**
 * Root health check
 */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "sinapsis-icu-mcp",
    mcp: true
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SinapsisICU MCP server running on port ${PORT}`);
});
