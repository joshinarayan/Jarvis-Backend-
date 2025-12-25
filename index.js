import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/ask", async (req, res) => {
    const prompt = req.body.prompt;
    if (!prompt) return res.json({ reply: "No prompt received." });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-thinking-exp:free",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "No response from AI.";
        res.json({ reply });
    } catch (err) {
        res.json({ reply: "Backend error, check API key or server." });
    }
});

app.listen(process.env.PORT || 10000, () => console.log("JARVIS Online Sir."));
