// 이로 대화 초상화 64×64 — 표정: 기본 / 웃음 / 결의
// 얼굴 윤곽은 줄마다 폭을 정해 생성하고, 머리카락·눈·옷은 덧칠한다. 왼쪽 절반 → 좌우대칭.
import { blank, set, get, mirror, parse, draw, compose, outline, edgeDarken } from '../../lib.js';

function leftHalf() {
  const g = blank(32, 64);
  const put = (x, y, c) => set(g, x, y, c);
  const row = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) put(x, y, c); };

  // ── 얼굴 (줄마다 왼쪽 경계) ──
  const faceL = { 20: 13, 21: 13, 22: 13, 23: 13, 24: 13, 25: 13, 26: 13, 27: 13, 28: 13, 29: 13, 30: 13, 31: 13, 32: 13, 33: 13,
    34: 13, 35: 14, 36: 14, 37: 15, 38: 16, 39: 17, 40: 18, 41: 19, 42: 21, 43: 23, 44: 25, 45: 27 };
  for (const [ys, x0] of Object.entries(faceL)) {
    const y = +ys;
    row(y, x0, 31, 'q');
    if (y >= 36) { put(x0, y, 'Q'); put(x0 + 1, y, 'Q'); }       // 턱 그늘
    if (y >= 43) row(y, x0, Math.min(31, x0 + 3), 'Q');
  }
  // 목
  for (let y = 46; y <= 49; y++) row(y, 26, 31, y < 48 ? 'Q' : 'q');
  // 귀
  [[27, 11, 'Qs'], [28, 10, 'QssQ'], [29, 10, 'QsQ'], [30, 10, 'QsQ'], [31, 11, 'QQ']].forEach(([y, x, s]) => [...s].forEach((c, i) => put(x + i, y, c)));

  // ── 머리카락 ──
  const hairL = { 6: 14, 7: 11, 8: 10, 9: 9, 10: 9, 11: 8, 12: 8, 13: 8, 14: 8, 15: 8, 16: 8, 17: 8, 18: 8, 19: 8, 20: 8,
    21: 8, 22: 8, 23: 8, 24: 9, 25: 9, 26: 9, 27: 9, 28: 9, 29: 9, 30: 9, 31: 9, 32: 10, 33: 10, 34: 11, 35: 12 };
  for (const [ys, x0] of Object.entries(hairL)) {
    const y = +ys;
    // 얼굴 앞은 덮지 않는다 (옆머리는 얼굴 경계 바로 앞까지)
    const x1 = y < 20 ? 31 : (y < 36 ? Math.min(12, (faceL[y] || 13) - 1) : 12);
    for (let x = x0; x <= x1; x++) if (!(y >= 27 && y <= 31 && x >= 10 && x <= 13 && get(g, x, y))) put(x, y, 'b');
    put(x0, y, 'B'); if (y > 9) put(x0 + 1, y, 'B');
  }
  // 위로 솟은 삐침
  row(5, 12, 31, 'b'); row(4, 16, 31, 'b');
  // 삐침: [꼭대기 y, 중심 x, 높이, 기울기]
  const spikes = [[1, 11, 7, 1], [0, 17, 8, 1], [0, 23, 9, 0], [1, 29, 7, 0]];
  for (const [top, cx, h, lean] of spikes) for (let k = 0; k < h; k++) {
    const y = top + k, half = Math.floor(k / 1.7), sx = cx + Math.round((h - k) * lean * 0.4);
    for (let x = sx - half; x <= sx + half; x++) put(x, y, k < 2 ? 'o' : (x === sx - half ? 'B' : 'b'));
  }
  // 옆으로 뻗은 삐침
  [[9, 6, 'Bb'], [10, 5, 'Bbb'], [16, 6, 'Bb'], [17, 5, 'Bbb'], [24, 7, 'Bb'], [25, 6, 'Bbb']].forEach(([y, x, s]) => [...s].forEach((c, i) => put(x + i, y, c)));
  // 하이라이트
  [[6, 17], [6, 18], [7, 23], [7, 24], [8, 28], [9, 15], [9, 16], [10, 21], [11, 27], [11, 28], [7, 13]].forEach(([y, x]) => put(x, y, 'o'));
  // 앞머리: 이마 위로 내려오는 갈래
  for (let y = 16; y <= 22; y++) row(y, 13, 31, 'b');
  const bangs = [[14, 7], [18, 5], [23, 7], [28, 4], [31, 6]];
  for (let y = 18; y <= 23; y++) for (let x = 13; x <= 31; x++) {
    let hair = false;
    for (const [cx, len] of bangs) { const d = Math.abs(x - cx); if (y - 17 <= len - d * 1.6) hair = true; }
    put(x, y, hair ? 'b' : 'q');
  }
  [[19, 17], [20, 17], [19, 26], [20, 27], [18, 21]].forEach(([y, x]) => put(x, y, 'B'));

  // ── 머리띠 ──
  row(12, 9, 31, 'm'); row(13, 9, 31, 'r'); row(14, 9, 31, 'r'); row(15, 9, 31, 'R');
  put(8, 12, 'R'); put(8, 13, 'R'); put(8, 14, 'R'); put(8, 15, 'R');

  // ── 눈썹·눈 ──
  row(23, 19, 25, 'B');
  const EYE = ['..KKKKK.', '.KKKKKKK', 'KKWWUUUK', 'KWWUUuUK', 'KlUuKKuK', 'KlUuKKuK', 'KlUuuuuK', 'KlUUCCUK', '.KUUCUK.', '..KKKK..'];
  EYE.forEach((s, j) => [...s].forEach((c, i) => { if (c !== '.') put(19 + i, 25 + j, c); }));
  row(36, 20, 23, 'm');                                   // 볼 홍조
  put(29, 42, 'K'); put(30, 42, 'K'); put(31, 42, 'K');   // 입

  // ── 도복 ──
  const coat = [[50, 20, 'GllllWQQQQqq'], [51, 14, 'GGlllllllWlQQQqq'], [52, 10, 'GGGllllllllllllWlQQq'], [53, 7, 'gGGGlllllllllllllllWlQq'],
    [54, 5, 'ggGGllllllllllllllllllWlQ'], [55, 4, 'gggGGlllllllllllllllllllWlQ'], [56, 3, 'ggggGGllllllllllllllllllllWl'],
    [57, 2, 'gggggGGGlllllllllllllllllllWln'], [58, 1, 'ggggggGGGllllllllllllllllllWln'], [59, 1, 'ggggggGGGGlllllllllllllllllWln'],
    [60, 0, 'gggggggGGGGllllllllllllllllWlnn'], [61, 0, 'gggggggGGGGllllllllllllllllWlnn'], [62, 0, 'ggggggggGGGGlllllllllllllllWlnn'],
    [63, 0, 'ggggggggGGGGlllllllllllllllWlnn']];
  coat.forEach(([y, x, s]) => [...s].forEach((c, i) => put(x + i, y, c)));
  return g;
}

