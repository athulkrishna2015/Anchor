# Anchor

The infinite scroll. It's dangerously easy to scroll mindlessly for hours, especially when it comes to social media.
 
So what if we playfully visualised infinite scrolling as a deep sea dive, to help people experience their scrolling habit more tangibly?
 
Anchor is a simple browser extension which plays on this feeling of sinking. The further down you scroll, the deeper you dive — and you can watch as your screen slowly turns a dark blue, a little fish swims across your screen, and finally, you hit a (literal) rock bottom.
 
We're thinking this could be easily adapted and expanded (by you!) into a whole series of scrolling experiments. Think cave exploring, parachuting, digging to the center of the Earth... All our code is available on [GitHub](https://github.com/athulkrishna2015/Anchor) for you to play with and evolve.

## Manifest V3 & Browser Support
This extension has been updated to support **Manifest V3**. It works on both Google Chrome and Mozilla Firefox.

### Local Development & Testing

#### For Google Chrome
The source code in this repository is natively formatted for **Google Chrome**. You do not need to build the `.zip` file for local development.
To install the extension for testing:
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** in the top left and select this repository's folder.
4. When you make code changes, just click the reload icon on the extension's card to instantly apply them.

#### For Mozilla Firefox
Because Firefox requires slight modifications to the `manifest.json` (specifically changing `service_worker` to `scripts`), you **must** use the build script to test on Firefox.
1. Run `python3 make_addon.py`
2. Open Firefox and go to `about:addons`
3. Click the gear icon ⚙️ and select **Install Add-on From File...**
4. Select the generated `anchor_firefox_[date].xpi` file.

### Building the Add-ons
To create the extension zip files for Chrome and Firefox, you can run the included python script:
```bash
python3 make_addon.py
```
This will generate `anchor_chrome_[date].zip` and `anchor_firefox_[date].xpi`. The script automatically handles the differences in `manifest.json` requirements between browsers.

## Changelog
### v1.3.1
- **Scroll-Up Fix:** When Reel Mode limit is reached, you can now still scroll back up to re-watch previous videos. Only downward scrolling is blocked.
- **Firefox for Android Support:** The `.xpi` build now includes the `gecko_android` manifest declaration, making the extension compatible with Firefox Mobile (v113+).
- **Correct Extension ID:** Updated the Firefox addon ID from the original author's handle to `anchor@athulkrishna2015`.
- **Credits Updated:** Both the popup and README now correctly list the original creators, the maintainer (athulkrishna2015), and a link back to the original `benjchan/Anchor` fork.

### v1.3.0
- **Operating Modes (Allowlist vs Blocklist):** Added a global toggle. You can now configure Anchor to run everywhere (Blocklist) or set it to run *only* on sites you explicitly specify (Allowlist).
- **First-Run Onboarding:** Built a brand new interactive setup page that automatically launches when you install the extension, asking you to choose your preferred operating mode.
- **Project Links:** Re-routed all internal links and README documentation to point to the new `athulkrishna2015/Anchor` repository.

### v1.2.0
- **Domain & Subdomain Exclusions:** You can now choose whether to disable Anchor on a specific subdomain (e.g. `music.youtube.com`) or across an entire domain structure (`youtube.com`).
- **Improved Pacing (Virtual Scale):** Updated the physics engine to use a virtual scale (1m = 1000px). This makes reaching a 10m depth take about 15-20 posts instead of an exhausting 60+ posts, improving the pacing and user satisfaction.
- **Configurable Start Buffers:** Added UI settings to change the initial "safe zone" buffer length for both standard scrolling and Reel mode, ensuring the extension doesn't distract you during genuine use.
- **Popup UI Enhancements:** Re-engineered the settings window to be fully scrollable, comfortably supporting any future additions without breaking Chrome's window limits.
- **Robust Reel Mode Blocker:** Rewrote the scroll-blocking logic to hook into the absolute highest level of the browser window, permanently fixing the issue where TikTok or YouTube Shorts could bypass the blocker.

### v1.1.0
- **Reel Mode added!** Anchor now supports infinitely scrolling video feeds like YouTube Shorts, TikTok, and Instagram Reels. The standard depth meter transforms into a "Reel Tracker" and blocks you when you've reached your configured limit.
- **Advanced Settings Panel:** Added a new configuration menu inside the popup.
- **Domain Exclusions:** Added the ability to completely disable Anchor on specific sites.
- **Custom Depth & Reel Limits:** Easily tweak exactly how far you want to be able to scroll/swipe before hitting rock bottom.
- **CPU Saver (Animation Density):** Experiencing lag? You can now lower the number of animated fish, or turn them off entirely, straight from the settings menu.
- **Natural Darkening CSS:** Re-engineered the sea darkening effect to use a deep `linear-gradient` with an eased opacity curve and a `multiply` blend mode for a much more immersive sinking experience.
- **Manifest V3 Migration:** Brought the extension up to modern standards and created a cross-browser Python build script.

## Project created by:
* [Brendan Browne-Adams](https://www.brendanbrownedesigns.com/)
* [Lahari Goswami](https://laharigoswami.cargo.site)
* [Miki Chiu](https://www.mikichiu.com)
* [Tayo Kopfer](https://tayo.co.za)
* [Twomuch Studio](https://twomuch.studio)

**Maintained & extended by:**
* [athulkrishna2015](https://github.com/athulkrishna2015)

**Forked from the original by:**
* [benjchan/Anchor](https://github.com/benjchan/Anchor)
