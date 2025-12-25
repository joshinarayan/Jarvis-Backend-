import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
    res.send("🚀 JARVIS backend online and operational.");
});

app.post("/api/ask", async (req, res) => {
    try {
        const userMessage = req.body.message || req.body.prompt; // FIXED HERE

        if (!userMessage) return res.json({ reply: "No prompt received sir!" });

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "mistral-nemo",
                messages: [
                    { role: "system", content: "You are JARVIS. Male tone. Intelligent. Formal but badass." },
                    { role: "user", content: userMessage }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({
            reply: response.data.choices[0].message.content.trim()
        });

    } catch (err) {
        console.log("AI ERROR:", err.response?.data || err.message);
        res.json({ reply: "AI system temporarily failed sir." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`🟢 JARVIS running on port ${PORT}`));
