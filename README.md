# 🎵 Spotify Clone — Full Stack

A dynamic, full-stack evolution of the [Spotify UI Clone](../spotify-clone) — same pixel-perfect UI, now wired up to **real search and real playback** using the YouTube Data API and the official YouTube IFrame Player API, with a small serverless backend that keeps the API key private.

> The original static UI-only project lives untouched in the sibling `spotify-clone/` folder and keeps its own separate deployment. This project is a new, independent app.

## ✨ What's dynamic now

- **Real search** — type in the search bar and get real songs/artists back.
- **Real playback** — click any card to actually play the track (audio via a small embedded YouTube player).
- **Full player controls** — play/pause, next/previous, seek, volume, shuffle, repeat.
- **Likes** — heart a track, persisted in your browser.
- **Recently played** — the "Recently Played" row reflects what you've actually played.
- **Playlists** — create playlists and add the currently playing track to one, persisted in your browser (`localStorage`, no account needed).

## 🛠️ Tech stack

- Vanilla HTML/CSS/JS (native ES modules, no bundler).
- YouTube Data API v3 (search) + YouTube IFrame Player API (playback).
- A Vercel serverless function (`api/search.js`) that proxies search requests so the API key never reaches the browser.
- A small Express server (`server/dev.js`, dev-only) that emulates the serverless function locally.

## 🔑 Getting a free YouTube Data API key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/), create (or pick) a project.
2. **APIs & Services → Library** → search "YouTube Data API v3" → **Enable**.
3. **APIs & Services → Credentials** → **Create Credentials → API key**.
4. (Recommended) Restrict the key to "YouTube Data API v3" only.
5. Free tier: 10,000 quota units/day (a search costs 100 units, so roughly 100 searches/day) — plenty for personal/portfolio use.

## 🚀 Running locally

```bash
npm install
cp .env.example .env   # then paste your key into .env as YOUTUBE_API_KEY=...
npm run dev
```

Open `http://localhost:3000`.

## 📁 Project structure

```
api/search.js     → serverless function: GET /api/search?q=...
server/dev.js      → local-only Express server (serves static files + /api/search)
js/                → frontend logic (api, player, storage, ui, main)
index.html          → same markup/classes as the original UI, dynamic content added
style.css            → original styles untouched, small additive rules appended
```

## ⚖️ A note on the YouTube embed

Playback uses the official YouTube IFrame Player, embedded (small, visible) rather than hidden — per YouTube's Terms of Service, embedded players must remain visibly rendered on the page. No audio is downloaded or ripped; this is standard, ToS-compliant embedding.

## ☁️ Deploying

Not deployed yet — this project is currently local-only. When ready: push to a new GitHub repo, import it into Vercel, and set `YOUTUBE_API_KEY` as an environment variable in the Vercel project settings.
