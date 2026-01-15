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

    // Simple SHA256 Hash Check
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
    
    // Euclidean distance / Similarity Mock
    // Since we use random numbers in frontend, this is just logic proofing
    // Real face-api.js logic would go here
    let dot = 0, magA = 0, magB = 0;
    for(let i=0; i<embedding.length; i++){
        dot += embedding[i] * MASTER_FACE[i];
        magA += embedding[i]**2;
        magB += MASTER_FACE[i]**2;
    }
    const sim = dot / (Math.sqrt(magA) * Math.sqrt(magB));
    
    // Lower threshold for random number simulation
    res.json({ match: sim > 0.70 });
});

app.post("/api/ask", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.json({ reply: "Silence...", action: "none" });

    // Add Context
    const systemPrompt = `
    You are JARVIS. AI Assistant for user ${MASTER_USER}.
    Traits: Loyal, Efficient, Witty, slightly Robotic.
    Response format: JSON ONLY. Do not use Markdown blocks.
    Structure: {"reply": "your response string", "action": "none" | "open" | "search", "target": "url or query"}
    Current Date: ${new Date().toLocaleString()}
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
                    ...memory.slice(-6), // Keep context short
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await r.json();
        let rawContent = data.choices[0].message.content;

        // SANITIZER: Remove markdown code blocks if AI adds them
        rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(rawContent);

        // Update Memory
        memory.push({ role: "user", content: prompt });
        memory.push({ role: "assistant", content: parsed.reply });

        res.json(parsed);

    } catch (error) {
        console.error("AI Error:", error);
        res.json({ 
            reply: "I am having trouble connecting to the neural net, sir.", 
            action: "none" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🟢 JARVIS SYSTEM ONLINE: ${PORT}`));
