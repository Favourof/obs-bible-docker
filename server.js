const express = require("express");
const path = require("path");
const fs = require("fs");
// const { log } = require("console");

const app = express();
const PORT = 3000;

app.use(express.json());

// Load Bible JSON (small sample or full KJV)
const bibleData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "kjv.json"), "utf8")
);

// ✅ Build verse index for fast lookup
const verseIndex = {};
bibleData.verses.forEach((v) => {
  const key = `${v.book_name.toLowerCase()}|${v.chapter}|${v.verse}`;
  verseIndex[key] = v.text;
});

// Store the latest verse
let latestVerse = {
  reference: "",
  text: "",
};

// Keep a list of SSE clientsx
let clients = [];

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Main UI route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API to get whole Bible data
app.get("/api/bible", (req, res) => {
  res.json(bibleData);
});

// API to search by book/chapter/verse
app.get("/api/search", (req, res) => {
  let { book, chapter, verse } = req.query;
  console.log(book);

  if (!book || !chapter || !verse) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Normalize book name to lowercase for matching
  book = book.toLowerCase();
  const key = `${book}|${chapter}|${verse}`;

  const text = verseIndex[key];

  if (text) {
    res.json({
      reference: `${book.replace(/\b\w/g, (c) =>
        c.toUpperCase()
      )} ${chapter}:${verse}`,
      text,
    });
  } else {
    res.status(404).json({ error: "Verse not found" });
  }
});

// ✅ API to set latest verse and push to SSE clients
app.post("/api/set-latest-verse", (req, res) => {
  const { reference, text } = req.body;
  latestVerse = { reference, text };
  console.log("✅ Updated latest verse:", latestVerse);

  // Send update to all connected SSE clients
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(latestVerse)}\n\n`);
  });

  res.json({ message: "Verse updated successfully" });
});

// ✅ SSE stream for overlay
app.get("/api/verse-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Push current verse immediately
  res.write(`data: ${JSON.stringify(latestVerse)}\n\n`);

  // Add client to list
  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  req.on("close", () => {
    clients = clients.filter((c) => c.id !== clientId);
  });
});

app.listen(PORT, () => {
  console.log(`✅ OBS Bible Plugin running at http://localhost:${PORT}`);
});
