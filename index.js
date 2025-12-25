import express from "express";
import axios from "axios";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const API_KEY = process.env.OPENROUTER_KEY; // must exist in Render
const MODEL = "mistralai/mistral-tiny"; // supported, cheap, always works

app.post("/api/ask", async (req, res) => {
    try {
        const userMsg = req.body.message;
        if (!userMsg) return res.json({ reply: "No message received." });

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: MODEL,
                messages: [{ role: "user", content: userMsg }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "HTTP-Referer": "https://jarvis-frontend.com", // can be blank
                    "X-Title": "JARVIS-AI"
                }
            }
        );

        let reply = response.data.choices[0].message.content.trim();
        return res.json({ reply });

    } catch (err) {
        console.log("AI ERROR:", err.response?.data || err.message);
        return res.json({ reply: "AI connection failed sir." });
    }
});

app.get("/", (req, res) => res.send("JARVIS Backend Online ✔"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🟢 JARVIS running on port ${PORT}`));
