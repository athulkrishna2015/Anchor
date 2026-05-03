# Anchor

The infinite scroll. It's dangerously easy to scroll mindlessly for hours, especially when it comes to social media.
 
So what if we playfully visualised infinite scrolling as a deep sea dive, to help people experience their scrolling habit more tangibly?
 
Anchor is a simple browser extension which plays on this feeling of sinking. The further down you scroll, the deeper you dive — and you can watch as your screen slowly turns a dark blue, a little fish swims across your screen, and finally, you hit a (literal) rock bottom.
 
We're thinking this could be easily adapted and expanded (by you!) into a whole series of scrolling experiments. Think cave exploring, parachuting, digging to the center of the Earth... All our code is available on [GitHub](https://github.com/benjchan/Anchor) for you to play with and evolve.

## Manifest V3 & Browser Support
This extension has been updated to support **Manifest V3**. It works on both Google Chrome and Mozilla Firefox.

### Building the Add-ons
To create the extension zip files for Chrome and Firefox, you can run the included python script:
```bash
python3 make_addon.py
```
This will generate `anchor_chrome.zip` and `anchor_firefox.xpi`. The script automatically handles the differences in `manifest.json` requirements between browsers.

## Project created by:
* [Brendan Browne-Adams](https://www.brendanbrownedesigns.com/)
* [Lahari Goswami](https://laharigoswami.cargo.site)
* [Miki Chiu](https://www.mikichiu.com)
* [Tayo Kopfer](https://tayo.co.za)
* [Twomuch Studio](https://twomuch.studio)
