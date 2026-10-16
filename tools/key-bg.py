# 단색 배경을 투명하게 지운다 (가장자리에서 이어진, 모서리 색과 비슷한 픽셀만)
# 사용법: python tools/key-bg.py <입력.png> <출력.png> [허용오차=24]
import sys
from collections import deque
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
tol = int(sys.argv[3]) if len(sys.argv) > 3 else 24
im = Image.open(src).convert('RGBA')
w, h = im.size
px = im.load()
bg = px[0, 0]
near = lambda c: all(abs(c[i] - bg[i]) <= tol for i in range(3))
seen = set()
q = deque((x, y) for x in range(w) for y in (0, h - 1)) + deque((x, y) for y in range(h) for x in (0, w - 1))
while q:
    x, y = q.popleft()
    if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or not near(px[x, y]):
        continue
    seen.add((x, y))
    px[x, y] = (0, 0, 0, 0)
    q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
im.save(dst)
print('cleared', len(seen), 'px')
