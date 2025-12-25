import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "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";  // 👈 paste your key only here

// Root test endpoint
app.get("/", (req, res) => {
    res.send("🔥 Jarvis Backend Online — POST /api/ask");
});

// MAIN AI ROUTE
app.post("/api/ask", async (req, res) => {
    try {
        const userMessage = req.body.prompt;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",  // change model if you want
                messages: [
                    { role: "system", content: "You are JARVIS. Formal, masculine tone." },
                    { role: "user", content: userMessage }
                ]
            })
        });

        const data = await response.json();
        res.json({ reply: data.choices?.[0]?.message?.content || "No response" });

    } catch (err) {
        console.error(err);
        res.json({ error: "Backend Error — API request failed" });
    }
});

app.listen(3000, () => console.log("🚀 JARVIS backend active on port 3000"));
