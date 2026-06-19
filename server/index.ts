import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "perx-ai-wallet-api" });
});

app.post("/api/ai/recommendations", async (req, res) => {
  const answers = req.body?.answers ?? [];

  if (!openai) {
    res.json({
      source: "mock",
      recommendations: [
        {
          category: "Health",
          confidence: 92,
          reason: "Your routine suggests predictable wellness support would get used every month."
        },
        {
          category: "Food",
          confidence: 86,
          reason: "You value convenient weekday perks and flexible local redemption."
        },
        {
          category: "Mobility",
          confidence: 78,
          reason: "Commuting support fits your weekly schedule and keeps budget utility high."
        }
      ]
    });
    return;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Return JSON only with a recommendations array of exactly 3 items. Each item has category, confidence 0-100, and reason."
      },
      {
        role: "user",
        content: JSON.stringify({ answers })
      }
    ],
    response_format: { type: "json_object" }
  });

  res.json(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
});

app.listen(port, () => {
  console.log(`PerX AI Wallet API listening on http://localhost:${port}`);
});
