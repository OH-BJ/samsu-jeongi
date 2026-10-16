# 배경을 지운 뒤 남은 작은 점(본체와 떨어진 몇 픽셀짜리 덩어리)을 지운다
# 사용법: python tools/despeckle.py <파일들...> [--min=8]
import sys
from collections import deque
from PIL import Image

MIN = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--min=')), 8)
for path in [a for a in sys.argv[1:] if not a.startswith('--')]:
    im = Image.open(path).convert('RGBA'); w, h = im.size; px = im.load()
    seen = set(); removed = 0
    for sy in range(h):
        for sx in range(w):
            if (sx, sy) in seen or px[sx, sy][3] == 0: continue
            comp, q = [], deque([(sx, sy)]); seen.add((sx, sy))
            while q:
                x, y = q.popleft(); comp.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        n = (x + dx, y + dy)
                        if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and px[n][3] > 0:
                            seen.add(n); q.append(n)
            if len(comp) < MIN:
                for p in comp: px[p] = (0, 0, 0, 0)
                removed += len(comp)
    im.save(path)
    print(path.split('/')[-1], 'removed', removed)
