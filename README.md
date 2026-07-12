# Anchor

The infinite scroll. It's dangerously easy to scroll mindlessly for hours, especially when it comes to social media.
 
So what if we playfully visualised infinite scrolling as a deep sea dive, to help people experience their scrolling habit more tangibly?
 
Anchor is a browser extension which plays on this feeling of sinking. The further down you scroll, the deeper you dive — and you can watch as your screen slowly turns a dark blue, a little fish swims across your screen, and finally, you hit a (literal) rock bottom.

In this version, we have integrated **mindful interventions** right at the front gate, styled with clean vanilla architectures. When you open a target distracting website, Anchor pauses your access, directing your focus back to the real world before habits take over.

All our code is available on [GitHub](https://github.com/athulkrishna2015/Anchor) for you to play with and evolve.
Install on firefox: https://addons.mozilla.org/en-US/firefox/addon/anchor-scroll-reel-blocker/

---

## Core Features

### 1. Sinking Scroll & Reel Blocker
*   **Virtual Sinking:** Watch the screen turn deep blue as you scroll past your buffer zone. A depth marker counts your meters until you hit rock bottom and scrolling blocks.
*   **Short-Form Video Blocker (Reels, Shorts, TikTok):** Automatically detects and tracks swiping on **YouTube Shorts** (`/shorts/`), **Instagram Reels** (`/reels/` or `/reel/`), and **TikTok** (`tiktok.com`). Swiping to a new video increases your watched count and moves the depth meter down. Once you hit your configured limit, downward swiping/scrolling is fully blocked (via mouse wheel, keys, and touchscreen gestures), but you can still swipe back up to previously watched content.
*   **Performance Profiles:** Toggle animation density (High, Low, or None) to save CPU/battery.

### 2. Mindful Interventions
Anchor intercepts your access immediately upon visiting target websites and prompts you to pause:
*   **Breathing Exercise (Classic):** Guided inhale/exhale cycles showing custom breathing phrases, dynamic typography-based scale transitions, and your 24h attempts statistics.
*   **Breathing Exercise (Minimal):** A quiet, clean, textless circle pulse to calm your attention.
*   **Type Random Text / Math Puzzles:** Focus-deflecting friction tasks that force you to type verification codes or solve math equations. If a mistake is made, it instantly resets and generates a new puzzle.
*   **Healthy Alternatives:** Reminds you to read, stretch, or walk, with a delay timer if you choose to proceed.
*   **State Your Intention:** Forces you to checklist why you are opening the site, giving warning prompts for mindless browsing.

### 3. SPA Dashboard & Domain-Specific Overrides
A top navigation SPA dashboard (`dashboard.html`) managing everything:
*   **Overview Stats:** Displays prevented attempts, time saved, 24h history, and annualized savings.
*   **Dynamic Websites List:** Interactive list of blocked websites. Includes an enter-to-add search bar.
*   **Domain Details View:** Click any site in the breakdown to view its specific attempts history and toggle **app-specific settings** (such as customizing breathing duration, re-intervention timing, and sinking/reel blocker behavior).

### 4. Timed Visit Slider
*   Completing an intervention opens a full-screen time selector by default. Slide to select exactly how long you need the site, up to the configured re-intervention timer maximum, and Anchor will check back in after that period.

### 5. Hourglass Re-Intervention Loops
*   Break infinite scroll loops with automatic re-intervention check-ins, enabled by default for all blocked sites. Anchor uses the timed visit slider duration for the active visit, capped by the configured re-intervention timer, then shows an animated **hourglass SVG screen**. Choose to close the tab or undergo another mindful pause.

### 6. Single-Click Popup Block/Allow Controls
*   The extension popup menu displays the attempts count for the active website in the last 24h. It features a contextual quick-action button at the bottom: **Exclude [domain]** or **Block [domain]** dynamically depending on the current tab location and operating mode.

---
<img width="1920" height="1025" alt="Screenshot_20260628_140141" src="https://github.com/user-attachments/assets/27e20e8f-3a0c-471c-b4e2-0485f51e4019" />
<img width="1920" height="1025" alt="Screenshot_20260628_140147" src="https://github.com/user-attachments/assets/be02e883-38de-4dbb-a9d7-51b3515f29f7" />
<img width="1920" height="1025" alt="Screenshot_20260628_140202" src="https://github.com/user-attachments/assets/faf56d3c-0773-4c01-9171-6527c1d0dd7e" />
<img width="1920" height="1025" alt="Screenshot_20260628_140216" src="https://github.com/user-attachments/assets/678abdf3-8e0c-4d2b-80bf-ae6fad4a0a6c" />
<img width="1920" height="1025" alt="Screenshot_20260628_140318" src="https://github.com/user-attachments/assets/7297c0f9-3eb4-44cd-832e-d1ccf62905dd" />
<img width="1920" height="1025" alt="Screenshot_20260628_140323" src="https://github.com/user-attachments/assets/78c7d734-bc30-4527-bc6f-a5cb9bbe12d1" />
<img width="1920" height="1025" alt="Screenshot_20260628_140332" src="https://github.com/user-attachments/assets/b86958f4-f262-46d9-84c6-92b0a2203b03" />
<img width="1920" height="1025" alt="Screenshot_20260628_140355" src="https://github.com/user-attachments/assets/651ccba8-22ed-4cbc-a2cc-71b87cf3ad4c" />
<img width="379" height="467" alt="Screenshot_20260628_140437" src="https://github.com/user-attachments/assets/d6705143-75da-4842-90cd-11e2d2ee8626" />



## Extension Architecture

All browser extension files live in `chrome_build/`, which is the canonical Chrome unpacked extension folder:
*   `chrome_build/dashboard.html` / `chrome_build/js/dashboard.js`: Top-nav SPA dashboard, details panel, and overrides manager.
*   `chrome_build/popup.html` / `chrome_build/js/popup.js`: Compact popup displaying site-specific 24h attempts and quick-toggle blockers.
*   `chrome_build/onboarding.html` / `chrome_build/js/onboard.js`: First-run onboarding setup page.
*   `chrome_build/js/content.js`: Handles initial page intercepts, timed visit slider rendering, interventions overlay rendering, re-intervention timers, and scroll trackers.
*   `chrome_build/js/background.js`: Manages tab closing messages, verifies schedule checks, and merges domain overrides.

---

## Local Development & Testing

### For Google Chrome
The source code is natively formatted for **Google Chrome**.
1.  Open Chrome and go to `chrome://extensions/`
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked** and select this repository's `chrome_build/` folder.
4.  To configure targets and schedules, click the Options link in the extension details or use the popup.

### For Mozilla Firefox
Use the build script to transform and package for Firefox:
1.  Run `python3 make_extension.py`
2.  Open Firefox and go to `about:addons`
3.  Click the gear icon ⚙️ and select **Install Add-on From File...**
4.  Select the generated `anchor_firefox_[date].xpi` file.

### Building the Add-ons
To package Chrome and Firefox versions, run:
```bash
python3 make_extension.py [version]
```
This builds `anchor_chrome_v[version]_[date].zip` and `anchor_firefox_v[version]_[date].xpi`.
The script reads the Chrome extension from `chrome_build/` and refreshes `firefox_build/` with Firefox-specific manifest changes.

---

## Changelog

See the full release history in [CHANGELOG.md](CHANGELOG.md).

---

## Project created by:
*   [Brendan Browne-Adams](https://www.brendanbrownedesigns.com/)
*   [Lahari Goswami](https://laharigoswami.cargo.site)
*   [Miki Chiu](https://www.mikichiu.com)
*   [Tayo Kopfer](https://tayo.co.za)
*   [Twomuch Studio](https://twomuch.studio)

**Maintained & extended by:**
*   [athulkrishna2015](https://github.com/athulkrishna2015)

**Forked from the original by:**
*   [benjchan/Anchor](https://github.com/benjchan/Anchor)
