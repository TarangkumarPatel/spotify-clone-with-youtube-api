const STORAGE_KEY = "spotify_clone_state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no state");
    const parsed = JSON.parse(raw);
    const trackCache = parsed.trackCache || {};
    // Tracks saved by older versions may still contain HTML entities (e.g. "&amp;").
    Object.values(trackCache).forEach((track) => {
      track.title = decodeEntities(track.title);
      track.artist = decodeEntities(track.artist);
    });
    return {
      likedIds: parsed.likedIds || [],
      recentlyPlayedIds: parsed.recentlyPlayedIds || [],
      playlists: parsed.playlists || [],
      trackCache,
    };
  } catch {
    return { likedIds: [], recentlyPlayedIds: [], playlists: [], trackCache: {} };
  }
}

function decodeEntities(text) {
  if (typeof text !== "string" || !text.includes("&")) return text;
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (e.g. private mode) — keep working in memory.
  }
}

let state = loadState();

function cacheTrack(track) {
  state.trackCache[track.id] = track;
}

function resolveTracks(ids) {
  return ids.map((id) => state.trackCache[id]).filter(Boolean);
}

export function toggleLike(track) {
  cacheTrack(track);
  const idx = state.likedIds.indexOf(track.id);
  if (idx === -1) {
    state.likedIds.unshift(track.id);
  } else {
    state.likedIds.splice(idx, 1);
  }
  saveState(state);
  return state.likedIds.includes(track.id);
}

export function isLiked(id) {
  return state.likedIds.includes(id);
}

export function getLikedTracks() {
  return resolveTracks(state.likedIds);
}

export function addRecentlyPlayed(track) {
  cacheTrack(track);
  state.recentlyPlayedIds = state.recentlyPlayedIds.filter((id) => id !== track.id);
  state.recentlyPlayedIds.unshift(track.id);
  state.recentlyPlayedIds = state.recentlyPlayedIds.slice(0, 10);
  saveState(state);
}

export function getRecentlyPlayed() {
  return resolveTracks(state.recentlyPlayedIds);
}

export function createPlaylist(name) {
  const playlist = { id: `pl_${Date.now()}`, name, trackIds: [] };
  state.playlists.push(playlist);
  saveState(state);
  return playlist;
}

export function getPlaylists() {
  return state.playlists;
}

export function addTrackToPlaylist(playlistId, track) {
  cacheTrack(track);
  const playlist = state.playlists.find((p) => p.id === playlistId);
  if (!playlist || playlist.trackIds.includes(track.id)) return false;
  playlist.trackIds.push(track.id);
  saveState(state);
  return true;
}

export function getPlaylistTracks(playlistId) {
  const playlist = state.playlists.find((p) => p.id === playlistId);
  if (!playlist) return [];
  return resolveTracks(playlist.trackIds);
}
