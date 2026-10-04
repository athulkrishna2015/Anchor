# Changelog

All notable changes to the Anchor extension will be documented in this file.

## [2.1.7] - 2026-10-04

### Fixed
- **Reel Limit on Desktop Feeds**: Short-video counting now follows the reel actually in view instead of relying on URL changes. Desktop reel feeds swap reels while scrolling without navigating, so the limit was never reached; scrolling is now blocked past the configured reel count on desktop as well as mobile.
- **Reel Brightness Restoration**: Depth shading now follows the reel currently in view, so swiping or scrolling back up to the first reel restores full brightness. The final allowed reel still reaches full darkness and shows the rock floor.
- **Scroll Stall on Changing Pages**: Depth is now measured from the page's live scroll range instead of a value cached on first load. Previously an early measurement could clamp scrolling within a few pixels, making pages appear stuck and preventing any sinking.
- **Frozen Depth Overlay**: Depth rendering no longer depends solely on `requestAnimationFrame`. A timer fallback keeps the darkness, depth marker, and rock floor tracking the scroll position even when animation frames are withheld.
- **Timed Visit Slider**: The duration chosen on the slider is now remembered per site and honoured for later re-intervention check-ins instead of silently reverting to the default interval after a reload or in a new tab.

## [2.1.5] - 2026-10-03

### Fixed
- **Rock-Bottom Depth Enforcement**: Capped long-page scrolling at the configured depth, synchronized the visible rock floor with the actual limit, and added protection against fast-scroll overshoot.
- **Nested Scroll Areas**: Preserve scrolling in chat lists and other nested scroll panes, handing off to the page limit only when the nested pane cannot consume the gesture.
- **Mobile Depth Tracking**: Stabilized depth calculations against mobile browser viewport changes and corrected later scroll-based re-intervention thresholds.
- **Keyboard Controls**: Preserve Space-key activation for focused interactive controls.

## [2.1.4] - 2026-10-03

### Fixed
- **Fixed Layout Scrolling**: Instagram DM sidebars, chat lists, and other inner scroll containers are no longer mistaken for the page being at rock bottom, restoring normal downward scrolling.

## [2.1.3] - 2026-09-27

### Fixed
- **X Home Scrolling**: X Home pages now use normal reversible depth dimming instead of being incorrectly treated as short-video pages.
- **Page-Relative Depth**: Depth now reaches the configured bottom across short pages and remains stable while mobile browser chrome changes size.

## [2.1.2] - 2026-09-24

### Fixed
- **Reversible Depth Dimming**: Scrolling back toward the surface now restores the page to full brightness, and the bottom lock no longer traps the scroll position.

## [2.1.1] - 2026-09-24

### Added
- **Active-Page Timing**: Breath and timed re-intervention countdowns now consume only active-page time by default, pausing when the tab is hidden, unfocused, or the browser loses focus.
- **Counting Mode Setting**: Added global and per-site choices for whether re-intervention time follows active-page time or wall-clock time.

### Fixed
- **X Short-Form Video Limit**: Fixed X/Twitter video detection, stable per-post counting, back-navigation handling, autoplay enforcement, and forward navigation blocking beyond the configured reel limit.
- **Review Fixes**: Hardened domain/settings validation, session-backed tab bypasses, schedule handling, keyboard focus styles, responsive layouts, build signing, and cross-browser packaging.

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
