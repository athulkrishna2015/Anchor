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
*   **Domain Details View:** Click any site in the breakdown to view its specific attempts history and toggle **app-specific settings** (such as customizing breathing duration or adjusting/disabling re-intervention timers).

### 4. Interactive Cooldown slider
*   When bypass mode is set to "cooldown", completing an intervention opens a full-screen time selector. Slide to select exactly how long you need the site (e.g. 1-15 minutes), and the blocker will automatically lock back after that period.

### 5. Hourglass Re-Intervention Loops
*   Break infinite scroll loops with automatic re-intervention check-ins (enabled by default for all blocked sites, and customizable via per-site settings). Anchor will periodically check back in (e.g. every 10 minutes) showing an animated **hourglass SVG screen**. Choose to close the tab or undergo another mindful pause.

### 6. Single-Click Popup Block/Allow Controls
*   The extension popup menu displays the attempts count for the active website in the last 24h. It features a contextual quick-action button at the bottom: **Exclude [domain]** or **Block [domain]** dynamically depending on the current tab location and operating mode.

---

## Extension Architecture

All browser extension files live in `chrome_build/`, which is the canonical Chrome unpacked extension folder:
*   `chrome_build/dashboard.html` / `chrome_build/js/dashboard.js`: Top-nav SPA dashboard, details panel, and overrides manager.
*   `chrome_build/popup.html` / `chrome_build/js/popup.js`: Compact popup displaying site-specific 24h attempts and quick-toggle blockers.
*   `chrome_build/onboarding.html` / `chrome_build/js/onboard.js`: First-run onboarding setup page.
*   `chrome_build/js/content.js`: Handles initial page intercepts, interventions overlay rendering, re-intervention timers, and scroll trackers.
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
### v1.6.0
*   **Favicon Integration**: Shows high-resolution website favicons instead of emojis in the websites breakdown list, details header, and mindful pause overlays.
*   **Intervention Type Play Previews**: Clicking the play button beside any card triggers an inline interactive simulation of that specific exercise (Classic Breathing, Minimal Breathing, or Math Puzzles).
*   **Blocked Website Trigger Scope**: Configures the trigger scope rules (block domain & subdomains vs. exact hostname only) specifically per website in the details panel.
*   **Dynamic Depth Meter on Reels**: Adapts the depth ruler and red marker to move down dynamically as you watch more Reels, Shorts, or TikToks.
*   **Configurable Depth Display**: Adds a dashboard option to completely disable the depth indicator ruler and red dot.
*   **Per-Site Sinking Controls**: Keeps Anchor Sinking and the Reel Blocker enabled by default for every blocked website, with a per-site override available in app-specific settings.
*   **Touchscreen scrolling limits**: Enforces `touch-action: none` rules when limits are reached to fully support touchscreen and mobile scrolling limits.

### v1.5.0
*   **Top Bar SPA Navigation:** Replaced options pages with a topnav header SPA dashboard matching a premium visual style.
*   **Website Details screen:** Added details SPA tab displaying urgereduction stats and app-specific configuration.
*   **Domain Overrides:** Supports overriding blocker active state, breathing duration, and scroll check-in periods specifically per domain.
*   **Dynamic Cooldown slider:** Integrated custom time selection slider on bypass.
*   **Animated Hourglass:** Added flipping SVG hourglass re-interventions.
*   **Popup Block Toggles:** Context-sensitive block/allow buttons inside the compact popup.

### v1.4.0
*   **Options Page:** Separated settings panel into a full-screen, high-quality Options page (`options.html` / `options.js` / `options.css`) to prevent popups from feeling cramped.
*   **Premium Interventions Unlocked:** Added 5 mindful intervention styles, including character lengths, custom breathing phrases, and character set complexity options.
*   **Focus Scheduling:** Implemented calendar schedules (select active weekdays and time bounds) to pause blocking outside focus hours.
*   **Re-Interventions:** Added timer loops that check back in periodically during active browsing.

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
