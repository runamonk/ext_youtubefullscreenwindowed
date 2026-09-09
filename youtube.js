(() => {
  "use strict";

  const ROOT_CLASS = "yt-window-fullscreen";
  const PLAYER_CLASS = "yt-window-fullscreen-player";
  const BUTTON_ID = "yt-window-fullscreen-button";
  const SHORTS_CLASS = "yt-window-shorts";

  function isShortsPage() {
    return /^\/shorts(?:\/|$)/.test(location.pathname);
  }

  function isShortsVideo(video) {
    return isShortsPage() && video instanceof HTMLVideoElement &&
      !!video.closest("ytd-shorts") &&
      !isShowingAd(video.closest(".html5-video-player"));
  }

  function disableShortsLooping() {
    if (!isShortsPage()) return;
    for (const video of document.querySelectorAll("ytd-shorts video[loop]")) {
      if (isShortsVideo(video)) video.loop = false;
    }
  }

  // Native looping prevents the ended event. Watch for YouTube restoring it.
  const shortsLoopObserver = new MutationObserver(disableShortsLooping);
  shortsLoopObserver.observe(document.documentElement, {
    subtree: true, attributes: true, attributeFilter: ["loop"]
  });

  document.addEventListener("ended", (event) => {
    if (!isShortsVideo(event.target)) return;
    // Stop the site's ended handlers from starting another playback.
    event.stopImmediatePropagation();
    event.target.pause();
  }, true);

  document.addEventListener("play", disableShortsLooping, true);
  document.addEventListener("loadedmetadata", disableShortsLooping, true);

  let shortsResizeFrame = 0;
  let observedShorts = null;
  const shortsResizeObserver = new ResizeObserver(scheduleShortsResize);

  function clearShortsFit() {
    if (!observedShorts) return;
    observedShorts.style.removeProperty("--yt-window-shorts-scale");
    observedShorts.style.removeProperty("--yt-window-shorts-offset");
    observedShorts.style.removeProperty("--yt-window-shorts-stage-height");
    observedShorts.classList.remove("yt-window-shorts-stage");
    observedShorts.classList.remove("yt-window-shorts-fit");
  }

  function fitShortsBounds() {
    clearShortsFit();
    if (!isShortsPage() || !observedShorts || document.fullscreenElement) return;
    const feed = observedShorts;
    const viewport = window.visualViewport;
    const top = (viewport?.offsetTop || 0) + 12;
    const bottom = (viewport?.offsetTop || 0) +
      (viewport?.height || window.innerHeight) - 12;
    // Choose the visible reel before scaling. Offscreen feed items stay in place
    // relative to the active item, preserving YouTube's scrolling behaviour.
    const reels = [...feed.querySelectorAll("ytd-reel-video-renderer")];
    const reel = reels.reduce((best, item) => {
      const rect = item.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(bottom, rect.bottom) - Math.max(top, rect.top));
      return overlap > best.overlap ? { item, overlap } : best;
    }, { item: null, overlap: 0 }).item;
    if (!reel) return;

    const player = reel.querySelector("#player-container");
    if (!player) return;
    let bounds = player.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    // Scaling also shrinks the feed's scrollport. Give that scrollport enough
    // unscaled height to hold the entire player before applying the transform.
    const stageHeight = Math.ceil(Math.max(
      viewport?.height || window.innerHeight, bounds.height + 24
    ));
    feed.style.setProperty("--yt-window-shorts-stage-height", stageHeight + "px");
    feed.classList.add("yt-window-shorts-stage");
    // The larger scrollport can change native vertical alignment.
    bounds = player.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      clearShortsFit();
      return;
    }
    // Inner video elements can retain their source-sized bounds or offscreen
    // offsets. The visible player box is the sizing reference, not their union.
    const origin = feed.getBoundingClientRect().top;
    const availableHeight = Math.max(1, bottom - top);
    const scale = Math.min(1, availableHeight / bounds.height);
    const scaledHeight = bounds.height * scale;
    const scaledTop = origin + (bounds.top - origin) * scale;
    const targetTop = top + (availableHeight - scaledHeight) / 2;
    const offset = targetTop - scaledTop;
    // Transform their common ancestor once: player, preview, overlays and actions
    // all keep exactly the same relative positions and hit targets.
    feed.style.setProperty("--yt-window-shorts-scale", String(scale));
    feed.style.setProperty("--yt-window-shorts-offset", offset + "px");
    feed.classList.add("yt-window-shorts-fit");
  }

  function scheduleShortsResize() {
    if (shortsResizeFrame || !isShortsPage()) return;
    shortsResizeFrame = requestAnimationFrame(() => {
      shortsResizeFrame = 0;
      fitShortsBounds();
    });
  }

  function updateShortsLayout() {
    const shorts = isShortsPage();
    disableShortsLooping();
    if (shorts && isActive()) exit();
    const feed = shorts ? document.querySelector("ytd-shorts") : null;
    if (feed !== observedShorts) {
      clearShortsFit();
      shortsResizeObserver.disconnect();
      observedShorts = feed;
      if (feed) shortsResizeObserver.observe(feed);
    }
    if (shorts) scheduleShortsResize();
    else clearShortsFit();
    if (document.documentElement.classList.contains(SHORTS_CLASS) === shorts) return;
    document.documentElement.classList.toggle(SHORTS_CLASS, shorts);
    window.dispatchEvent(new Event("resize"));
  }
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
    if (isShortsPage()) return;
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
    if (isShortsPage()) return;
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
    updateShortsLayout();
    addButton();
    autoActivate();
    closeChatIfPresent();
    if (isActive() && !document.contains(activePlayer)) exit();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  updateShortsLayout();
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
      !isShortsPage() &&
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

  document.addEventListener("scrollend", scheduleShortsResize, true);
  document.addEventListener("loadedmetadata", scheduleShortsResize, true);
  document.addEventListener("loadeddata", scheduleShortsResize, true);
  document.addEventListener("playing", scheduleShortsResize, true);
  document.addEventListener("emptied", scheduleShortsResize, true);
  document.addEventListener("fullscreenchange", scheduleShortsResize);
  window.addEventListener("resize", scheduleShortsResize);
  window.visualViewport?.addEventListener("resize", scheduleShortsResize);
  window.addEventListener("popstate", updateShortsLayout);
  document.addEventListener("yt-navigate-finish", () => {
    updateShortsLayout();
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
