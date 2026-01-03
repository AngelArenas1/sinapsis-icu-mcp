import express from "express";

const app = express();

// --- Middlewares ---
app.use(express.json({ limit: "1mb" }));

// CORS amplio (útil para scanners/validadores)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// --- Tools registry (ajusta aquí tus tools reales) ---
const TOOLS = [
  {
    name: "ventrix_math.calculate",
    description:
      "Academic ventilatory math: PF, driving pressure, compliance, mechanical power, etc. (simulated use only).",
    inputSchema: {
      type: "object",
      properties: {
        module: { type: "string", enum: ["adult", "pregnancy", "weaning"] },
        payload: { type: "object" },
      },
      required: ["module", "payload"],
    },
  },
];

// --- Domain verification (OpenAI Apps) ---
app.get("/.well-known/openai-apps-challenge", (req, res) => {
  const token = process.env.OPENAI_APPS_VERIFICATION_TOKEN;
  if (!token) return res.status(500).send("Missing OPENAI_APPS_VERIFICATION_TOKEN env var");
  res.type("text/plain").send(token);
});

// --- Basic health ---
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// --- Tool discovery (varias rutas para evitar 404 del scanner) ---
function sendTools(req, res) {
  res.type("application/json").status(200).send(JSON.stringify({ ok: true, tools: TOOLS }));
}

app.get("/mcp", sendTools);
app.get("/mcp/tools", sendTools);
app.get("/tools", sendTools);

// --- Invocation (placeholder; aquí conectas lógica real) ---
async function handleInvoke(req, res) {
  const { name, arguments: args } = req.body || {};

  if (!name) return res.status(400).json({ ok: false, error: "Missing tool name" });

  // Ejemplo: solo demostración para no romper el pipeline MCP
  if (name === "ventrix_math.calculate") {
    // Aquí iría tu cálculo real
    return res.json({
      ok: true,
      result: {
        note: "Simulated response",
        received: { name, args },
      },
    });
  }

  return res.status(404).json({ ok: false, error: `Unknown tool: ${name}` });
}

app.post("/mcp/invoke", handleInvoke);
app.post("/invoke", handleInvoke);

// --- Start ---
const port = Number(process.env.PORT || 10000);
app.listen(port, () => {
  console.log(`MCP server listening on port ${port}`);
});
