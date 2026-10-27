const ICONS = {
  play: "./assets/player_icon3.png",
  pause: "./assets/player_icon3_pause.png",
  volume: "./assets/controls_icon5.png",
  muted: "./assets/controls_icon5_muted.png",
};

export function renderCards(container, tracks, onTrackClick) {
  container.innerHTML = "";
  if (!tracks.length) {
    const empty = document.createElement("p");
    empty.className = "card-loading";
    empty.textContent = "Nothing here yet.";
    container.appendChild(empty);
    return;
  }
  tracks.forEach((track) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.videoId = track.id;
    card.title = `${track.title} — ${track.artist}`;

    const img = document.createElement("img");
    img.src = track.thumbnail;
    img.alt = track.title;
    img.className = "card-img";
    img.loading = "lazy";

    const title = document.createElement("p");
    title.className = "card-title";
    title.textContent = track.title;

    const info = document.createElement("p");
    info.className = "card-info";
    info.textContent = track.artist;

    card.append(img, title, info);
    card.addEventListener("click", () => onTrackClick(track));
    container.appendChild(card);
  });
}

export function showLoading(container) {
  showMessage(container, "Loading...");
}

export function showError(container, message) {
  showMessage(container, message);
}

export function showMessage(container, message) {
  container.innerHTML = "";
  const el = document.createElement("p");
  el.className = "card-loading";
  el.textContent = message;
  container.appendChild(el);
}

export function markPlayingCard(videoId) {
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.toggle("playing", card.dataset.videoId === videoId);
  });
}

export function updateNowPlayingInfo({ title, artist, thumbnail }) {
  document.getElementById("curr-playing-title").textContent = title;
  document.getElementById("curr-playing-artist").textContent = artist;
  document.getElementById("curr-playing-img").src = thumbnail;
  document.getElementById("video-dock-label").textContent = title;
}

export function updateLikeButton(liked) {
  const btn = document.getElementById("like-btn");
  btn.classList.toggle("liked", liked);
  btn.title = liked ? "Remove from Liked Songs" : "Save to Liked Songs";
}

export function updatePlayPauseButton(isPlaying) {
  const btn = document.getElementById("play-pause-btn");
  btn.dataset.state = isPlaying ? "playing" : "paused";
  btn.src = isPlaying ? ICONS.pause : ICONS.play;
  btn.alt = btn.title = isPlaying ? "Pause" : "Play";
}

export function updateMuteButton(muted) {
  const btn = document.getElementById("mute-btn");
  btn.src = muted ? ICONS.muted : ICONS.volume;
  btn.alt = btn.title = muted ? "Unmute" : "Mute";
  btn.classList.toggle("muted", muted);
}

export function setToggleActive(id, active) {
  document.getElementById(id).classList.toggle("active", active);
}

export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export function updateProgress(currentTime, duration) {
  const bar = document.getElementById("progress-bar");
  if (duration > 0) {
    bar.max = String(Math.floor(duration));
    if (!bar.dataset.dragging) {
      bar.value = String(Math.floor(currentTime));
    }
  } else {
    bar.value = "0";
  }
  document.getElementById("curr-time").textContent = formatTime(currentTime);
  document.getElementById("tot-time").textContent = formatTime(duration);
}

export function renderPlaylists(playlists, onPlaylistClick) {
  const container = document.getElementById("playlists-list");
  container.innerHTML = "";
  playlists.forEach((playlist) => {
    const entry = document.createElement("div");
    entry.className = "playlist-entry";
    entry.textContent = playlist.name;
    entry.addEventListener("click", () => onPlaylistClick(playlist));
    container.appendChild(entry);
  });
  document.getElementById("first-playlist-box").classList.toggle("hidden", playlists.length > 0);
}

export function showHomeView() {
  document.getElementById("home-view").classList.remove("hidden");
  document.getElementById("search-view").classList.add("hidden");
  document.getElementById("search-bar-container").classList.add("hidden");
}

export function showSearchView({ title = "Search Results", showSearchBar = true, focus = true } = {}) {
  document.getElementById("search-view-title").textContent = title;
  document.getElementById("home-view").classList.add("hidden");
  document.getElementById("search-view").classList.remove("hidden");
  document.getElementById("search-bar-container").classList.toggle("hidden", !showSearchBar);
  if (showSearchBar && focus) document.getElementById("search-input").focus();
}

export function setLibraryOpen(open) {
  document.getElementById("sidebar").classList.toggle("open", open);
}

export function isLibraryOpen() {
  return document.getElementById("sidebar").classList.contains("open");
}

export function setVideoMaximised(maximised) {
  document.getElementById("video-dock").classList.toggle("maximised", maximised);
  document.getElementById("video-backdrop").classList.toggle("hidden", !maximised);
  const label = maximised ? "Minimise video" : "Maximise video";
  const icon = maximised ? "fa-compress" : "fa-expand";
  const dockBtn = document.getElementById("video-dock-toggle");
  dockBtn.title = label;
  dockBtn.setAttribute("aria-label", label);
  dockBtn.querySelector("i").className = `fa-solid ${icon}`;
  const barBtn = document.getElementById("video-toggle-btn");
  barBtn.title = label;
  barBtn.className = `fa-solid ${icon} video-toggle-icon`;
  barBtn.classList.toggle("active", maximised);
}

export function isVideoMaximised() {
  return document.getElementById("video-dock").classList.contains("maximised");
}

let toastTimer = null;
export function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2500);
}
