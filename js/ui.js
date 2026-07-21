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

    const img = document.createElement("img");
    img.src = track.thumbnail;
    img.alt = track.title;
    img.className = "card-img";

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
  container.innerHTML = "";
  const loading = document.createElement("p");
  loading.className = "card-loading";
  loading.textContent = "Loading...";
  container.appendChild(loading);
}

export function showError(container, message) {
  container.innerHTML = "";
  const error = document.createElement("p");
  error.className = "card-loading";
  error.textContent = message;
  container.appendChild(error);
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
}

export function updateLikeButton(liked) {
  document.getElementById("like-btn").classList.toggle("liked", liked);
}

export function updatePlayPauseButton(isPlaying) {
  const btn = document.getElementById("play-pause-btn");
  btn.dataset.state = isPlaying ? "playing" : "paused";
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
}

export function showHomeView() {
  document.getElementById("home-view").classList.remove("hidden");
  document.getElementById("search-view").classList.add("hidden");
  document.getElementById("search-bar-container").classList.add("hidden");
}

export function showSearchView() {
  document.getElementById("home-view").classList.add("hidden");
  document.getElementById("search-view").classList.remove("hidden");
  document.getElementById("search-bar-container").classList.remove("hidden");
  document.getElementById("search-input").focus();
}
