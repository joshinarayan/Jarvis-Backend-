import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors()); // allow requests from anywhere
app.use(express.json());

// POST /api/ask
app.post("/api/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // Use environment variable for OpenRouter key
    const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
    if (!OPENROUTER_KEY) {
      return res.status(500).json({ reply: "Server misconfigured: missing API key." });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are JARVIS, Tony Stark's AI assistant. Reply confidently and clearly, always."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I am online, sir.";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Backend error, sir." });
  }
});

// PORT for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`JARVIS backend running on port ${PORT}`));
