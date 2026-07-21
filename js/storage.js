const STORAGE_KEY = "spotify_clone_state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no state");
    const parsed = JSON.parse(raw);
    return {
      likedIds: parsed.likedIds || [],
      recentlyPlayedIds: parsed.recentlyPlayedIds || [],
      playlists: parsed.playlists || [],
      trackCache: parsed.trackCache || {},
    };
  } catch {
    return { likedIds: [], recentlyPlayedIds: [], playlists: [], trackCache: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  if (!playlist) return;
  if (!playlist.trackIds.includes(track.id)) {
    playlist.trackIds.push(track.id);
    saveState(state);
  }
}

export function getPlaylistTracks(playlistId) {
  const playlist = state.playlists.find((p) => p.id === playlistId);
  if (!playlist) return [];
  return resolveTracks(playlist.trackIds);
}
