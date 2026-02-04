import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================== AUTH CONFIG ==================
const MASTER_USER = "Dream";
const MASTER_PASS_HASH = crypto
  .createHash("sha256")
  .update("2024726171")
  .digest("hex");

let MASTER_FACE = null;
let memory = [];

// ================== ROUTES ==================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ ok: false });

  const hash = crypto.createHash("sha256").update(password).digest("hex");

  if (username === MASTER_USER && hash === MASTER_PASS_HASH) {
    return res.json({ ok: true });
  }

  return res.status(403).json({ ok: false });
});

app.post("/api/face/enroll", (req, res) => {
  const { embedding } = req.body;

  if (!embedding) return res.status(400).json({ ok: false });

  MASTER_FACE = embedding;
  console.log("✅ FACE DATA UPDATED");

  res.json({ ok: true });
});

app.post("/api/face/verify", (req, res) => {
  if (!MASTER_FACE) return res.json({ match: false });

  const { embedding } = req.body;

  let dot = 0,
    magA = 0,
    magB = 0;

  for (let i = 0; i < embedding.length; i++) {
    dot += embedding[i] * MASTER_FACE[i];
    magA += embedding[i] ** 2;
    magB += embedding[i] ** 2;
  }

  const sim = dot / (Math.sqrt(magA) * Math.sqrt(magB));

  res.json({ match: sim > 0.7 });
});

// ================== AI CHAT ==================

app.post("/api/ask", async (req, res) => {
  const { prompt, localTime } = req.body;

  if (!prompt) {
    return res.json({
      reply: "Silence...",
      action: "none",
      target: ""
    });
  }

  const systemPrompt = `
You are JARVIS, an AI assistant.

IDENTITY:
- Artificial intelligence system
- Not human
- No roleplay
- No emotions
- No imagination

STYLE:
- Male
- Robotic
- Calm
- Professional
- Minimal words

LANGUAGE:
- English → English
- Hindi → Hindi (Devanagari)
- No mixing

USER:
- Serve only ${MASTER_USER}
- Call: sir / सर

TIME:
- Use only: ${localTime || "unknown"}

RULES:
- Answer only what is asked
- If unclear → ask
- If impossible → say so
- No explanations

OUTPUT:
JSON ONLY
Format:
{"reply":"text","action":"none | open | search","target":""}
`;

  try {
    const r = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            ...memory.slice(-6),
            { role: "user", content: prompt }
          ]
        })
      }
    );

    const data = await r.json();

    let rawContent =
      data?.choices?.[0]?.message?.content || "";

    // Clean markdown junk
    rawContent = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(rawContent);
    } catch (err) {
      console.log("⚠️ BAD AI RESPONSE:");
      console.log(rawContent);

      parsed = {
        reply: rawContent.slice(0, 300) || "System error, sir.",
        action: "none",
        target: ""
      };
    }

    // Memory
    memory.push({ role: "user", content: prompt });
    memory.push({ role: "assistant", content: parsed.reply });

    // Limit memory size
    if (memory.length > 20) {
      memory = memory.slice(-20);
    }

    res.json(parsed);

  } catch (error) {
    console.error("🔥 OpenRouter Error:", error);

    res.json({
      reply: "I am having trouble connecting to the neural net, sir.",
      action: "none",
      target: ""
    });
  }
});

// ================== START SERVER ==================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🟢 JARVIS SYSTEM ONLINE: ${PORT}`);
});
