import express from "express";

const app = express();
app.use(express.json());

/**
 * MCP tool discovery endpoint (REQUIRED)
 */
app.get("/mcp", (req, res) => {
  res.json({
    name: "SinapsisICU MCP Server",
    description: "Clinical Reasoning Engine for ICU assistants",
    tools: [
      {
        name: "ventilatory_reasoning",
        description: "Clinical ventilatory reasoning and decision support",
        input_schema: {
          type: "object",
          properties: {
            scenario: {
              type: "string",
              description: "Clinical scenario description"
            }
          },
          required: ["scenario"]
        }
      }
    ]
  });
});

/**
 * Tool execution endpoint
 */
app.post("/mcp/tools/ventilatory_reasoning", (req, res) => {
  const { scenario } = req.body;

  res.json({
    result: `Clinical reasoning generated for scenario: ${scenario}`
  });
});

/**
 * OpenAI domain verification
 */
app.get("/.well-known/openai-apps-challenge", (req, res) => {
  const token = process.env.OPENAI_APPS_VERIFICATION_TOKEN;
  if (!token) {
    return res.status(500).send("Missing OPENAI_APPS_VERIFICATION_TOKEN env var");
  }
  res.type("text/plain").send(token);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
