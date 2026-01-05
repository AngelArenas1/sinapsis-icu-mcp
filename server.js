import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());

// -----------------------------
// 1) OpenAI Domain Verification
// -----------------------------
// OpenAI te pide servir el token como contenido plano en:
// /.well-known/openai-apps-challenge
app.get("/.well-known/openai-apps-challenge", (req, res) => {
  const token = process.env.OPENAI_APPS_VERIFICATION_TOKEN;
  if (!token) {
    // Importante: NO devuelvas 404; devuelve 200 con mensaje claro
    return res.status(200).type("text/plain").send("MISSING_TOKEN");
  }
  return res.status(200).type("text/plain").send(token);
});

// -----------------------------
// 2) MCP Server (Streamable HTTP)
// -----------------------------
const mcp = new McpServer({
  name: "sinapsis-icu-mcp",
  version: "1.0.0"
});

// Tool de ejemplo: el tuyo (ventrix_math.calculate)
mcp.tool(
  "ventrix_math.calculate",
  "Academic ventilatory math: PF, driving pressure, compliance, mechanical power, etc. (simulated use only).",
  {
    module: z.enum(["adult", "pregnancy", "weaning"]).describe("Calculation module"),
    payload: z.record(z.any()).describe("Module input payload")
  },
  async ({ module, payload }) => {
    // Respuesta MCP estándar: content[]
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              tool: "ventrix_math.calculate",
              module,
              received_payload_keys: Object.keys(payload ?? {})
            },
            null,
            2
          )
        }
      ]
    };
  }
);

// Transport Streamable HTTP (stateless)
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined // stateless (recomendado para Render/scale-to-zero)
});

// Conecta el server MCP al transport una sola vez
await mcp.connect(transport);

// Endpoint MCP real: POST /mcp
app.post("/mcp", async (req, res) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP handleRequest error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  }
});

// Buenas prácticas: GET/DELETE en /mcp => 405 (como referencia pública)
app.get("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null
  });
});
app.delete("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null
  });
});

// Healthcheck simple (para Render)
app.get("/health", (req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
