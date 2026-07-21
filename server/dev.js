require("dotenv").config();
const path = require("path");
const express = require("express");
const searchHandler = require("../api/search");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/search", (req, res) => {
  searchHandler(req, res);
});

app.use(express.static(path.join(__dirname, "..")));

app.listen(PORT, () => {
  console.log(`Spotify clone dev server running at http://localhost:${PORT}`);
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn("Warning: YOUTUBE_API_KEY is not set in .env — /api/search will return 500.");
  }
});
