import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "perx-ai-wallet-api" });
});

app.post("/api/upload-image", async (req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: "Supabase service role is not configured." });
    return;
  }

  const base64 = typeof req.body?.base64 === "string" ? req.body.base64 : "";
  const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "image/jpeg";
  const folder = req.body?.folder === "logos" ? "logos" : "offers";

  if (!base64) {
    res.status(400).json({ error: "Missing base64 image payload." });
    return;
  }

  try {
    const buffer = Buffer.from(base64, "base64");
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("gif")
          ? "gif"
          : "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await supabaseAdmin.storage.from("offer-images").upload(path, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: false
    });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data } = supabaseAdmin.storage.from("offer-images").getPublicUrl(path);
    res.json({ url: data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    res.status(500).json({ error: message });
  }
});

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
