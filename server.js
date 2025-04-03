import express from "express";
import bodyParser from "body-parser";
import MeCab from "mecab-async";

const app = express();
const mecab = new MeCab();
const port = process.env.PORT || 3000;

// Example secret token (store securely in real apps)
const AUTH_TOKEN = "RATH";

app.use(bodyParser.json());

// Middleware to check Authorization header
function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (token !== AUTH_TOKEN) {
    return res.status(403).json({ error: "Invalid token" });
  }

  next();
}

app.post("/parse", checkAuth, (req, res) => {
  const { sentence } = req.body;

  if (!sentence) {
    return res
      .status(400)
      .json({ error: 'Missing "sentence" in request body' });
  }

  mecab.parse(sentence, (err, result) => {
    if (err) {
      console.error("MeCab error:", err);
      return res.status(500).json({ error: "MeCab parsing failed" });
    }
    const words = [];
    const pronouces1 = [];
    const pronouces2 = [];

    for (const item of result) {
      const isJapanese = /[\u3040-\u30FF\u4E00-\u9FFF]/.test(item[0]); // Hiragana, Katakana, Kanji

      if (!isJapanese) continue;

      // avoid duplicate
      if (words.some((word) => word.word === item[0])) continue;

      words.push({
        word: item[0],
        pronouce1: item[8],
        pronouce2: item[9],
      })
    }

    res.json({
      words,
    });

    // res.json({ result });
  });
});

app.listen(port, () => {
  console.log(`MeCab API server running on http://localhost:${port}`);
});
