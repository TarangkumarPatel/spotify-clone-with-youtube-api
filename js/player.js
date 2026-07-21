let ytApiReadyResolve;
const ytApiReady = new Promise((resolve) => {
  ytApiReadyResolve = resolve;
});

window.onYouTubeIframeAPIReady = () => ytApiReadyResolve();
if (window.YT && window.YT.Player) {
  ytApiReadyResolve();
}

let player = null;
let timeUpdateInterval = null;

export function initPlayer(mountElId, { onStateChange, onTimeUpdate }) {
  return ytApiReady.then(
    () =>
      new Promise((resolve) => {
        player = new YT.Player(mountElId, {
          height: "90",
          width: "160",
          playerVars: { controls: 1, disablekb: 1, modestbranding: 1 },
          events: {
            onReady: () => resolve(),
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                startTimeUpdates(onTimeUpdate);
              } else {
                stopTimeUpdates();
              }
              onStateChange(event.data);
            },
          },
        });
      })
  );
}

function startTimeUpdates(onTimeUpdate) {
  stopTimeUpdates();
  timeUpdateInterval = setInterval(() => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    onTimeUpdate(player.getCurrentTime(), player.getDuration());
  }, 500);
}

function stopTimeUpdates() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

export function loadVideo(videoId) {
  if (!player) return;
  player.loadVideoById(videoId);
}

export function play() {
  if (player) player.playVideo();
}

export function pause() {
  if (player) player.pauseVideo();
}

export function seekTo(seconds) {
  if (player) player.seekTo(seconds, true);
}

export function setVolume(volume) {
  if (player) player.setVolume(volume);
}

export function mute() {
  if (player) player.mute();
}

export function unmute() {
  if (player) player.unMute();
}

export function isMuted() {
  return player ? player.isMuted() : false;
}

export const PlayerState = {
  get PLAYING() {
    return window.YT ? window.YT.PlayerState.PLAYING : 1;
  },
  get PAUSED() {
    return window.YT ? window.YT.PlayerState.PAUSED : 2;
  },
  get ENDED() {
    return window.YT ? window.YT.PlayerState.ENDED : 0;
  },
};
