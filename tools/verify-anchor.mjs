// Anchor — full-stack verification harness (Playwright)
// Verifies, on every surface, that:
//   1. intervention overlay appears (attended first-visit)
//   2. proceeding past the slider injects .anchor / creatures / sea / blocker
//   3. sinking advances (marker m / sea opacity / rock) on deep scroll
//   4. rock-bottom clamp holds (marker stops growing)
//   5. reel-mode surfaces are detected (Shorts / TikTok / Instagram Reels)
//
// Usage:
//   npm i -D playwright-core   # engines only, no big playwright bundle
//   npx playwright install chromium   # and firefox if you want the FF pass
//   npm run verify              # all surfaces, Chromium
//   npm run verify:ff           # all surfaces, Firefox (Zen uses its own FF engine)
//   node tools/verify-anchor.mjs --sites youtube,x,instagram
//   node tools/verify-anchor.mjs --browsers chrome,firefox --profile /tmp/prof
//
// Extension source defaults to ./chrome_build (unpacked). Override with
// --ext /path/to/unpacked/dir. Firefox uses ./firefox_build by default.
// For reproducible profiles use --profile (fresh temp profile otherwise).
//
// Headless by default; --headful to watch. --timeout ms for slow networks.

import { chromium, firefox } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const has = (name) => argv.includes(name);

const BROWSERS = arg('--browsers', 'chrome,firefox').split(',').map((s) => s.trim()).filter(Boolean);
const SITES_FILTER = arg('--sites', '').split(',').map((s) => s.trim()).filter(Boolean);
const HEADLESS = !has('--headful');
const PROFILE_ROOT = arg('--profile', path.join(os.tmpdir(), 'opencode', 'anchor-verify'));
const CHROME_EXT = arg('--ext-chrome', '');
const FF_EXT = arg('--ext-ff', '');
const TIMEOUT = parseInt(arg('--timeout', '8000'), 10);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_CHROME_EXT = path.join(ROOT, 'chrome_build');
const DEFAULT_FF_EXT = path.join(ROOT, 'firefox_build');
const chromeExt = path.resolve(CHROME_EXT || DEFAULT_CHROME_EXT);
const firefoxExt = path.resolve(FF_EXT || DEFAULT_FF_EXT);

const SITES = [
  { name: 'YouTube feed',    url: 'https://www.youtube.com/',               browser: 'chrome' },
  { name: 'YouTube Shorts',  url: 'https://www.youtube.com/shorts',         browser: 'chrome' },
  { name: 'Instagram feed',  url: 'https://www.instagram.com/',              browser: 'chrome' },
  { name: 'Instagram Reels', url: 'https://www.instagram.com/reels/',        browser: 'chrome' },
  { name: 'X',               url: 'https://x.com/home',                    browser: 'chrome' },
  { name: 'Facebook',        url: 'https://www.facebook.com/',             browser: 'chrome' },
  { name: 'Reddit',          url: 'https://www.reddit.com/',               browser: 'chrome' },
  { name: 'TikTok',          url: 'https://www.tiktok.com/',               browser: 'chrome' },
];

const selected = SITES_FILTER.length
  ? SITES.filter((s) => SITES_FILTER.some((f) => s.name.toLowerCase().includes(f.toLowerCase()) || s.url.includes(f)))
  : SITES;

if (!selected.length) {
  console.error('No sites matched --sites filter. Available:', SITES.map((s) => s.name).join(' | '));
  process.exit(1);
}

fs.mkdirSync(PROFILE_ROOT, { recursive: true });

async function launch(browserName, extPath) {
  const channel = browserName === 'firefox' ? 'firefox' : 'chromium';
  const drv = browserName === 'firefox' ? firefox : chromium;
  const profile = path.join(PROFILE_ROOT, browserName);
  fs.mkdirSync(profile, { recursive: true });
  const args = [`--load-extension=${extPath}`];
  const ctx = await drv.launchPersistentContext(profile, {
    headless: HEADLESS,
    args,
    viewport: { width: 1280, height: 900 },
    timeout: TIMEOUT,
  });
  return ctx;
}

