import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // IMPORTANT for OpenRouter

const app = express();
app.use(cors());
app.use(express.json());

// Home check route
app.get("/", (req, res) => {
    res.send("Jarvis Backend Online 🚀");
});

// MAIN AI ROUTE
app.post("/api/ask", async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.json({ reply: "Bruh type something 😒" });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, // KEY will go in Render env
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Or any model you want
                messages: [
                    { role: "system", content: "You are Jarvis. Respond like Tony Stark's assistant. Flirty, cool, confident." },
                    { role: "user", content: userMessage }
                ]
            })
        });

        const data = await response.json();

        res.json({ reply: data.choices[0].message.content });
    } catch (err) {
        console.error(err);
        res.json({ reply: "Daddy something broke inside 😩🛠️" });
    }
});

// Render port
app.listen(process.env.PORT || 3000, () =>
    console.log("🔥 Backend Ready at PORT")
);
