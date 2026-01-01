import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req,res)=> res.send("🟢 Jarvis backend online, sir."));

// MEMORY (last 8 interactions)
let memory = [];

app.post("/api/ask", async(req,res)=>{
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
You are JARVIS. Professional, calm, robotic deep tone.
All replies must be short, precise, and address user as "sir".
You may suggest actions as JSON.

REPLY FORMAT STRICTLY as JSON ONLY:
{"reply":"Your text reply here","action":"none|open|search","target":"URL or search term"}

Rules:
- "action" can be:
   - "open" (open a website/app)
   - "search" (Google search)
   - "none" (just reply)
- "target" is optional. If "open" provide full URL, if "search" provide search query.
- Always reply in JSON even if action is none.
                   `
                   },
                   ...memory.slice(-8), // last 8 messages for light memory
                   {role:"user",content:prompt}
               ]
           })
       });

       const data = await response.json();
       const content = data?.choices?.[0]?.message?.content || "{}";

       let parsed;
       try{
           parsed = JSON.parse(content);
       }catch{
           parsed = {reply:content, action:"none", target:null};
       }

       // store light memory
       memory.push({role:"user",content:prompt});
       memory.push({role:"assistant",content:parsed.reply});

       res.json(parsed);

   }catch(err){
       console.log(err);
       res.json({reply:"AI system temporarily failed, sir.", action:"none", target:null});
   }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`JARVIS backend on ${PORT}`));
