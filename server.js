import dotenv from "dotenv";
dotenv.config();
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import plansRouter from "./routes/plans.js";
import chatRouter from "./routes/chat.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- API routes ---
app.use("/api/chat", chatRouter);
app.use("/api/plans", plansRouter);

// --- Serve static frontend ---
app.use(express.static(__dirname));

// --- Fallback route for SPA navigation ---
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
