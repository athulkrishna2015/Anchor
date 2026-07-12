# Changelog

All notable changes to the Anchor extension will be documented in this file.

## [2.1.0] - 2026-07-13

### Added
- **Custom App-Specific Duration**: Added a "Custom..." option in the app settings customization modal, allowing you to set a custom mindfulness pause duration (from 21 to 300 seconds).
- **Build Clean Flag**: Added a `--clean` flag to `make_extension.py` to delete old zip/xpi build files and keep only the latest generated packages.

### Fixed
- **Duplicated and New Tab Bypass**: Fixed a bug where duplicated tabs or tabs opened in a new tab bypassed the intervention.
- **Tab-Specific Cooldowns**: Enforced that active bypass sessions and cooldowns are tab-specific, ensuring new tabs are always properly intervened.
- **Mobile Breathing Timer & Animation Freeze**: Fixed a bug on touch and mobile devices where switching tab focus back and forth froze or failed to restart the breathing timer.
- **High CPU Usage**: Throttled window scroll listener using `requestAnimationFrame` and cached DOM selections to prevent layout thrashing and high CPU usage.

## [2.0.1] - 2026-06-29

### Fixed
- **Blocker First Load Bypass**: Fixed first load blocker bypass with status query retry loop and adjusted transition trigger delays.
- **Breathing Countdowns & Anti-Cheat**: Added breathing countdowns with anti-cheat reset and target load race condition fixes.
- **Mobile Reels Scroll Block**: Implemented mobile reels scroll block.

## [2.0.0] - 2026-06-28

### Added
- **Favicon Integration**: Shows high-resolution website favicons instead of emojis in the websites breakdown list, details header, and mindful pause overlays.
- **Intervention Type Play Previews**: Clicking the play button beside any card triggers an inline interactive simulation of that specific exercise (Classic Breathing, Minimal Breathing, or Math Puzzles).
- **Blocked Website Trigger Scope**: Configures the trigger scope rules (block domain & subdomains vs. exact hostname only) specifically per website in the details panel.
- **Dynamic Depth Meter on Reels**: Adapts the depth ruler and red marker to move down dynamically as you watch more Reels, Shorts, or TikToks.
- **Configurable Depth Display**: Adds a dashboard option to completely disable the depth indicator ruler and red dot.
- **Per-Site Sinking Controls**: Keeps Anchor Sinking and the Reel Blocker enabled by default for every blocked website, with a per-site override available in app-specific settings.
- **Default Timed Visit Check-Ins**: Removes the global Customize-tab cooldown/re-intervention controls. The timed slider and re-intervention loop are enabled by default for all blocked websites, with the slider maximum controlled by the re-intervention timer.
- **Touchscreen scrolling limits**: Enforces `touch-action: none` rules when limits are reached to fully support touchscreen and mobile scrolling limits.

## [1.5.0]

### Added
- **Top Bar SPA Navigation:** Replaced options pages with a topnav header SPA dashboard matching a premium visual style.
- **Website Details screen:** Added details SPA tab displaying urgereduction stats and app-specific configuration.
- **Domain Overrides:** Supports overriding blocker active state, breathing duration, and scroll check-in periods specifically per domain.
- **Dynamic Cooldown slider:** Integrated custom time selection slider on bypass.
- **Animated Hourglass:** Added flipping SVG hourglass re-interventions.
- **Popup Block Toggles:** Context-sensitive block/allow buttons inside the compact popup.

## [1.4.0]

### Added
- **Options Page:** Separated settings panel into a full-screen, high-quality Options page (`options.html` / `options.js` / `options.css`) to prevent popups from feeling cramped.
- **Premium Interventions Unlocked:** Added 5 mindful intervention styles, including character lengths, custom breathing phrases, and character set complexity options.
- **Focus Scheduling:** Implemented calendar schedules (select active weekdays and time bounds) to pause blocking outside focus hours.
- **Re-Interventions:** Added timer loops that check back in periodically during active browsing.
