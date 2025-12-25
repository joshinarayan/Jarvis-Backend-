import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.OPENROUTER_API_KEY;

app.post("/api/ask", async (req, res) => {
    let prompt = req.body.prompt || req.body.message; // ← accept both

    if (!prompt) return res.json({ reply: "No prompt received ⚠️" });

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",           // you can change later
                messages: [{ role: "user", content: prompt }]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                }
            }
        );

        let reply = response.data.choices?.[0]?.message?.content || "No response";
        res.json({ reply });

    } catch (err) {
        console.log("AI ERROR:", err.response?.data);
        res.json({ reply: "AI system temporarily failed sir." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🟢 JARVIS Online on port", PORT));
