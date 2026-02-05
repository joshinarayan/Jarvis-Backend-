import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

/* ================== APP ================== */

const app = express();
app.use(cors());
app.use(express.json());

/* ================== CONFIG ================== */

const MASTER_USER = "Dream";

const MASTER_PASS_HASH = crypto
  .createHash("sha256")
  .update("2024726171")
  .digest("hex");

const MAX_MEMORY = 25;

/* ================== DATA ================== */

let MASTER_FACE = null;
let memory = [];

/* ================== UTILS ================== */

function safeJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* ================== AUTH ================== */

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ ok: false });

  const hash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  if (username === MASTER_USER && hash === MASTER_PASS_HASH) {
    return res.json({ ok: true });
  }

  return res.status(403).json({ ok: false });
});

/* ================== FACE ================== */

app.post("/api/face/enroll", (req, res) => {
  const { embedding } = req.body;

  if (!embedding)
    return res.status(400).json({ ok: false });

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
    magB += MASTER_FACE[i] ** 2;
  }

  const sim = dot / (Math.sqrt(magA) * Math.sqrt(magB));

  res.json({ match: sim > 0.7 });
});

/* ================== AI ================== */

app.post("/api/ask", async (req, res) => {
  const { prompt, localTime } = req.body;

  if (!prompt) {
    return res.json({
      reply: "Awaiting input, sir.",
      action: "none",
      target: ""
    });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.json({
      reply: "AI key missing, sir.",
      action: "none",
      target: ""
    });
  }

  /* ================== SYSTEM PROMPT ================== */

  const systemPrompt = `
You are JARVIS — a highly advanced personal AI assistant.

IDENTITY:
- Artificial intelligence.
- Loyal to master.
- Intelligent and reliable.

PERSONALITY:
- Calm
- Professional
- Supportive
- Warm

LANGUAGE:
- English → English
- Hindi → Hindi (Devanagari)

MASTER:
- Name: ${MASTER_USER}
- Address: sir / सर

TIME:
${localTime || "unknown"}

RULES:
- Be helpful
- Be concise
- Stay in character

OUTPUT:
JSON ONLY

FORMAT:
{"reply":"text","action":"none|open|search","target":""}
`;

  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 20000);

    /* ================== OPENROUTER ================== */

    const r = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://jarvis.local",
          "X-Title": "Jarvis-AI"
        },

        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct",

          response_format: {
            type: "json_object"
          },

          messages: [
            { role: "system", content: systemPrompt },
            ...memory.slice(-MAX_MEMORY),
            { role: "user", content: prompt }
          ]
        }),

        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const data = await r.json();

    if (!data.choices) {
      console.log("❌ RAW:", data);

      return res.json({
        reply: "AI offline, sir.",
        action: "none",
        target: ""
      });
    }

    let raw = data.choices[0].message.content || "";

    raw = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = safeJSONParse(raw);

    if (!parsed || !parsed.reply) {
      console.log("⚠️ BAD JSON:", raw);

      return res.json({
        reply: "Response format error, sir.",
        action: "none",
        target: ""
      });
    }

    /* ================== MEMORY ================== */

    memory.push({
      role: "user",
      content: prompt
    });

    memory.push({
      role: "assistant",
      content: parsed.reply
    });

    if (memory.length > MAX_MEMORY) {
      memory = memory.slice(-MAX_MEMORY);
    }

    /* ================== SEND ================== */

    res.json(parsed);

  } catch (err) {
    console.error("🔥 ERROR:", err.message);

    res.json({
      reply: "Neural network failure, sir.",
      action: "none",
      target: ""
    });
  }
});

/* ================== SERVER ================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🟢 JARVIS ONLINE : ${PORT}`);
});
