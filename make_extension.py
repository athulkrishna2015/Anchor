import os
import sys
import zipfile
import json
import datetime
import subprocess
import argparse

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
    
    with open("manifest.json", "r") as f:
        manifest = json.load(f)

    version = version_override if version_override else manifest.get("version", "1.0.0")
    filename = f"anchor_{browser}_v{version}_{timestamp}.{extension}"
    
    files_to_include = [
        "background.js",
        "content.js",
        "icon.png",
        "jquery-3.2.1.js",
        "main.css",
        "popup.css",
        "popup.html",
        "popup.js",
        "onboarding.html",
        "onboarding.js"
    ]
    
    if version_override:
        manifest["version"] = version_override
        
    if browser == "firefox":
        # Firefox MV3 requires 'scripts' fallback for background
        if "background" in manifest and "service_worker" in manifest["background"]:
            manifest["background"]["scripts"] = [manifest["background"]["service_worker"]]
            # We keep service_worker for newer Firefox versions
        
        manifest["browser_specific_settings"] = {
            "gecko": {
                "id": "anchor@athulkrishna2015",
                "strict_min_version": "109.0",
                "data_collection_permissions": {
                    "required": ["none"]
                }
            },
            "gecko_android": {
                "strict_min_version": "113.0"
            }
        }
    
    with zipfile.ZipFile(filename, 'w') as zipf:
        for file in files_to_include:
            if os.path.exists(file):
                zipf.write(file)
        
        manifest_str = json.dumps(manifest, indent=2)
        zipf.writestr("manifest.json", manifest_str)
        
    if browser == "firefox":
        unpacked_dir = "firefox_build"
        if not os.path.exists(unpacked_dir):
            os.makedirs(unpacked_dir)
        import shutil
        for file in files_to_include:
            if os.path.exists(file):
                shutil.copy2(file, os.path.join(unpacked_dir, file))
        with open(os.path.join(unpacked_dir, "manifest.json"), "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"Created unpacked directory: {unpacked_dir}")
        
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

    # Create a temporary directory for signing
    tmp_dir = "firefox_temp_build"
    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)

    # Re-run the logic to get the Firefox manifest
    with open("manifest.json", "r") as f:
        manifest = json.load(f)
    
    if version_override:
        manifest["version"] = version_override

    # Firefox specific transformations
    if "background" in manifest and "service_worker" in manifest["background"]:
        manifest["background"]["scripts"] = [manifest["background"]["service_worker"]]
    
    manifest["browser_specific_settings"] = {
        "gecko": {
            "id": "anchor@athulkrishna2015",
            "strict_min_version": "109.0",
            "data_collection_permissions": { "required": ["none"] }
        }
    }

    # Copy files to temp dir
    files_to_include = [
        "background.js", "content.js", "icon.png", "jquery-3.2.1.js",
        "main.css", "popup.css", "popup.html", "popup.js",
        "onboarding.html", "onboarding.js"
    ]
    for file in files_to_include:
        if os.path.exists(file):
            with open(file, 'rb') as src, open(os.path.join(tmp_dir, file), 'wb') as dst:
                dst.write(src.read())
    
    with open(os.path.join(tmp_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nSigning Firefox addon...")
    cmd = [
        "npx", "web-ext", "sign",
        "--api-key", issuer,
        "--api-secret", secret,
        "--channel", "listed",
        "--source-dir", tmp_dir,
        "--artifacts-dir", "./web-ext-artifacts"
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("\nSuccessfully signed Firefox addon!")
    finally:
        # Cleanup safely
        if os.path.exists(tmp_dir):
            for file in os.listdir(tmp_dir):
                os.remove(os.path.join(tmp_dir, file))
            os.rmdir(tmp_dir)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build and optionally sign the Anchor extension.")
    parser.add_argument("version", nargs="?", help="Version override for the built addon (optional).")
    parser.add_argument("--sign", action="store_true", help="Sign the Firefox addon using credentials in .env")
    
    args = parser.parse_args()
    
    # Build Chrome version
    create_addon("chrome", args.version)
    
    # Build Firefox version (for local use)
    create_addon("firefox", args.version)
    
    # Optionally sign the Firefox version
    if args.sign:
        sign_firefox(args.version)
