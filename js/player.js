let ytApiReadyResolve;
const ytApiReady = new Promise((resolve) => {
  ytApiReadyResolve = resolve;
});

window.onYouTubeIframeAPIReady = () => ytApiReadyResolve();
if (window.YT && window.YT.Player) {
  ytApiReadyResolve();
}

let player = null;
let playerReady = false;
let timeUpdateInterval = null;

// Requests made before the IFrame player finishes loading are remembered and
// applied once it's ready, so early clicks/volume changes aren't lost.
let pendingVideoId = null;
let desiredVolume = 100;
let desiredMuted = false;

export function initPlayer(mountElId, { onStateChange, onTimeUpdate, onError }) {
  return ytApiReady.then(
    () =>
      new Promise((resolve) => {
        player = new YT.Player(mountElId, {
          height: "100%",
          width: "100%",
          playerVars: { controls: 1, disablekb: 1, modestbranding: 1, playsinline: 1, rel: 0 },
          events: {
            onReady: () => {
              playerReady = true;
              player.setVolume(desiredVolume);
              if (desiredMuted) player.mute();
              else player.unMute();
              if (pendingVideoId) {
                player.loadVideoById(pendingVideoId);
                pendingVideoId = null;
              }
              resolve();
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                startTimeUpdates(onTimeUpdate);
              } else {
                stopTimeUpdates();
              }
              onStateChange(event.data);
            },
            onError: (event) => {
              stopTimeUpdates();
              if (onError) onError(event.data);
            },
          },
        });
      })
  );
}

function startTimeUpdates(onTimeUpdate) {
  stopTimeUpdates();
  const tick = () => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    onTimeUpdate(player.getCurrentTime(), player.getDuration());
  };
  tick();
  timeUpdateInterval = setInterval(tick, 500);
}

function stopTimeUpdates() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

export function isReady() {
  return playerReady;
}

export function loadVideo(videoId) {
  if (!playerReady) {
    pendingVideoId = videoId;
    return;
  }
  player.loadVideoById(videoId);
}

export function play() {
  if (playerReady) player.playVideo();
}

export function pause() {
  if (playerReady) player.pauseVideo();
}

export function seekTo(seconds) {
  if (playerReady) player.seekTo(seconds, true);
}

export function setVolume(volume) {
  desiredVolume = volume;
  if (playerReady) player.setVolume(volume);
}

export function mute() {
  desiredMuted = true;
  if (playerReady) player.mute();
}

export function unmute() {
  desiredMuted = false;
  if (playerReady) player.unMute();
}

// Tracked locally: YT's isMuted() can lag behind a mute()/unMute() call.
export function isMuted() {
  return desiredMuted;
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
  get BUFFERING() {
    return window.YT ? window.YT.PlayerState.BUFFERING : 3;
  },
};
