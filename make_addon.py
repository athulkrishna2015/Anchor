import os
import zipfile
import json
import datetime

def create_addon(browser):
    extension = "xpi" if browser == "firefox" else "zip"
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"anchor_{browser}_{timestamp}.{extension}"
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
    
    with open("manifest.json", "r") as f:
        manifest = json.load(f)
        
    if browser == "firefox":
        if "background" in manifest and "service_worker" in manifest["background"]:
            manifest["background"]["scripts"] = [manifest["background"]["service_worker"]]
            del manifest["background"]["service_worker"]
        
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
    
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        for file in files_to_include:
            if os.path.exists(file):
                zipf.write(file)
        
        manifest_str = json.dumps(manifest, indent=2)
        zipf.writestr("manifest.json", manifest_str)
        
    print(f"Created {zip_filename}")

if __name__ == "__main__":
    create_addon("chrome")
    create_addon("firefox")
