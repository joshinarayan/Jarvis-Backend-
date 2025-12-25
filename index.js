import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: "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",    // <--- PUT YOUR OPENROUTER KEY
  baseURL: "https://openrouter.ai/api/v1"
});

// Default URL so Render doesn't show CANNOT GET /
app.get("/", (req, res) => {
  res.send("🔥 Jarvis Backend Online — POST /api/ask to interact.");
});

// Main Jarvis AI route
app.post("/api/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt || "Hello";

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are Jarvis from Iron Man. Respond formal yet friendly, call user 'Sir', speak smooth & intelligent. If casual greeting like 'wassup', respond naturally." },
        { role: "user", content: prompt }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Backend Error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`JARVIS online on port ${port}`));
