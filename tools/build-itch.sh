#!/bin/sh
# Builds the itch.io HTML5 upload: a zip with index.html at its root plus assets/.
# Usage: sh tools/build-itch.sh [out.zip]
set -e
cd "$(dirname "$0")/.."
OUT="${1:-dist/shrine-forest-itch.zip}"
mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
zip -qr -9 "$OUT" index.html assets
echo "$OUT: $(du -h "$OUT" | cut -f1), $(unzip -l "$OUT" | tail -1 | awk '{print $2}') files"
