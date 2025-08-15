import OpenAI from "openai";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { hiteshPersona } from "./persona/hitesh.js";
import { piyushPersona } from "./persona/piyush.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
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
    const { message, mentor } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    let systemPrompt =
      mentor === "hitesh"
        ? hiteshPersona.system_instruction
        : piyushPersona.system_instruction;

    const messages = [
      {
        role: "system",
        content: systemPrompt || hiteshPersona.system_instruction,
      },
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
