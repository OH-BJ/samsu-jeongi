// UI 창 테두리 · 등급별 아이템 칸
// 창: 남색 그라데이션 + 흰 이중 테두리 + 금 모서리 장식 (SFC 풍)
import { blank, set, get, rect, compose } from '../../lib.js';

export function windowGrid(w, h, { accent = 'y' } = {}) {
  const g = blank(w, h);
  // 안쪽 그라데이션 (위 u → 아래 k, 경계는 디더링)
  const bands = ['u', 'n', 'k'];
  for (let y = 3; y < h - 3; y++) {
    const t = (y - 3) / (h - 7), bi = Math.min(2, Math.floor(t * 3)), frac = t * 3 - bi;
    for (let x = 3; x < w - 3; x++) {
      let c = bands[bi];
      if (bi < 2 && frac > 0.75 && (x + y) % 2 === 0) c = bands[bi + 1];
      set(g, x, y, c);
    }
  }
  // 테두리: K(바깥) → W → l → K(안쪽)
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const d = Math.min(x, y, w - 1 - x, h - 1 - y);
    if (d === 0) set(g, x, y, 'K'); else if (d === 1) set(g, x, y, 'W'); else if (d === 2 && !get(g, x, y)) set(g, x, y, 'l');
  }
  for (let x = 3; x < w - 3; x++) { set(g, x, 3, 'G'); set(g, x, h - 4, 'K'); }
  // 둥근 모서리
  [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].forEach(([x, y]) => set(g, x, y, null));
  // 금 모서리 장식
  const orn = ['KKKK', 'K' + accent + 'YK', 'K' + accent + 'K.', 'KK..'];
  const put = (ox, oy, fx, fy) => orn.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') set(g, fx ? ox - i : ox + i, fy ? oy - j : oy + j, c === 'Y' ? 'Y' : c); }));
  put(1, 1, false, false); put(w - 2, 1, true, false); put(1, h - 2, false, true); put(w - 2, h - 2, true, true);
  return g;
}

const RARITY_KEY = { N: ['l', 'G', 'g'], U: ['h', 'H', 'j'], R: ['C', 'U', 'u'], E: ['7', '8', 'p'], L: ['1', '2', '3'], M: ['4', '5', '6'] };
export function slotGrid(r, size = 30) {
  const [hi, base, sh] = RARITY_KEY[r];
  const g = blank(size, size);
  rect(g, 0, 0, size, size, 'K');
  rect(g, 1, 1, size - 2, size - 2, base);
  rect(g, 2, 2, size - 4, size - 4, 'k');
  for (let x = 1; x < size - 1; x++) set(g, x, 1, hi);
  for (let y = 1; y < size - 1; y++) set(g, 1, y, hi);
  for (let x = 2; x < size - 1; x++) set(g, x, size - 2, sh);
  // 안쪽 아래로 등급색이 은은하게 차오름
  for (let y = size - 10; y < size - 2; y++) for (let x = 2; x < size - 2; x++) if ((x + y) % (y > size - 6 ? 2 : 4) === 0) set(g, x, y, sh);
  [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]].forEach(([x, y]) => set(g, x, y, null));
  return g;
}

export default {
  id: 'ui-window', name: 'UI 창 테두리 · 등급별 아이템 칸', w: 120, h: 44, group: 'UI',
  anims: {
    window: { ms: 1000, frames: [windowGrid(120, 44), windowGrid(120, 44, { accent: 'O' })] },
    slots: { ms: 1000, frames: [compose(120, 44, ['N', 'U', 'R', 'E', 'L', 'M'].map((r, i) => [slotGrid(r, 18), 1 + i * 20, 13]))] },
  },
};
