# YouTube Window Fullscreen

A minimal Manifest V3 extension for Chromium browsers. It makes the current
YouTube player fill the browser's content area without entering operating-system
fullscreen mode.

## Install

1. Open `chrome://extensions` in Chrome, or `edge://extensions` in Edge.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project folder.

## Use

Shorts automatically fit the browser content height without cropping the video.
Move the pointer to the top edge of the page to reveal the YouTube header; it also
appears when its controls receive keyboard focus. Shorts retain their normal feed
controls and keyboard shortcuts.

Window fullscreen activates when a video starts playing. Use any of these controls to toggle it:

- Click the new four-corners button in the YouTube player controls.
- Click the extension's toolbar button.
- Press **F**.

Press **Escape**, **F**, or the player button again to exit.
Window fullscreen also exits automatically when the video finishes playing. Starting another video enables it again. If you manually exit, that video stays out of window fullscreen when resumed or replayed in the same tab until you refresh the page. Manually enabling fullscreen again clears that preference for the video.

The extension runs only on `https://www.youtube.com/*` and requests no optional
permissions.
