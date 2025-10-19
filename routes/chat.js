import express from "express";
import { readFile } from "fs/promises";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/plans.json");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.json({ reply: "Jag hörde dig inte riktigt — kan du skriva om frågan?" });
  }

  try {
    const plans = JSON.parse(await readFile(dataPath, "utf-8"));

    // Include plan data for context
    const context = plans
      .map(
        (p) =>
          `${p.operator}: ${p.title} — ${p.data || ""}, ${p.price || p.prices?.[0]} kr/mån. ${p.text || ""}`
      )
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Du är Adealas hjälpsamma svenska AI-assistent. 
          Du känner till dessa erbjudanden:\n${context}\n
          Om användaren frågar om abonnemang, operatörer eller priser — hänvisa till rätt sida:
          - 'quiz-mobil-start.html' för mobil
          - 'quiz-familj-start.html' för familj
          - 'quiz-bredband.html' för bredband
          - 'erbjudande.html' för aktuella erbjudanden.
          Om frågan inte handlar om abonnemang, svara vänligt och naturligt på svenska.`,
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "Oj, något gick fel när jag försökte svara 😅" });
  }
});

export default router;
