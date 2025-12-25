import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Jarvis backend is online 💚");
});

app.post("/api/ask", async (req,res)=>{
    const userMsg = req.body.message;

    try{
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${process.env.OPENROUTER_KEY}`
            },
            body:JSON.stringify({
                model:"gpt-3.5-turbo",
                messages:[{role:"user",content:userMsg}]
            })
        });

        const data = await r.json();
        const reply = data.choices?.[0]?.message?.content || "No response sir.";

        res.json({reply});
    }catch(err){
        res.json({reply:"Backend error."});
    }
});

app.listen(3000,()=>console.log("Server live 🔥"));
