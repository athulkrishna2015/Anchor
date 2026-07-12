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
