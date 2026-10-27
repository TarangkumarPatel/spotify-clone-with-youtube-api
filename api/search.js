const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const MUSIC_CATEGORY_ID = "10";

const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

// The YouTube Data API returns titles HTML-encoded (e.g. "Rock &amp; Roll", "Don&#39;t").
function decodeEntities(text = "") {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === "#") {
      const num = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return num >= 0 && num <= 0x10ffff ? String.fromCodePoint(num) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

module.exports = async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "YOUTUBE_API_KEY is not configured on the server." });
    return;
  }

  const q = (req.query.q || "").toString().trim();
  if (!q) {
    res.status(400).json({ error: "Missing required query parameter: q" });
    return;
  }

  const maxResults = Math.min(parseInt(req.query.maxResults, 10) || 20, 25);

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: MUSIC_CATEGORY_ID,
    maxResults: String(maxResults),
    q,
    key: apiKey,
  });

  try {
    const ytRes = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`);
    const data = await ytRes.json();

    if (!ytRes.ok) {
      const message = data?.error?.message || "YouTube API request failed.";
      res.status(ytRes.status).json({ error: message });
      return;
    }

    const tracks = (data.items || [])
      .filter((item) => item.id && item.id.videoId)
      .map((item) => ({
        id: item.id.videoId,
        title: decodeEntities(item.snippet.title),
        artist: decodeEntities(item.snippet.channelTitle),
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
      }));

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).json({ tracks });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach YouTube API." });
  }
};
