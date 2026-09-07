(() => {
  "use strict";

  const ROOT_CLASS = "yt-window-fullscreen";
  const PLAYER_CLASS = "yt-window-fullscreen-player";
  const BUTTON_ID = "yt-window-fullscreen-button";
  let activePlayer = null;
  const manuallyExitedVideos = new Set();
  let chatHandledVideo = null;
  let endCheckTimer = null;
  const endObserver = new MutationObserver(checkPlaybackEnded);

  function isShowingAd(player) {
    return !!player && (player.classList.contains("ad-showing") ||
      player.classList.contains("ad-interrupting"));
  }

  function checkPlaybackEnded() {
    if (!isActive() || !activePlayer || isShowingAd(activePlayer)) return;
    const video = activePlayer.querySelector("video");
    if (activePlayer.classList.contains("ended-mode") || video?.ended) exit();
  }



  function isActive() {
    return document.documentElement.classList.contains(ROOT_CLASS);
  }

  function getPlayer() {
    return document.querySelector("#movie_player");
  }

  function getVideoKey() {
    if (location.pathname === "/watch") {
      const videoId = new URLSearchParams(location.search).get("v");
      return videoId ? `watch:${videoId}` : null;
    }

    if (/^\/(live|clip)\//.test(location.pathname)) {
      return location.pathname;
    }

    return null;
  }

  function updateButton() {
    const button = document.getElementById(BUTTON_ID);
    if (!button) return;

    const active = isActive();
    button.dataset.active = String(active);
    const iconPath = button.querySelector("path");
    if (iconPath) {
      iconPath.setAttribute(
        "d",
        active
          ? "M8 4h2v6H4V8h4V4zm6 0h2v4h4v2h-6V4zM4 14h6v6H8v-4H4v-2zm10 0h6v2h-4v4h-2v-6z"
          : "M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"
      );
    }
    button.title = active
      ? "Exit window fullscreen (F)"
      : "Window fullscreen (F)";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(active));
  }

  function exit(manual = false) {
    if (manual) {
      const videoKey = getVideoKey();
      if (videoKey) manuallyExitedVideos.add(videoKey);
    }
    endObserver.disconnect();
    clearInterval(endCheckTimer);
    endCheckTimer = null;
    document.documentElement.classList.remove(ROOT_CLASS);
    activePlayer?.classList.remove(PLAYER_CLASS);
    activePlayer = null;
    updateButton();
    window.dispatchEvent(new Event("resize"));
  }

  function enter() {
    const player = getPlayer();
    if (!player) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    endObserver.disconnect();
    clearInterval(endCheckTimer);
    activePlayer = player;
    endObserver.observe(player, { attributes: true, attributeFilter: ["class"] });
    endCheckTimer = setInterval(checkPlaybackEnded, 250);
    activePlayer.classList.add(PLAYER_CLASS);
    document.documentElement.classList.add(ROOT_CLASS);
    window.scrollTo(0, 0);
    updateButton();
    window.dispatchEvent(new Event("resize"));
  }

  function toggle() {
    if (isActive()) {
      exit(true);
    } else {
      manuallyExitedVideos.delete(getVideoKey());
      enter();
    }
  }

  function autoActivate() {
    const videoKey = getVideoKey();
    const player = getPlayer();
    const video = player?.querySelector("video");
    if (
      !videoKey ||
      manuallyExitedVideos.has(videoKey) ||
      !video ||
      video.paused ||
      video.ended ||
      video.readyState < 3 ||
      player.classList.contains("ended-mode") ||
      isShowingAd(player) ||
      document.fullscreenElement
    ) return;

    if (isActive() && activePlayer === player) return;
    if (activePlayer) exit();
    enter();
  }
  function closeChatIfPresent() {
    const videoKey = getVideoKey();
    if (!videoKey || videoKey === chatHandledVideo) return;

    const chat = document.querySelector(
      "ytd-live-chat-frame:not([collapsed]), #chat:not([collapsed])"
    );
    if (!chat) return;

    const closeButton = chat.querySelector(
      '#close-button button, button[aria-label="Close"], #show-hide-button button'
    );
    if (!closeButton) return;

    chatHandledVideo = videoKey;
    closeButton.click();
  }

  function addButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const controls = document.querySelector(
      ".ytp-right-controls-right, .ytp-right-controls"
    );
    if (!controls || !getPlayer()) return;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.className = "ytp-button";
    button.type = "button";
    button.textContent = "";

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    iconPath.setAttribute("fill", "currentColor");
    icon.appendChild(iconPath);
    button.appendChild(icon);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggle();
    });

    const theaterButton = document.querySelector(".ytp-size-button");
    const buttonContainer = theaterButton?.parentElement || controls;
    buttonContainer.insertBefore(
      button,
      theaterButton || buttonContainer.firstElementChild
    );
    updateButton();
  }

  const observer = new MutationObserver(() => {
    addButton();
    autoActivate();
    closeChatIfPresent();
    if (isActive() && !document.contains(activePlayer)) exit();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  addButton();
  autoActivate();
  closeChatIfPresent();

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

    if (event.key === "Escape" && isActive()) {
      exit(true);
    } else if (
      event.key.toLowerCase() === "f" &&
      !isTyping &&
      !event.repeat &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle();
    }
  }, true);

  // Recheck playback when YouTube reuses the player for a new video.
  for (const eventName of ["playing", "timeupdate"]) {
    document.addEventListener(eventName, (event) => {
      if (event.target instanceof HTMLVideoElement &&
          getPlayer()?.contains(event.target)) autoActivate();
    }, true);
  }

  document.addEventListener("yt-navigate-finish", () => {
    if (!getVideoKey() && isActive()) exit();
    autoActivate();
  });
  // Media events do not bubble; capture also handles replacement video elements.
  document.addEventListener("ended", (event) => {
    const video = event.target;
    console.log("Video ended event:", video, activePlayer, isActive(), isShowingAd(activePlayer));
    if (
      !isActive() ||
      !(video instanceof HTMLVideoElement) ||
      !activePlayer?.contains(video) ||
      isShowingAd(activePlayer)
    ) return;

    exit();
  }, true);

  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement && isActive()) exit(true);
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "toggle-window-fullscreen") toggle();
  });

})();
