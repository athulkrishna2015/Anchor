import os
import sys
import zipfile
import json
import datetime
import subprocess
import argparse
import shutil

CHROME_BUILD_DIR = "chrome_build"
FIREFOX_BUILD_DIR = "firefox_build"
FIREFOX_TEMP_BUILD_DIR = "firefox_temp_build"


def load_manifest(version_override=None):
    """Load the canonical Chrome manifest and apply optional version override."""
    with open(os.path.join(CHROME_BUILD_DIR, "manifest.json"), "r") as f:
        manifest = json.load(f)

    if version_override:
        manifest["version"] = version_override

    return manifest


def transform_manifest_for_firefox(manifest):
    """Return a Firefox-compatible copy of the Chrome MV3 manifest."""
    firefox_manifest = json.loads(json.dumps(manifest))

    if "background" in firefox_manifest and "service_worker" in firefox_manifest["background"]:
        firefox_manifest["background"]["scripts"] = [firefox_manifest["background"]["service_worker"]]
        del firefox_manifest["background"]["service_worker"]

    firefox_manifest["browser_specific_settings"] = {
        "gecko": {
            "id": "anchor@athulkrishna2015",
            "strict_min_version": "140.0",
            "data_collection_permissions": {
                "required": ["none"]
            }
        },
        "gecko_android": {
            "strict_min_version": "142.0"
        }
    }

    return firefox_manifest


def iter_extension_files():
    """Yield all packaged files from the Chrome build folder except manifest."""
    for root, _, files in os.walk(CHROME_BUILD_DIR):
        for file in files:
            path = os.path.join(root, file)
            rel_path = os.path.relpath(path, CHROME_BUILD_DIR)
            if rel_path == "manifest.json":
                continue
            yield path, rel_path


def copy_unpacked_build(destination, manifest):
    """Copy the Chrome build folder to destination and write the supplied manifest."""
    if os.path.exists(destination):
        shutil.rmtree(destination)

    shutil.copytree(CHROME_BUILD_DIR, destination)
    with open(os.path.join(destination, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

def load_env():
    """Load API keys from .env file."""
    env = {}
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env[key] = value.strip('"').strip("'")
    return env

def create_addon(browser, version_override=None):
    """Create a zip/xpi package for the specified browser."""
    extension = "xpi" if browser == "firefox" else "zip"
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    manifest = load_manifest(version_override)

    version = manifest.get("version", "1.0.0")
    filename = f"anchor_{browser}_v{version}_{timestamp}.{extension}"

    if browser == "firefox":
        manifest = transform_manifest_for_firefox(manifest)

    with zipfile.ZipFile(filename, 'w') as zipf:
        for source_path, archive_path in iter_extension_files():
            zipf.write(source_path, archive_path)

        manifest_str = json.dumps(manifest, indent=2)
        zipf.writestr("manifest.json", manifest_str)

    if browser == "firefox":
        copy_unpacked_build(FIREFOX_BUILD_DIR, manifest)
        print(f"Created unpacked directory: {FIREFOX_BUILD_DIR}")

    print(f"Created {filename}")
    return filename

def sign_firefox(version, version_override=None):
    """Sign the Firefox addon using web-ext."""
    env = load_env()
    issuer = env.get("AMO_JWT_ISSUER")
    secret = env.get("AMO_JWT_SECRET")
    
    if not issuer or not secret:
        print("\nError: AMO_JWT_ISSUER or AMO_JWT_SECRET not found in .env")
        return

    manifest = transform_manifest_for_firefox(load_manifest(version_override))
    copy_unpacked_build(FIREFOX_TEMP_BUILD_DIR, manifest)

    print(f"\nSigning Firefox addon...")
    cmd = [
        "npx", "web-ext", "sign",
        "--api-key", issuer,
        "--api-secret", secret,
        "--channel", "listed",
        "--source-dir", FIREFOX_TEMP_BUILD_DIR,
        "--artifacts-dir", "./web-ext-artifacts"
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("\nSuccessfully signed Firefox addon!")
    finally:
        # Cleanup safely
        if os.path.exists(FIREFOX_TEMP_BUILD_DIR):
            shutil.rmtree(FIREFOX_TEMP_BUILD_DIR, ignore_errors=True)

import glob

def clean_old_builds(new_chrome_file, new_firefox_file):
    """Delete old built extension packages in the root directory, preserving the newly built ones."""
    print("\nCleaning old build artifacts...")
    for pattern in ["anchor_chrome_v*.zip", "anchor_firefox_v*.xpi"]:
        for file in glob.glob(pattern):
            if file != new_chrome_file and file != new_firefox_file:
                try:
                    os.remove(file)
                    print(f"Removed old package: {file}")
                except Exception as e:
                    print(f"Error removing {file}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build and optionally sign the Anchor extension.")
    parser.add_argument("version", nargs="?", help="Version override for the built addon (optional).")
    parser.add_argument("--sign", action="store_true", help="Sign the Firefox addon using credentials in .env")
    parser.add_argument("--clean", action="store_true", help="Delete older zip/xpi build files and keep only the newly generated ones")
    
    args = parser.parse_args()
    
    # Build Chrome version
    chrome_file = create_addon("chrome", args.version)
    
    # Build Firefox version (for local use)
    firefox_file = create_addon("firefox", args.version)
    
    # Optionally sign the Firefox version
    if args.sign:
        sign_firefox(args.version)

    # Clean old builds if requested
    if args.clean:
        clean_old_builds(chrome_file, firefox_file)
