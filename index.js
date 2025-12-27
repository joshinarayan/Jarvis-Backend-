import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req,res)=> res.send("🟢 Jarvis backend online, sir."));

// MEMORY (future persistent can be added later)
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
           body:JSON.stringify({
               model:"meta-llama/llama-3.1-8b-instruct",
               messages:[
                   {role:"system",content:"You are JARVIS. Professional, calm, robotic deep tone. Short, precise answers. Address user as 'sir'."},
                   ...memory.slice(-8), // light memory
                   {role:"user",content:prompt}
               ]
           })
       });

       const data = await response.json();
       const reply = data?.choices?.[0]?.message?.content || "Error processing request";

       memory.push({role:"user",content:prompt});
       memory.push({role:"assistant",content:reply});

       res.json({reply});
   }catch{
       res.json({reply:"AI system temporarily failed, sir."});
   }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`JARVIS backend on ${PORT}`));
