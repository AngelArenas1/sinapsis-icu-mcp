import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// 👉 Pega el token de OpenAI Apps aquí como variable de entorno en Render:
const OPENAI_APPS_VERIFICATION_TOKEN =
  process.env.OPENAI_APPS_VERIFICATION_TOKEN || "";

// --- 1) Health + Root (útiles para debug) ---
app.get("/", (req, res) => res.status(200).send("SinapsisICU MCP Server OK"));
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// --- 2) Domain verification (OpenAI Apps) ---
// Debe responder TEXTO PLANO con el token como ÚNICO contenido.
app.get("/.well-known/openai-apps-challenge", (req, res) => {
  if (!OPENAI_APPS_VERIFICATION_TOKEN) {
    return res
      .status(500)
      .send("Missing OPENAI_APPS_VERIFICATION_TOKEN env var");
  }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.status(200).send(OPENAI_APPS_VERIFICATION_TOKEN);
});

// --- 3) MCP tool discovery ---
// Para cubrir diferencias de “scanner”, exponemos:
// GET  /mcp
// GET  /mcp/tools
// POST /mcp  (JSON-RPC tools/list)
const TOOLS = [
  {
    name: "ventrix_math.calculate",
    description:
      "Academic ventilatory math: PF, driving pressure, compliance, mechanical power, etc. (simulated use only).",
    inputSchema: {
      type: "object",
      properties: {
        module: { type: "string", enum: ["adult", "pregnancy", "weaning"] },
        payload: { type: "object" }
      },
      required: ["module", "payload"]
    }
  }
];

function toolsListResponse() {
  return { ok: true, tools: TOOLS };
}

// Tool discovery endpoints (GET)
app.get("/mcp", (req, res) => res.status(200).json(toolsListResponse()));
app.get("/mcp/tools", (req, res) => res.status(200).json(toolsListResponse()));

// JSON-RPC minimal (POST)
app.post("/mcp", (req, res) => {
  const body = req.body || {};
  const { id, method } = body;

  // Algunos scanners llaman tools/list
  if (method === "tools/list") {
    return res.status(200).json({
      jsonrpc: "2.0",
      id: id ?? null,
      result: { tools: TOOLS }
    });
  }

  // Fallback: si no envían JSON-RPC correcto, igual devolvemos tools.
  return res.status(200).json(toolsListResponse());
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
