// 1장 보스 — 확정된 반석왕 우르 (몸 96×96 → 기운·잔해 포함 128×128)
// 돌 거인 왕. 금 왕관, 붉은 망토, 오른손에 금테 망치주먹. 몸의 왼쪽 절반이 흑수에 잠식(보라색 균열).
import { compose, outline, part, poly, ellipse, line, set, get, blank, rect, paste } from '../../lib.js';

const S = 96;
const ROCK = ['l', 'G', 'g', 'n'];
const ROCK_D = ['G', 'g', 'n', 'k'];
const BEARD = ['l', 'G', 'g', 'n'];
const FUR = ['G', 'g', 'n', 'k'];
const GOLD = ['Y', 'y', 'O', 'e'];
const CAPE = ['m', 'r', 'R', 'B'];
const P = (shape, ramp, opt) => outline(part(S, S, shape, ramp, opt));

function king({ b = 0, sway = 0, glow = 0, fist = 0 } = {}) {
  const hb = b + 3; // 머리를 어깨 사이로 낮춰 웅크린 위압감
  const cape = P((g, c) => poly(g, [[22, 27 + b], [74, 27 + b], [93 + sway, 93], [70, 90], [48, 93], [26, 90], [3 + sway, 93]], c), CAPE, { hi: 2, lo: 3, deep: 7 });
  const fur = P((g, c) => { for (let i = 0; i < 10; i++) ellipse(g, 20 + i * 6, 30 + b + (i % 2), 5, 5, c); }, FUR, { hi: 1, lo: 2, deep: 4 });
  const legL = P((g, c) => poly(g, [[30, 70], [46, 70], [46, 88], [48, 93], [26, 93], [29, 86]], c), ROCK_D, { hi: 2, lo: 3, deep: 6 });
  const legR = P((g, c) => poly(g, [[50, 70], [66, 70], [67, 86], [70, 93], [48, 93], [50, 88]], c), ROCK_D, { hi: 2, lo: 3, deep: 6 });
  const torso = P((g, c) => poly(g, [[30, 32 + b], [48, 28 + b], [66, 32 + b], [72, 46 + b], [68, 72 + b], [48, 76 + b], [28, 72 + b], [24, 46 + b]], c), ROCK, { hi: 3, lo: 4, deep: 9 });
  const belt = P((g, c) => poly(g, [[27, 64 + b], [69, 64 + b], [68, 71 + b], [28, 71 + b]], c), GOLD, { hi: 1, lo: 2, deep: 4 });
  const head = P((g, c) => poly(g, [[36, 15 + hb], [48, 11 + hb], [60, 15 + hb], [62, 27 + hb], [58, 34 + hb], [38, 34 + hb], [34, 27 + hb]], c), ROCK, { hi: 2, lo: 2, deep: 5 });
  const beard = P((g, c) => poly(g, [[36, 28 + hb], [60, 28 + hb], [62, 40 + hb], [58, 52 + hb], [54, 47 + hb], [50, 57 + hb], [48, 50 + hb], [46, 57 + hb], [42, 47 + hb], [38, 52 + hb], [34, 40 + hb]], c), BEARD, { hi: 1, lo: 2, deep: 5 });
  const crown = P((g, c) => poly(g, [[36, 18 + hb], [35, 6 + hb], [40, 11 + hb], [43, 2 + hb], [46, 9 + hb], [48, 0 + hb], [50, 9 + hb], [53, 2 + hb], [56, 11 + hb], [61, 6 + hb], [60, 18 + hb]], c), GOLD, { hi: 1, lo: 2, deep: 4 });
  const shL = P((g, c) => poly(g, [[14, 34 + b], [26, 27 + b], [36, 33 + b], [34, 45 + b], [20, 47 + b], [12, 41 + b]], c), ROCK, { hi: 2, lo: 3, deep: 6 });
  const shR = P((g, c) => poly(g, [[60, 33 + b], [70, 27 + b], [82, 34 + b], [84, 41 + b], [76, 47 + b], [62, 45 + b]], c), ROCK, { hi: 2, lo: 3, deep: 6 });
  const padR = P((g, c) => poly(g, [[62, 30 + b], [71, 25 + b], [82, 31 + b], [80, 35 + b], [70, 31 + b], [63, 35 + b]], c), GOLD, { hi: 1, lo: 1, deep: 3 });
  const spikes = P((g, c) => {
    poly(g, [[13, 36 + b], [9, 20 + b], [19, 30 + b]], c); poly(g, [[18, 31 + b], [20, 14 + b], [27, 28 + b]], c); poly(g, [[25, 29 + b], [30, 19 + b], [33, 31 + b]], c);
    poly(g, [[83, 36 + b], [87, 20 + b], [77, 30 + b]], c); poly(g, [[78, 31 + b], [76, 14 + b], [69, 28 + b]], c); poly(g, [[71, 29 + b], [66, 19 + b], [63, 31 + b]], c);
  }, ROCK_D, { hi: 1, lo: 1, deep: 3 });
  const armL = P((g, c) => poly(g, [[14, 44 + b], [26, 44 + b], [24, 62 + b], [12, 62 + b]], c), ROCK_D);
  const fistL = P((g, c) => poly(g, [[9, 60 + b], [26, 59 + b], [28, 70 + b], [22, 75 + b], [10, 74 + b], [7, 67 + b]], c), ROCK);
  const fy = fist;
  const armR = P((g, c) => poly(g, [[70, 44 + b], [82, 44 + b], [84, 58 + fy], [72, 58 + fy]], c), ROCK_D);
  const fistR = P((g, c) => poly(g, [[67, 56 + fy], [87, 55 + fy], [91, 64 + fy], [88, 76 + fy], [70, 77 + fy], [66, 67 + fy]], c), GOLD, { hi: 2, lo: 2, deep: 5 });

  const g = compose(S, S, [[cape, 0, 0], [spikes, 0, 0], [legL, 0, 0], [legR, 0, 0], [armL, 0, 0], [armR, 0, 0], [torso, 0, 0], [belt, 0, 0],
    [shL, 0, 0], [shR, 0, 0], [padR, 0, 0], [fistL, 0, 0], [fistR, 0, 0], [fur, 0, 0], [head, 0, 0], [beard, 0, 0], [crown, 0, 0]]);

  // 담비털 무늬
  [[24, 29], [36, 30], [60, 30], [72, 29]].forEach(([x, y]) => { set(g, x, y + b, 'l'); set(g, x + 1, y + b, 'G'); });
  // 왕관 보석, 망치주먹 금테·마디
  [[42, 13, 'r'], [48, 12, 'C'], [54, 13, 'r']].forEach(([x, y, c]) => { set(g, x, y + hb, c); set(g, x + 1, y + hb, c); set(g, x, y + 1 + hb, c === 'C' ? 'U' : 'R'); set(g, x + 1, y + 1 + hb, c === 'C' ? 'U' : 'R'); });
  [[42, 12], [48, 11], [54, 12]].forEach(([x, y]) => set(g, x, y + hb, 'W'));
  // 흑수 손바닥 자국 (가슴)
  const hand = blank(S, S);
  ellipse(hand, 37, 50 + b, 6, 5, 'K');
  [[31, 38], [34, 36], [37, 35], [40, 36]].forEach(([x, y]) => rect(hand, x, y + b, 2, 12, 'K'));
  rect(hand, 43, 46 + b, 3, 2, 'K'); rect(hand, 44, 43 + b, 2, 4, 'K');
  const rim = outline(hand, { color: glow ? 'x' : 'P' });
  paste(g, rim);
  [[33, 49], [36, 47], [39, 51], [35, 53]].forEach(([x, y]) => set(g, x, y + b, 'p'));
  line(g, 68, 63 + fy, 89, 62 + fy, 'e'); line(g, 69, 70 + fy, 89, 69 + fy, 'e');
  [[74, 58], [79, 58], [84, 58]].forEach(([x, y]) => line(g, x, y + fy, x, y + 4 + fy, 'O'));
  // 수염 결
  for (let x = 39; x <= 57; x += 3) line(g, x, 37 + hb, x + (x < 48 ? -1 : 1), 47 + hb, 'g');
  // 돌 결
  [[34, 40, 38, 48], [38, 48, 35, 56], [60, 42, 57, 50], [62, 52, 64, 60], [44, 58, 52, 58]].forEach(([a, c, d, e]) => line(g, a, c + b, d, e + b, 'g'));

  // ── 흑수 잠식 (몸 왼쪽): 균열을 어둡게, 맥이 빛남 ──
  const veins = [[30, 36, 36, 44], [36, 44, 32, 52], [32, 52, 38, 60], [26, 46, 20, 50], [20, 50, 18, 58], [16, 62, 22, 68], [36, 44, 42, 46], [42, 22, 40, 26]];
  const vc = glow ? 'x' : 'P';
  veins.forEach(([a, c, d, e]) => { line(g, a, c + b, d, e + b, 'p'); line(g, a + 1, c + b, d + 1, e + b, vc); });
  // 잠식된 쪽은 돌색을 어둡게 물들임
  for (let y = 26; y < 78; y++) for (let x = 10; x < 40; x++) {
    const c = get(g, x, y + b);
    if (c === 'l' && (x + y) % 5 === 0) set(g, x, y + b, 'G');
    if (c === 'g' && (x * 3 + y) % 7 === 0) set(g, x, y + b, 'p');
  }
  // 눈: 오른쪽 눈은 원래 금빛, 왼쪽 눈은 흑수의 붉은빛
  line(g, 37, 21 + hb, 46, 23 + hb, 'n'); line(g, 50, 23 + hb, 59, 21 + hb, 'n');       // 무거운 눈썹뼈
  line(g, 37, 22 + hb, 46, 24 + hb, 'k'); line(g, 50, 24 + hb, 59, 22 + hb, 'k');
  const eye = (cx, core, halo) => {
    [[-1, 0], [0, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => set(g, cx + dx, 25 + dy + hb, core));
    [[-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2], [-3, -1], [3, -1]].forEach(([dx, dy]) => set(g, cx + dx, 25 + dy + hb, halo));
    set(g, cx, 24 + hb, 'W');
  };
  eye(41, glow ? 'x' : 'P', 'p');
  eye(55, 'Y', 'O');
  // 흑수 불티
  if (glow) [[22, 30], [16, 40], [34, 28], [12, 52]].forEach(([x, y]) => set(g, x, y + b, 'x'));
  else [[20, 34], [14, 46], [30, 26]].forEach(([x, y]) => set(g, x, y + b, 'P'));
  return g;
}

// ── 128×128 틀: 흑수 불꽃, 떠다니는 잔해, 갈라진 땅 ──
const F = 128, OX = 16, OY = 30;
const ROCKS = [[6, 52, 4], [112, 44, 5], [10, 90, 3], [116, 86, 4], [20, 24, 3], [104, 18, 3]];
function framed(opts, t) {
  const body = king(opts);
  const aura = blank(F, F);
  const topY = x => { for (let y = 0; y < S; y++) if (get(body, x, y)) return y; return -1; };
  // 불꽃 혀 하나: 바닥 (bx, by), 폭 w, 높이 h, 끝이 sway 만큼 휨 → 바깥 p / 안쪽 P / 심지 x
  const tongue = (bx, by, w, h, sway) => {
    const layer = (scale, c) => poly(aura, [[bx - w * scale, by], [bx - w * scale * 0.6, by - h * scale * 0.5], [bx + sway * scale, by - h * scale],
      [bx + w * scale * 0.6, by - h * scale * 0.45], [bx + w * scale, by]], c);
    layer(1, 'p'); layer(0.72, 'P'); layer(0.42, 'x');
  };
  for (let x = 6; x < S - 4; x += 7) {
    const y0 = topY(x);
    if (y0 < 0 || y0 > 70) continue;
    const k = Math.sin(t * 1.4 + x * 0.9);
    const h = 10 + k * 4 + (x < 48 ? 6 : 0) + ((x / 7 + t) % 3 === 0 ? 5 : 0);
    tongue(OX + x, OY + y0 + 1, 4 + (x < 48 ? 1 : 0), h, Math.sin(t * 0.9 + x) * 3);
  }
  // 잠식된 왼쪽 옆구리에서 피어오르는 불꽃
  [[10, 48], [6, 62], [12, 76]].forEach(([x, y], i) => tongue(OX + x, OY + y, 4, 9 + Math.sin(t * 1.6 + i) * 3, -4));
  const g = compose(F, F, [[aura, 0, 0], [body, OX, OY]]);
  // 갈라진 땅
  const gy = OY + 94;
  [[20, 0, 18, -3], [38, -3, 30, -1], [76, 0, 92, -2], [92, -2, 104, 1], [56, 1, 60, 3]].forEach(([a, b1, c, d]) => { line(g, a + 4, gy + b1, c + 4, gy + d, 'K'); line(g, a + 4, gy + b1 + 1, c + 4, gy + d + 1, t % 2 ? 'x' : 'P'); });
  // 떠다니는 잔해
  ROCKS.forEach(([x, y, r], i) => {
    const yy = y + Math.round(Math.sin(t * 0.9 + i * 1.7) * 2);
    const chunk = outline(part(F, F, (gg, c) => poly(gg, [[x - r, yy], [x - r / 3, yy - r], [x + r, yy - r / 2], [x + r / 2, yy + r]], c), ROCK_D, { hi: 1, lo: 1, deep: 2 }));
    paste(g, chunk);
    if (i % 2 === 0) set(g, x, yy - r - 1, 'P');
  });
  return g;
}

export default {
  id: 'urs-king', name: '확정된 반석왕 우르 (1장 보스)', w: 128, h: 128, origin: [64, 123], group: '보스',
  anims: {
    idle: { ms: 200, frames: [framed({}, 0), framed({ b: 1, sway: 1, glow: 1 }, 1), framed({ b: 2, sway: 1, glow: 1 }, 2), framed({ b: 1, glow: 0 }, 3), framed({ b: 0, glow: 1 }, 4), framed({ b: 0 }, 5)] },
    smash: { ms: 120, frames: [framed({ fist: -14, b: -1 }, 0), framed({ fist: -22, b: -2, glow: 1 }, 1), framed({ fist: 6, b: 2, glow: 1 }, 2), framed({ fist: 4, b: 1 }, 3)] },
  },
};
