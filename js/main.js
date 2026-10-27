import { searchTracks } from "./api.js";
import * as player from "./player.js";
import * as ui from "./ui.js";
import * as storage from "./storage.js";

let currentQueue = [];
let currentIndex = -1;
let currentTrack = null;
let shuffleOn = false;
let repeatOn = false;
let consecutiveErrors = 0;

let trendingCache = null;
let featuredCache = null;

const recentlyPlayedEl = document.getElementById("recently-played-cards");
const trendingEl = document.getElementById("trending-cards");
const featuredEl = document.getElementById("featured-cards");
const searchResultsEl = document.getElementById("search-results-cards");
const searchInput = document.getElementById("search-input");
const volumeBar = document.getElementById("volume-bar");

function renderTracks(container, tracks) {
  ui.renderCards(container, tracks, (track) => playTrack(track, tracks));
  if (currentTrack) ui.markPlayingCard(currentTrack.id);
}

function playTrack(track, queue) {
  currentQueue = queue.slice();
  currentIndex = currentQueue.findIndex((t) => t.id === track.id);
  currentTrack = track;

  player.loadVideo(track.id);
  ui.updateNowPlayingInfo(track);
  ui.updateLikeButton(storage.isLiked(track.id));
  ui.updatePlayPauseButton(true);
  ui.updateProgress(0, 0);
  storage.addRecentlyPlayed(track);
  renderRecentlyPlayed();
  ui.markPlayingCard(track.id);
}

function playAtIndex(index) {
  if (!currentQueue.length) return;
  const wrapped = (index + currentQueue.length) % currentQueue.length;
  playTrack(currentQueue[wrapped], currentQueue);
}

function playNext() {
  if (!currentQueue.length) return;
  if (shuffleOn && currentQueue.length > 1) {
    let next = currentIndex;
    while (next === currentIndex) next = Math.floor(Math.random() * currentQueue.length);
    playAtIndex(next);
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
    renderTracks(container, tracks);
  } catch (err) {
    ui.showError(container, "Couldn't load tracks right now.");
  }
}

function renderRecentlyPlayed() {
  const recent = storage.getRecentlyPlayed();
  if (recent.length) {
    renderTracks(recentlyPlayedEl, recent);
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

const SEARCH_HINT = "Start typing to find songs and artists.";
let searchDebounce = null;
let searchRequestId = 0;
function handleSearchInput() {
  clearTimeout(searchDebounce);
  const requestId = ++searchRequestId;
  const query = searchInput.value.trim();
  if (!query) {
    ui.showMessage(searchResultsEl, SEARCH_HINT);
    return;
  }
  searchDebounce = setTimeout(async () => {
    ui.showLoading(searchResultsEl);
    try {
      const tracks = await searchTracks(query);
      // Ignore responses that arrive after the user has typed something newer.
      if (requestId !== searchRequestId) return;
      renderTracks(searchResultsEl, tracks);
    } catch (err) {
      if (requestId !== searchRequestId) return;
      ui.showError(searchResultsEl, "Couldn't search right now.");
    }
  }, 400);
}

function setActiveNav(activeId) {
  ["nav-home", "nav-search"].forEach((id) => {
    document.getElementById(id).style.opacity = id === activeId ? "1" : "";
  });
  const mobileTarget = { "nav-home": "home", "nav-search": "search", library: "library" }[activeId];
  document.querySelectorAll(".mobile-nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.target === mobileTarget);
  });
}

function goHome() {
  ui.setLibraryOpen(false);
  setActiveNav("nav-home");
  ui.showHomeView();
}

function goSearch() {
  ui.setLibraryOpen(false);
  setActiveNav("nav-search");
  // Coming back from a playlist view: restore the search results for the current query.
  if (document.getElementById("search-view-title").textContent !== "Search Results") {
    handleSearchInput();
  }
  ui.showSearchView();
}

function initNav() {
  document.getElementById("nav-home").addEventListener("click", goHome);
  document.getElementById("nav-search").addEventListener("click", goSearch);
  searchInput.addEventListener("input", handleSearchInput);
  ui.showMessage(searchResultsEl, SEARCH_HINT);

  document.querySelectorAll(".mobile-nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;
      if (target === "home") goHome();
      else if (target === "search") goSearch();
      else if (ui.isLibraryOpen()) goHome();
      else {
        setActiveNav("library");
        ui.setLibraryOpen(true);
      }
    });
  });
  document.getElementById("close-library-btn").addEventListener("click", goHome);
}

function promptNewPlaylist(refresh) {
  const name = (window.prompt("Name your playlist:", "My Playlist") || "").trim();
  if (!name) return;
  storage.createPlaylist(name);
  refresh();
  ui.showToast(`Created playlist "${name}".`);
}