function toRows(g) {
  const rows = [];
  for (let y = 0; y < g.h; y++) { let r = ''; for (let x = 0; x < g.w; x++) r += get(g, x, y) || '.'; rows.push(r); }
  return rows;
}
const BASE = parse(mirror(toRows(leftHalf())));

// 매듭·꼬리·코 (비대칭)
const EXTRA = [
  [11, 55, 'RR'], [12, 55, 'rrR'], [13, 55, 'mrrR'], [14, 55, 'rrrR'], [15, 56, 'RR'],
  [16, 57, 'rR'], [17, 57, 'rrR'], [18, 58, 'rR'], [19, 58, 'rR'], [20, 59, 'R'],
  [16, 55, 'rR'], [17, 55, 'rR'], [18, 56, 'rR'], [19, 56, 'R'],
  [37, 31, 'S'], [38, 32, 'Q'], [39, 31, 'QQ'],
];
// 표정 (왼쪽 눈 19~26 / 오른쪽 눈 37~44 / 입 28~35)
const clearEyes = () => [25, 26, 27, 28, 29, 30, 31, 32, 33, 34].flatMap(y => [[y, 19, 'qqqqqqqq'], [y, 37, 'qqqqqqqq']]);
const EXPR = {
  neutral: [],
  smile: [
    ...clearEyes(),
    [28, 21, 'KKKK'], [29, 20, 'K'], [29, 25, 'K'], [30, 19, 'K'], [30, 26, 'K'],
    [28, 39, 'KKKK'], [29, 38, 'K'], [29, 43, 'K'], [30, 37, 'K'], [30, 44, 'K'],
    [32, 20, 'mmmm'], [32, 40, 'mmmm'],
    [42, 29, 'qqqqqq'],
    [41, 28, 'KKKKKKKK'], [42, 28, 'KRrrrrRK'], [43, 29, 'KRmmRK'], [44, 30, 'KKKK'],
  ],
  determined: [
    [21, 18, 'BBB'], [22, 20, 'BBBB'], [23, 19, 'qqqqBBBB'],
    [21, 43, 'BBB'], [22, 40, 'BBBB'], [23, 37, 'BBBBqqqq'],
    [26, 20, 'KKKKKK'], [26, 38, 'KKKKKK'],
    [42, 29, 'qqqqqq'],
    [41, 28, 'KKKKKKKK'], [42, 28, 'KWWWWWWK'], [43, 28, 'KKKKKKKK'],
  ],
};

function face(expr) {
  let g = compose(64, 64, [[BASE, 0, 0], [draw(64, 64, EXTRA), 0, 0], [draw(64, 64, EXPR[expr]), 0, 0]]);
  g = edgeDarken(g, { dir: [1, 0], depth: 3, minX: 38 });
  return outline(g);
}

export default {
  id: 'iro-portrait', name: '이로 초상화 (기본 · 웃음 · 결의)', w: 64, h: 64, group: '초상화',
  anims: { expressions: { ms: 900, frames: [face('neutral'), face('smile'), face('determined')] } },
};
