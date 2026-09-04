(() => {
  "use strict";

  const ROOT_CLASS = "yt-window-fullscreen";
  const PLAYER_CLASS = "yt-window-fullscreen-player";
  const BUTTON_ID = "yt-window-fullscreen-button";
  let activePlayer = null;
  let autoActivatedVideo = null;
  let chatHandledVideo = null;



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
      ? "Exit window fullscreen (`)"
      : "Window fullscreen (`)";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(active));
  }

  function exit() {
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

    activePlayer = player;
    activePlayer.classList.add(PLAYER_CLASS);
    document.documentElement.classList.add(ROOT_CLASS);
    window.scrollTo(0, 0);
    updateButton();
    window.dispatchEvent(new Event("resize"));
  }

  function toggle() {
    isActive() ? exit() : enter();
  }

  function autoActivate() {
    const videoKey = getVideoKey();
    if (!videoKey || videoKey === autoActivatedVideo || !getPlayer()) return;

    autoActivatedVideo = videoKey;
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
      exit();
    } else if (event.code === "Backquote" && !isTyping && !event.repeat) {
      event.preventDefault();
      toggle();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement && isActive()) exit();
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "toggle-window-fullscreen") toggle();
  });
})();
