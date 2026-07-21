import { searchTracks } from "./api.js";
import * as player from "./player.js";
import * as ui from "./ui.js";
import * as storage from "./storage.js";

let currentQueue = [];
let currentIndex = -1;
let currentTrack = null;
let shuffleOn = false;
let repeatOn = false;

let trendingCache = null;
let featuredCache = null;

const recentlyPlayedEl = document.getElementById("recently-played-cards");
const trendingEl = document.getElementById("trending-cards");
const featuredEl = document.getElementById("featured-cards");
const searchResultsEl = document.getElementById("search-results-cards");
const searchInput = document.getElementById("search-input");

function playTrack(track, queue) {
  currentQueue = queue;
  currentIndex = queue.findIndex((t) => t.id === track.id);
  currentTrack = track;

  player.loadVideo(track.id);
  ui.updateNowPlayingInfo(track);
  ui.updateLikeButton(storage.isLiked(track.id));
  ui.markPlayingCard(track.id);
  storage.addRecentlyPlayed(track);
  renderRecentlyPlayed();
}

function playAtIndex(index) {
  if (!currentQueue.length) return;
  const wrapped = (index + currentQueue.length) % currentQueue.length;
  playTrack(currentQueue[wrapped], currentQueue);
}

function playNext() {
  if (!currentQueue.length) return;
  if (shuffleOn) {
    playAtIndex(Math.floor(Math.random() * currentQueue.length));
  } else {
    playAtIndex(currentIndex + 1);
  }
}

function playPrev() {
  if (!currentQueue.length) return;
  playAtIndex(currentIndex - 1);
}

async function fetchInto(container, query, cacheGetSet) {
  ui.showLoading(container);
  try {
    let tracks = cacheGetSet.get();
    if (!tracks) {
      tracks = await searchTracks(query);
      cacheGetSet.set(tracks);
    }
    ui.renderCards(container, tracks, (track) => playTrack(track, tracks));
  } catch (err) {
    ui.showError(container, "Couldn't load tracks right now.");
  }
}

function renderRecentlyPlayed() {
  const recent = storage.getRecentlyPlayed();
  if (recent.length) {
    ui.renderCards(recentlyPlayedEl, recent, (track) => playTrack(track, recent));
  } else {
    fetchInto(recentlyPlayedEl, "Top Global Hits 2026", {
      get: () => null,
      set: () => {},
    });
  }
}

function loadHomeView() {
  renderRecentlyPlayed();
  fetchInto(trendingEl, "Bollywood Hits 2026", {
    get: () => trendingCache,
    set: (t) => (trendingCache = t),
  });
  fetchInto(featuredEl, "Top Charts 2026", {
    get: () => featuredCache,
    set: (t) => (featuredCache = t),
  });
}

let searchDebounce = null;
function handleSearchInput() {
  clearTimeout(searchDebounce);
  const query = searchInput.value.trim();
  if (!query) {
    searchResultsEl.innerHTML = "";
    return;
  }
  searchDebounce = setTimeout(async () => {
    ui.showLoading(searchResultsEl);
    try {
      const tracks = await searchTracks(query);
      ui.renderCards(searchResultsEl, tracks, (track) => playTrack(track, tracks));
    } catch (err) {
      ui.showError(searchResultsEl, "Couldn't search right now.");
    }
  }, 400);
}

function setActiveNav(activeId) {
  ["nav-home", "nav-search"].forEach((id) => {
    document.getElementById(id).style.opacity = id === activeId ? "1" : "";
  });
}

function initNav() {
  document.getElementById("nav-home").addEventListener("click", () => {
    setActiveNav("nav-home");
    ui.showHomeView();
  });
  document.getElementById("nav-search").addEventListener("click", () => {
    setActiveNav("nav-search");
    ui.showSearchView();
  });
  searchInput.addEventListener("input", handleSearchInput);
}

function initPlaylists() {
  function refresh() {
    ui.renderPlaylists(storage.getPlaylists(), (playlist) => {
      const tracks = storage.getPlaylistTracks(playlist.id);
      setActiveNav(null);
      ui.showSearchView();
      searchInput.value = "";
      ui.renderCards(searchResultsEl, tracks, (track) => playTrack(track, tracks));
    });
  }

  document.getElementById("create-playlist-btn").addEventListener("click", () => {
    const name = window.prompt("Name your playlist:", "My Playlist");
    if (!name) return;
    storage.createPlaylist(name.trim());
    refresh();
  });
  document.getElementById("create-playlist-icon").addEventListener("click", () => {
    const name = window.prompt("Name your playlist:", "My Playlist");
    if (!name) return;
    storage.createPlaylist(name.trim());
    refresh();
  });

  document.getElementById("add-to-playlist-btn").addEventListener("click", () => {
    if (!currentTrack) return;
    const playlists = storage.getPlaylists();
    if (!playlists.length) {
      window.alert("Create a playlist first using the + icon in Your Library.");
      return;
    }
    let target = playlists[0];
    if (playlists.length > 1) {
      const names = playlists.map((p) => p.name).join(", ");
      const chosen = window.prompt(`Add "${currentTrack.title}" to which playlist?\n(${names})`, playlists[0].name);
      if (!chosen) return;
      target = playlists.find((p) => p.name === chosen.trim()) || playlists[0];
    }
    storage.addTrackToPlaylist(target.id, currentTrack);
    window.alert(`Added to "${target.name}".`);
  });

  refresh();
}

function initPlayerControls() {
  document.getElementById("play-pause-btn").addEventListener("click", () => {
    if (!currentTrack) return;
    if (document.getElementById("play-pause-btn").dataset.state === "playing") {
      player.pause();
    } else {
      player.play();
    }
  });

  document.getElementById("next-btn").addEventListener("click", playNext);
  document.getElementById("prev-btn").addEventListener("click", playPrev);

  document.getElementById("shuffle-btn").addEventListener("click", () => {
    shuffleOn = !shuffleOn;
    ui.setToggleActive("shuffle-btn", shuffleOn);
  });
  document.getElementById("repeat-btn").addEventListener("click", () => {
    repeatOn = !repeatOn;
    ui.setToggleActive("repeat-btn", repeatOn);
  });

  document.getElementById("like-btn").addEventListener("click", () => {
    if (!currentTrack) return;
    const liked = storage.toggleLike(currentTrack);
    ui.updateLikeButton(liked);
  });

  const progressBar = document.getElementById("progress-bar");
  progressBar.addEventListener("input", () => {
    progressBar.dataset.dragging = "1";
  });
  progressBar.addEventListener("change", () => {
    player.seekTo(Number(progressBar.value));
    delete progressBar.dataset.dragging;
  });

  const volumeBar = document.getElementById("volume-bar");
  volumeBar.addEventListener("input", () => {
    player.setVolume(Number(volumeBar.value));
  });

  document.getElementById("mute-btn").addEventListener("click", () => {
    if (player.isMuted()) {
      player.unmute();
      ui.setToggleActive("mute-btn", false);
    } else {
      player.mute();
      ui.setToggleActive("mute-btn", true);
    }
  });
}

async function init() {
  initNav();
  initPlaylists();
  initPlayerControls();
  loadHomeView();

  await player.initPlayer("yt-player-mount", {
    onStateChange: (state) => {
      ui.updatePlayPauseButton(state === player.PlayerState.PLAYING);
      if (state === player.PlayerState.ENDED) {
        if (repeatOn) {
          playAtIndex(currentIndex);
        } else {
          playNext();
        }
      }
    },
    onTimeUpdate: (currentTime, duration) => {
      ui.updateProgress(currentTime, duration);
    },
  });
}

init();
