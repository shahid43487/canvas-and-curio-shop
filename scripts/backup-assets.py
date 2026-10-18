"""Download pointer assets for an independent backup; never requires credentials."""
import hashlib
import json
from pathlib import Path
import sys
import urllib.request
from urllib.parse import urljoin

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/smolstuuf-assets")
origin = sys.argv[2] if len(sys.argv) > 2 else "https://smolstuuf.lovable.app"
destination.mkdir(parents=True, exist_ok=True)
manifest = []
for pointer in sorted((root / "src/assets").glob("*.asset.json")):
    asset = json.loads(pointer.read_text())
    url = urljoin(origin, asset["url"])
    with urllib.request.urlopen(url) as response:
        content = response.read()
        if not response.headers.get("Content-Type", "").startswith("image/"):
            raise ValueError("Backup response is not an image")
    if len(content) != asset["size"]:
        raise ValueError("Backup size does not match pointer")
    (destination / asset["original_filename"]).write_bytes(content)
    manifest.append({"filename": asset["original_filename"], "sha256": hashlib.sha256(content).hexdigest(), "size": len(content), "public_path": asset["url"]})
for source in sorted((root / "src/assets").iterdir()):
    if source.suffix in (".png", ".jpg", ".webp", ".avif"):
        content = source.read_bytes()
        (destination / source.name).write_bytes(content)
        manifest.append({"filename": source.name, "sha256": hashlib.sha256(content).hexdigest(), "size": len(content)})
(destination / "manifest.json").write_text(json.dumps(manifest, indent=2))
print(f"Backed up {len(manifest)} images")