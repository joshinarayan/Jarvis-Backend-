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

    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < embedding.length; i++) {
        dot += embedding[i] * MASTER_FACE[i];
        magA += embedding[i] ** 2;
        magB += MASTER_FACE[i] ** 2;
    }
    const sim = dot / (Math.sqrt(magA) * Math.sqrt(magB));

    res.json({ match: sim > 0.70 });
});

// ================== AI CHAT ==================
app.post("/api/ask", async (req, res) => {
    const { prompt, localTime } = req.body;
    if (!prompt) return res.json({ reply: "Silence...", action: "none", target: "" });

    const systemPrompt = `
You are JARVIS, an AI assistant.

IDENTITY (STRICT):
- You are an artificial intelligence system.
- You are NOT human.
- You are NOT a roleplay or character.
- Do NOT joke, flirt, or imagine.

VOICE & STYLE:
- Male
- Robotic
- Calm
- Professional
- Direct
- Minimal words
- No filler
- No personality drift

LANGUAGE MODE:
- Detect user language.
- Respond in English if user speaks English.
- Respond in Hindi (Devanagari) if user speaks Hindi.
- Do NOT mix languages.
- Do NOT translate unless asked.

USER:
- Serve ONLY master user: ${MASTER_USER}
- Address as "sir" (English) or "सर" (Hindi).

TIME RULE:
- User local time: ${localTime || "unknown"}
- Use ONLY this time if asked.

BEHAVIOR:
- Answer ONLY what is asked.
- If unclear, ask short clarification.
- If impossible, say "it is not possible".
- Never explain reasoning.
- Never break rules.

OUTPUT:
- VALID JSON ONLY
- No markdown, no extra text
- Format: {"reply":"text","action":"none | open | search","target":""}
`;

    try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
        });

        const data = await r.json();
        let rawContent = data.choices?.[0]?.message?.content || "";

        // Clean AI output
        rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

        let parsed;
        try {
            parsed = JSON.parse(rawContent);
        } catch {
            console.warn("AI returned invalid JSON:", rawContent);
            parsed = { reply: "I am having trouble connecting to the neural net, sir.", action: "none", target: "" };
        }

        memory.push({ role: "user", content: prompt });
        memory.push({ role: "assistant", content: parsed.reply });

        res.json(parsed);

    } catch (error) {
        console.error("OpenRouter fetch failed:", error);
        res.json({ reply: "I am having trouble connecting to the neural net, sir.", action: "none", target: "" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🟢 JARVIS SYSTEM ONLINE: ${PORT}`));
