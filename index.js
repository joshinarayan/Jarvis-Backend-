import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================== HARD AUTH ==================
const MASTER_USER = "Dream";
const MASTER_PASS_HASH = crypto
  .createHash("sha256")
  .update("2024726171")
  .digest("hex");

// ================== FACE STORE ==================
let MASTER_FACE = null; // Float32Array stored as normal array

// ================== LOGIN ==================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ ok: false });

  const hash = crypto.createHash("sha256").update(password).digest("hex");

  if (username === MASTER_USER && hash === MASTER_PASS_HASH) {
    return res.json({ ok: true });
  }

  return res.status(403).json({ ok: false });
});

// ================== FACE ENROLL ==================
app.post("/api/face/enroll", (req, res) => {
  const { embedding } = req.body;
  if (!embedding || !Array.isArray(embedding))
    return res.status(400).json({ ok: false });

  MASTER_FACE = embedding;
  console.log("✅ MASTER FACE ENROLLED");
  res.json({ ok: true });
});

// ================== FACE VERIFY ==================
app.post("/api/face/verify", (req, res) => {
  if (!MASTER_FACE) return res.json({ match: false });

  const { embedding } = req.body;
  if (!embedding) return res.json({ match: false });

  let dot = 0,
    normA = 0,
    normB = 0;

  for (let i = 0; i < embedding.length; i++) {
    dot += embedding[i] * MASTER_FACE[i];
    normA += embedding[i] ** 2;
    normB += MASTER_FACE[i] ** 2;
  }

  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  res.json({ match: similarity > 0.85 });
});

// ================== AI ==================
let memory = [];

app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.json({ reply: "No input", action: "none" });

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: `
You are JARVIS.
Male, robotic, calm.
Always call user "sir".
Short replies.
JSON ONLY.

{"reply":"text","action":"none|open|search","target":""}
`,
          },
          ...memory.slice(-6),
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await r.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    memory.push({ role: "user", content: prompt });
    memory.push({ role: "assistant", content: parsed.reply });

    res.json(parsed);
  } catch {
    res.json({ reply: "AI offline, sir.", action: "none" });
  }
});

app.listen(3000, () =>
  console.log("🟢 JARVIS BACKEND HARDCORE ONLINE")
);
