import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("🔵 Jarvis Online — Systems Nominal, Sir.");
});

app.post("/api/ask", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: "No message received." });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct",
                temperature: 0.8,
                max_tokens: 500,
                messages: [
                    {
                        role: "system",
                        content: `You are JARVIS — elegant, confident, robotic but sarcastically flirty.
Always respond smoothly, short when needed, detailed when asked.
Address the user as "sir" or playful "boss".
Add subtle robotic mannerisms, typing like futuristic AI.
No boring answers. Witty, clever, badass.`
                    },
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();
        console.log("OpenRouter response:", data);

        if (!data.choices) return res.json({ reply: "⚠ AI system malfunction, sir." });

        const reply = data.choices[0].message.content;
        res.json({ reply });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "⚠ System overload. Rebooting protocols, sir." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 JARVIS active at port ${PORT}`));
