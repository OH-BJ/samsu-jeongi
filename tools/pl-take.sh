#!/usr/bin/env bash
# 내려받기 폴더에서 가장 최근 픽셀랩 그림을 프로젝트로 옮긴다. 배경이 투명하지 않으면 지운다.
# 사용법: bash tools/pl-take.sh <저장할 경로(assets/pixellab/... .png)>
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$(ls -t "$HOME/Downloads"/pixellab-*.png 2>/dev/null | head -1)"
[ -z "$SRC" ] && { echo "내려받은 픽셀랩 그림이 없어요"; exit 1; }
DEST="$ROOT/$1"
mkdir -p "$(dirname "$DEST")"
mv "$SRC" "$DEST"
python -c "
from PIL import Image; import sys, subprocess
im = Image.open(sys.argv[1]).convert('RGBA')
if im.getpixel((0, 0))[3] == 255: subprocess.run([sys.executable, sys.argv[2], sys.argv[1], sys.argv[1]], check=True)
print('ok', im.size)" "$DEST" "$ROOT/tools/key-bg.py"