function initPlaylists() {
  function refresh() {
    ui.renderPlaylists(storage.getPlaylists(), (playlist) => {
      const tracks = storage.getPlaylistTracks(playlist.id);
      ui.setLibraryOpen(false);
      setActiveNav(null);
      ui.showSearchView({ title: playlist.name, showSearchBar: false });
      renderTracks(searchResultsEl, tracks);
    });
  }

  document.getElementById("create-playlist-btn").addEventListener("click", () => promptNewPlaylist(refresh));
  document.getElementById("create-playlist-icon").addEventListener("click", () => promptNewPlaylist(refresh));

  document.getElementById("add-to-playlist-btn").addEventListener("click", () => {
    if (!currentTrack) {
      ui.showToast("Play a song first, then add it to a playlist.");
      return;
    }
    const playlists = storage.getPlaylists();
    if (!playlists.length) {
      ui.showToast("Create a playlist first using the + icon in Your Library.");
      return;
    }
    let target = playlists[0];
    if (playlists.length > 1) {
      const names = playlists.map((p) => p.name).join(", ");
      const chosen = window.prompt(`Add "${currentTrack.title}" to which playlist?\n(${names})`, playlists[0].name);
      if (!chosen) return;
      const wanted = chosen.trim().toLowerCase();
      target = playlists.find((p) => p.name.toLowerCase() === wanted);
      if (!target) {
        ui.showToast(`No playlist named "${chosen.trim()}".`);
        return;
      }
    }
    const added = storage.addTrackToPlaylist(target.id, currentTrack);
    ui.showToast(added ? `Added to "${target.name}".` : `Already in "${target.name}".`);
  });

  refresh();
}

function togglePlayPause() {
  if (!currentTrack) return;
  if (document.getElementById("play-pause-btn").dataset.state === "playing") {
    player.pause();
    ui.updatePlayPauseButton(false);
  } else {
    player.play();
    ui.updatePlayPauseButton(true);
  }
}

let lastVolume = 100;
function setMuted(muted) {
  if (muted) {
    player.mute();
    volumeBar.value = "0";
  } else {
    if (lastVolume === 0) lastVolume = 50;
    player.setVolume(lastVolume);
    player.unmute();
    volumeBar.value = String(lastVolume);
  }
  ui.updateMuteButton(muted);
}

function toggleVideoMaximised() {
  ui.setVideoMaximised(!ui.isVideoMaximised());
}

function initPlayerControls() {
  document.getElementById("play-pause-btn").addEventListener("click", togglePlayPause);
  document.getElementById("next-btn").addEventListener("click", playNext);
  document.getElementById("prev-btn").addEventListener("click", playPrev);

  document.getElementById("shuffle-btn").addEventListener("click", () => {
    shuffleOn = !shuffleOn;
    ui.setToggleActive("shuffle-btn", shuffleOn);
    document.getElementById("shuffle-btn").title = shuffleOn ? "Disable shuffle" : "Enable shuffle";
  });
  document.getElementById("repeat-btn").addEventListener("click", () => {
    repeatOn = !repeatOn;
    ui.setToggleActive("repeat-btn", repeatOn);
    document.getElementById("repeat-btn").title = repeatOn ? "Disable repeat" : "Enable repeat";
  });

  document.getElementById("like-btn").addEventListener("click", () => {
    if (!currentTrack) return;
    const liked = storage.toggleLike(currentTrack);
    ui.updateLikeButton(liked);
    ui.showToast(liked ? "Added to Liked Songs." : "Removed from Liked Songs.");
  });

  const progressBar = document.getElementById("progress-bar");
  progressBar.addEventListener("input", () => {
    progressBar.dataset.dragging = "1";
  });
  progressBar.addEventListener("change", () => {
    const target = Number(progressBar.value);
    player.seekTo(target);
    delete progressBar.dataset.dragging;
    ui.updateProgress(target, Number(progressBar.max));
  });

  volumeBar.addEventListener("input", () => {
    const volume = Number(volumeBar.value);
    if (volume > 0) {
      lastVolume = volume;
      player.setVolume(volume);
      if (player.isMuted()) player.unmute();
      ui.updateMuteButton(false);
    } else {
      player.mute();
      ui.updateMuteButton(true);
    }
  });

  document.getElementById("mute-btn").addEventListener("click", () => {
    setMuted(!player.isMuted() && Number(volumeBar.value) > 0);
  });

  document.getElementById("video-toggle-btn").addEventListener("click", toggleVideoMaximised);
  document.getElementById("video-dock-toggle").addEventListener("click", toggleVideoMaximised);
  document.getElementById("video-backdrop").addEventListener("click", () => ui.setVideoMaximised(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (ui.isVideoMaximised()) ui.setVideoMaximised(false);
      else if (ui.isLibraryOpen()) goHome();
      return;
    }
    const typing = event.target.closest("input, textarea, [contenteditable]");
    if (event.code === "Space" && !typing && currentTrack) {
      event.preventDefault();
      togglePlayPause();
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
      const isPlaying = state === player.PlayerState.PLAYING || state === player.PlayerState.BUFFERING;
      ui.updatePlayPauseButton(isPlaying);
      if (state === player.PlayerState.PLAYING) consecutiveErrors = 0;
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
    onError: () => {
      // Some videos can't be embedded; skip them, but stop if the whole queue fails.
      ui.updatePlayPauseButton(false);
      consecutiveErrors += 1;
      if (consecutiveErrors < currentQueue.length) {
        ui.showToast("This track can't be played here. Skipping...");
        playNext();
      } else {
        consecutiveErrors = 0;
        ui.showToast("None of these tracks can be played right now.");
      }
    },
  });
}

init();
