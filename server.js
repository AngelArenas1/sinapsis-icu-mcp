import express from "express";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "Sinapsis ICU MCP",
    version: "0.1.0",
    description: "Clinical Reasoning MCP for Sinapsis ICU",
    tools: [
      {
        name: "health_check",
        description: "Check MCP availability",
        input_schema: {
          type: "object",
          properties: {}
        }
      }
    ]
  });
});

app.post("/tools/health_check", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`MCP running on port ${port}`)
);
