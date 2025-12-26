import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Jarvis online, fully operational sir.");
});

app.post("/api/ask", async (req,res)=>{
    const { prompt } = req.body;
    if(!prompt) return res.status(400).json({error:"No message received"});

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method:"POST",
            headers:{
                "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                model:"meta-llama/llama-3.1-8b-instruct",
                messages:[
                    {role:"system", content:`
                        You are JARVIS — professional, calm, confident.
                        Respond short, robotic, intelligent.
                        Format clean spacing. No paragraphs unless needed.
                    `},
                    {role:"user", content:prompt}
                ]
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "System damaged sir.";

        res.json({reply});
    } catch (error){
        res.status(500).json({reply:"System temporarily down sir."});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`JARVIS active at port ${PORT}`));
