import OpenAI from "openai";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { hiteshPersona } from "../persona/hitesh.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    // origin: [
    //   "http://localhost:5173",
    //   "https://myfrontend.com",
    //   "https://chaicode-chat-fe.vercel.app/",
    //   "https://chaicode-chat-fe.vercel.app",
    //   '*'
    // ],
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const messages = [
      { role: "system", content: hiteshPersona.system_instruction },
      { role: "user", content: message },
    ];

    // Call OpenAI with streaming enabled
    const stream = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: messages,
      stream: true,
    });

    let assistantReply = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        assistantReply += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    messages.push({ role: "assistant", content: assistantReply });

    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
