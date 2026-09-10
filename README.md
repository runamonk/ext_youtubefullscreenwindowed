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
controls and keyboard shortcuts. When a Short finishes, it stops instead of
automatically replaying. You can replay it using the normal playback controls.

Window fullscreen activates when a video starts playing. Use any of these controls to toggle it:

- Click the new four-corners button in the YouTube player controls.
- Click the extension's toolbar button.
- Press **F**.

During window fullscreen, move the pointer to the top edge of the page to reveal
the YouTube header. Keyboard focus also reveals it. Outside window fullscreen,
regular videos keep the normal YouTube header.

Hover over the bottom toolbar in window fullscreen to like or dislike the video
using the thumb buttons beside the time display. Filled icons show your current
rating. Clicking again removes it using YouTube's normal rating behavior.

Press **Escape**, **F**, or the player button again to exit.
Window fullscreen also exits automatically when the video finishes playing. Starting another video enables it again. If you manually exit, that video stays out of window fullscreen when resumed or replayed in the same tab until you refresh the page. Manually enabling fullscreen again clears that preference for the video.

The extension runs only on `https://www.youtube.com/*` and requests no optional
permissions.

## Toolbar options

Right-click the extension icon and choose **Options**, or open **Extension
options** from the extension's details in the browser extension manager.

Each supported player control has its own visibility switch, including the seek
bar, time, chapter, like/dislike buttons, playback controls, viewing modes and
top-bar actions. All switches default to on. Changes are saved locally and apply
immediately to open YouTube tabs, only while window fullscreen is active.
Enabled switches preserve YouTube's normal availability and hover behavior;
they do not force unavailable controls to appear or enable captions/autoplay.

**Restore defaults** enables every switch. If you hide the window fullscreen
button, **F**, **Escape** and the extension icon still let you exit.
The extension requests the **storage** permission to remember these preferences.
After updating an unpacked installation, reload the extension and YouTube tabs.

  Playback options let you disable automatic entry or automatic exit at the end of
  a video, or keep the toolbar visible. Automatic entry and exit default to on;
  keeping the toolbar visible defaults to off, preserving the existing hover behavior.
  Disabling automatic entry does not exit a video already in window fullscreen.

  The options page has **System / browser (automatic)**, **Light**, and **Dark**
  themes. Automatic is the default and follows the browser-reported light/dark
  preference, including changes while the page is open. It does not copy custom
  Edge theme colors or backgrounds. Manual overrides affect only the options page.
  Restore defaults also resets playback settings and the theme.

The **Top header** visibility group controls the YouTube page masthead: menu,
logo, search, microphone, Create, notifications and account. These switches apply
only in faux fullscreen. Video overlay actions are listed under **Player controls**.