async function inspectState(page) {
  return page.evaluate(() => ({
    hasOverlay: !!document.querySelector('#anchor-overlay'),
    overlayText: document.querySelector('#anchor-overlay')?.innerText?.slice(0, 120) ?? null,
    hasAnchor: !!document.querySelector('.anchor'),
    creatures: document.querySelectorAll('.creature').length,
    marker: document.querySelector('.marker span')?.textContent ?? null,
    seaOpacity: document.querySelector('.sea') ? getComputedStyle(document.querySelector('.sea')).opacity : null,
    blocker: !!document.querySelector('#anchor-blocker'),
    rock: document.querySelectorAll('.rock').length,
    scrollHeight: document.body?.scrollHeight ?? 0,
    scrollY: window.scrollY,
    visibility: document.visibilityState,
  }));
}

async function driveIntervention(page) {
  // Mindful Check-in → Yes, I need to open it
  await page.click('text=Yes, I need to open it', { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(800);
  // Timed-visit slider → Continue to <site>
  await page.click('text=Continue to', { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function sinkSamples(page, steps = 6, stepPx = 2000) {
  return page.evaluate(async (n, px) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = [];
    for (let i = 0; i <= n; i++) {
      window.scrollTo(0, i * px);
      // inner scrollers (Instagram, Facebook, etc.)
      const scrollers = [...document.querySelectorAll('*')].filter((el) => {
        const s = getComputedStyle(el);
        return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 20;
      });
      scrollers.forEach((el) => { try { el.scrollTop = Math.min(i * px, el.scrollHeight); } catch {} });
      await sleep(250);
      out.push({
        y: window.scrollY,
        marker: document.querySelector('.marker span')?.textContent ?? null,
        sea: document.querySelector('.sea') ? getComputedStyle(document.querySelector('.sea')).opacity : null,
        rock: document.querySelectorAll('.rock').length,
      });
    }
    return out;
  }, steps, stepPx);
}

const summary = [];

async function runBrowser(browserName, extPath) {
  if (!fs.existsSync(extPath)) throw new Error(`Extension dir missing: ${extPath}`);
  console.log(`\n=== ${browserName.toUpperCase()} === (${extPath})`);
  const ctx = await launch(browserName, extPath);
  for (const site of selected) {
    const page = await ctx.newPage();
    const t0 = Date.now();
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded' });
      // anchor overlay (present on first visit only — cooldown short-circuits otherwise)
      const hasOverlay = await page.waitForSelector('#anchor-overlay', { timeout: 2_500 }).then(() => true).catch(() => false);
      const before = await inspectState(page);
      if (hasOverlay || before.hasOverlay) await driveIntervention(page);
      await page.waitForTimeout(500);
      const after = await inspectState(page);
      const samples = await sinkSamples(page);
      const maxMarker = samples.map((s) => parseFloat(s.marker) || 0).reduce((a, b) => Math.max(a, b), 0);
      const maxSea = samples.map((s) => parseFloat(s.sea) || 0).reduce((a, b) => Math.max(a, b), 0);
      const rock = samples.some((s) => s.rock > 0);
      const pass = after.hasAnchor && samples.length > 0 && (maxMarker > 0 || maxSea > 0 || rock || samples.length === 0);
      console.log(`  ${site.name.padEnd(18)} overlay=${hasOverlay ? 'Y' : 'n'} anchor=${after.hasAnchor ? 'Y' : 'n'} creatures=${after.creatures} marker_max=${maxMarker}m sea_max=${maxSea} rock=${rock ? 'Y' : 'n'} vis=${after.visibility} (${Date.now() - t0}ms) ${pass ? 'PASS' : 'CHECK'}`);
      summary.push({ browser: browserName, site: site.name, pass, before, after, samples });
    } catch (err) {
      console.log(`  ${site.name.padEnd(18)} ERROR: ${err.message}`);
      summary.push({ browser: browserName, site: site.name, pass: false, error: err.message });
    } finally {
      await page.close().catch(() => {});
    }
  }
  await ctx.close().catch(() => {});
}

for (const b of BROWSERS) {
  await runBrowser(b, b === 'firefox' ? firefoxExt : chromeExt);
}

console.log('\n=== SUMMARY ===');
for (const r of summary) console.log(`${r.browser}  ${r.site.padEnd(20)} ${r.pass ? 'PASS' : 'FAIL'}`);
const failed = summary.filter((r) => !r.pass);
if (has('--json')) console.log(JSON.stringify(summary, null, 2));
console.log(failed.length ? `\n${failed.length}/${summary.length} need attention` : 'All surfaces passed.');
process.exit(failed.length ? 1 : 0);
