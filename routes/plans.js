import express from "express";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/plans.json");

router.post("/recommend", async (req, res) => {
  const { category, familySize = 1, dataNeed, maxPrice = 9999, operators = [] } = req.body;

  try {
    const file = await readFile(dataPath, "utf-8");
    const plans = JSON.parse(file);

    let results = [...plans];

    // --- Filter by category ---
    if (category) {
      results = results.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    // --- Operator filter ---
    if (operators.length > 0) {
      results = results.filter(p => operators.includes(p.operator));
    }

    // --- Data filter ---
    if (dataNeed) {
      results = results.filter(p => {
        const data = (p.data || "").toLowerCase();
        if (dataNeed === "low") return /(3|6|8|10)/.test(data);
        if (dataNeed === "medium") return /(20|25|30|40)/.test(data);
        if (dataNeed === "high") return /(100|obegränsad)/.test(data);
        return true;
      });
    }

    // --- Price filter ---
    results = results.filter(p => {
      if (Array.isArray(p.prices)) {
        const idx = Math.min(familySize - 1, p.prices.length - 1);
        return p.prices[idx] <= maxPrice;
      }
      return p.price && p.price <= maxPrice;
    });

    // --- If we found matches ---
    if (results.length > 0) {
      console.log(`✅ Found ${results.length} matching plans`);
      return res.json(results.slice(0, 6));
    }

    // --- No exact match → calculate closest ---
    console.log("⚙️ No exact match — returning top 3 closest");
    const scored = plans
      .filter(p => p.category?.toLowerCase() === category.toLowerCase())
      .map(p => {
        const price = Array.isArray(p.prices)
          ? p.prices[Math.min(familySize - 1, p.prices.length - 1)]
          : p.price || 9999;

        const priceDiff = Math.abs(price - maxPrice);
        const dataMatch =
          (dataNeed === "low" && /(3|6|8|10)/.test(p.data)) ||
          (dataNeed === "medium" && /(20|25|30|40)/.test(p.data)) ||
          (dataNeed === "high" && /(100|obegränsad)/.test(p.data))
            ? 1
            : 0;

        const operatorMatch = operators.includes(p.operator) ? 1 : 0;
        const score = priceDiff / 50 - dataMatch - operatorMatch;

        return { ...p, matchScore: score };
      })
      .sort((a, b) => a.matchScore - b.matchScore);

    res.json(scored.slice(0, 3));
  } catch (err) {
    console.error("❌ Error in /recommend:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
