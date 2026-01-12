import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= PRIVATE CREDENTIALS ================= */
// CHANGE THESE (ONLY YOU KNOW)
const JARVIS_USER = process.env.JARVIS_USER || "dream";
const JARVIS_PASS = process.env.JARVIS_PASS || "ironman123";

/* ================= SIMPLE SESSION ================= */
let sessionActive = false;

app.get("/", (req,res)=> res.send("🟢 Jarvis backend online"));

/* ================= LOGIN ================= */
app.post("/api/login",(req,res)=>{
    const { username, password } = req.body;

    if(username === JARVIS_USER && password === JARVIS_PASS){
        sessionActive = true;
        return res.json({ success:true });
    }

    res.status(401).json({ success:false });
});

/* ================= AI MEMORY ================= */
let memory = [];

/* ================= PROTECTED AI ================= */
app.post("/api/ask", async(req,res)=>{
   if(!sessionActive){
       return res.status(403).json({
           reply:"Access denied. Authentication required.",
           action:"none"
       });
   }

   const prompt = req.body.prompt;
   if(!prompt) return res.status(400).json({reply:"No prompt received"});

   try{
       const response = await fetch("https://openrouter.ai/api/v1/chat/completions",{
           method:"POST",
           headers:{
               "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
               "Content-Type":"application/json"
           },
           body: JSON.stringify({
               model:"meta-llama/llama-3.1-8b-instruct",
               messages:[
                   {
                       role:"system",
                       content:`
You are JARVIS.
Professional, calm, robotic.
Short, precise replies.
Address user as "sir".
No roleplay.
JSON replies only.

FORMAT:
{"reply":"","action":"none|open|search","target":""}
                       `
                   },
                   ...memory.slice(-8),
                   {role:"user",content:prompt}
               ]
           })
       });

       const data = await response.json();
       const content = data?.choices?.[0]?.message?.content || "{}";

       let parsed;
       try{ parsed = JSON.parse(content); }
       catch{ parsed = {reply:content, action:"none"}; }

       memory.push({role:"user",content:prompt});
       memory.push({role:"assistant",content:parsed.reply});

       res.json(parsed);

   }catch{
       res.json({reply:"AI system failure.", action:"none"});
   }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`JARVIS backend on ${PORT}`));
