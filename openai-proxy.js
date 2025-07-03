// openai-proxy.js
// Simple backend proxy for OpenAI API

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = 3001; // You can change this if needed

// Replace with your actual OpenAI API key
const OPENAI_API_KEY = "sk-proj-..."; // <-- Put your key here or use an environment variable

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant for L'Oréal. Only answer questions about L'Oréal products, beauty routines, recommendations, or beauty-related topics. If a question is not related to these, politely refuse to answer and explain that you can only help with L'Oréal and beauty topics.",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Error connecting to OpenAI" });
  }
});

app.listen(PORT, () => {
  console.log(`OpenAI proxy server running on http://localhost:${PORT}`);
});
