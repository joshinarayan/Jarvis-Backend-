import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.post("/api/ask", async (req, res) => {
    const userMsg = req.body.message;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "mistral/mistral-large-latest",
                messages: [
                    {
                        role: "system",
                        content: "You are JARVIS — confident AI assistant like Tony Stark. You respond with intelligence, short classy answers. You solve coding requests, general questions, jokes, anything."
                    },
                    { role: "user", content: userMsg }
                ]
            })
        });

        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });

    } catch (err) {
        res.json({ reply: "Backend error bro 😭" });
    }
});

app.get("/", (req,res)=>res.send("Jarvis backend online 🔥"));

app.listen(3000, ()=> console.log("Backend running on 3000"));
