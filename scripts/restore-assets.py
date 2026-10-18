"""Restore the portable image archive into an independent project checkout."""
import hashlib
import json
from pathlib import Path
import shutil
import sys

backup = Path(__file__).resolve().parent
root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
manifest = json.loads((backup / "manifest.json").read_text())
for entry in manifest:
    source = backup / entry["filename"]
    content = source.read_bytes()
    if hashlib.sha256(content).hexdigest() != entry["sha256"] or len(content) != entry["size"]:
        raise ValueError(f"Invalid backup: {source.name}")
    relative = Path(entry.get("public_path", "src/assets/" + source.name).lstrip("/"))
    destination = root / (Path("public") / relative if "public_path" in entry else relative)
    if not destination.resolve().is_relative_to(root):
        raise ValueError("Unsafe restore path")
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
print(f"Restored {len(manifest)} images to {root}")