# Developer Guide | Anchor

This guide outlines the local development setup, codebase architecture, and packaging instructions for the Anchor browser extension.

---

## Codebase Architecture

Anchor is a cross-browser extension compatible with Google Chrome (Manifest V3) and Mozilla Firefox / Zen Browser (Manifest V3 compatible).

All browser extension files live in `chrome_build/`. This folder is the canonical unpacked Chrome extension and the source used to generate Firefox builds.

Core JavaScript modules are located under `chrome_build/js/`:
*   `chrome_build/js/background.js`: Manages service worker lifecycle, handles tab close signals, queries active schedules, and merges app-specific override parameters. Also handles fetching website favicons in the background to bypass host website CSP constraints.
*   `chrome_build/js/content.js`: Injected into all web pages. Renders mindful pause overlays, manages scrolling indicators (depth line/marker), and enforces reels limit locks.
*   `chrome_build/js/dashboard.js`: Backing logic for the SPA options panel (`chrome_build/dashboard.html`). Handles interactive details views, trigger scopes, and saves setting overrides.
*   `chrome_build/js/popup.js`: Controls the extension quick-toggle dropdown menu (`chrome_build/popup.html`).
*   `chrome_build/js/onboard.js`: Backing logic for the first-run installation welcome screen (`chrome_build/onboarding.html`).

Shared UI Assets:
*   `chrome_build/main.css`: Houses all overlay modal animations (breathing cycle, flipping hourglass, etc.), resets typography constraints, and handles absolute viewport layer sizing.

---

## Local Development & Testing

### Google Chrome
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked** and select this repository's `chrome_build/` folder.

### Mozilla Firefox / Zen Browser
Because Firefox requires Manifest V3 background scripts to be declared as `scripts` arrays instead of `service_worker` blocks, you must use the build script to compile a Firefox-compatible folder first:
1.  Generate the build directory:
    ```bash
    python3 make_extension.py
    ```
    This creates the `firefox_build/` folder containing the converted `manifest.json`.
2.  Open your browser and navigate to `about:debugging`.
3.  Click **This Firefox** (or **This Zen**), select **Load Temporary Add-on...**, and select the `manifest.json` file inside `firefox_build/`.

### Automated Testing with Persistent Profile (Recommended)
You can launch Zen Browser or Firefox from the terminal with the extension pre-loaded and session changes persisted (preventing the "first-time setup" welcome flow from appearing on every run):
```bash
npx web-ext run --source-dir firefox_build --firefox /usr/bin/zen-browser --firefox-profile ./zen-test-profile --profile-create-if-missing --keep-profile-changes
```

---

## Build and Release Packaging

To build and package clean release zips/xpis for deployment to the Chrome Web Store and Mozilla Add-ons store, run the python compiler script in the root directory:

```bash
python3 make_extension.py [version]
```

*   **Version Parameter (Optional)**: Provide a version string (e.g. `2.0.0`) to override the baseline version in `manifest.json`.
*   **Source Folder**: Reads extension files from `chrome_build/`.
*   **Artifacts**: Generates `anchor_chrome_v[version]_[date].zip` and `anchor_firefox_v[version]_[date].xpi` in the root folder, and updates the `firefox_build/` unpacked directory.
*   **Firefox Transform**: Copies `chrome_build/` into `firefox_build/` and writes a Firefox-compatible `manifest.json`.

---

## Development Notes & Caveats

### 1. Firefox Content Security Policy (CSP) Bypass
Host websites can enforce strict CSP policies (like `img-src 'self'`) which block the content script from loading external favicon redirect services directly. 
*   **Solution**: Content scripts must send a `{type: "fetchFavicon", domain: ...}` message to `background.js`. The background worker fetches the image blob and reads it as a Base64 Data URL, returning the raw data to the content script. This bypasses host CSP limits.

### 2. Range Slider Clipping in Firefox
Firefox automatically clips range input thumbs (`::-moz-range-thumb`) if the container `<input type="range">` height is smaller than the thumb itself (e.g. `6px` vs `24px`).
*   **Solution**: We set the parent range input style to `height: 24px; background: transparent;` to ensure the thumb is not clipped, and style the range track (`::-webkit-slider-runnable-track` / `::-moz-range-track`) to display the visual `6px` bar.

### 3. Sea Creatures (Fishes) Positioning
To keep the surface at `scrollTop = 0` completely clean, sea creatures start at `depthStart + window.innerHeight * 1.1`. This keeps them below the bottom fold when the page is opened, ensuring they only float up once active diving begins.
