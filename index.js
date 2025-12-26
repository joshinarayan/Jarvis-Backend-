import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Jarvis online and ready, sir.");
});

app.post("/api/ask", async (req,res)=>{
    const prompt = req.body.prompt;

    if(!prompt){
        return res.status(400).json({error:"No message received"});
    }

    try{
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method:"POST",
            headers:{
                "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                model:"meta-llama/llama-3.1-8b-instruct",
                messages:[
                    {role:"system",content:"You are Jarvis. Speak professionally like an AI butler. Short replies."},
                    {role:"user",content:prompt}
                ]
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "System error.";

        res.json({reply});
    }catch(err){
        res.status(500).json({error:"AI system temporarily failed sir"});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Server Running on Port",PORT));
