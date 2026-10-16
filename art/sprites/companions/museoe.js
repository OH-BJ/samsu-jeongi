// 동료 무쇠 — 바위 · 반석국 수호기사 (64×80, 오른쪽을 바라봄)
// 넘긴 은발 미남, 날카로운 호박색 눈. 건메탈 판금(금테) + 붉은 망토. 무기: 반석 문장의 대형 방패 + 한손 메이스
import { blank, compose, outline, part, poly, ellipse, line, set, rect, shiftBand } from '../../lib.js';
import { head } from '../../chara.js';

const W = 64, H = 80;
const HAIR = ['W', 'W', 'l', 'G'];
const SKIN = ['S', 'q', 'Q', 'o'];
const PLATE = ['G', 'g', 'n', 'k'];
const PLATE_D = ['g', 'n', 'k', 'K'];
const GOLD = ['Y', 'y', 'O', 'e'];
const CAPE = ['r', 'R', 'B', 'K'];

function knight({ by = 0, sway = 0, glint = 0, bash = 0 } = {}) {
  const cape = part(W, H, (g, c) => poly(g, [[21, 26], [31, 26], [28, 56], [24, 76], [10 + sway, 75], [13 + sway, 50]], c), CAPE, { hi: 1, lo: 2, deep: 5 });
  const legB = part(W, H, (g, c) => poly(g, [[24, 50], [31, 50], [30, 70], [23, 70]], c), PLATE_D, { hi: 1, lo: 1, deep: 3 });
  const legF = part(W, H, (g, c) => poly(g, [[32, 50], [39, 50], [41, 70], [33, 70]], c), PLATE, { hi: 1, lo: 1, deep: 3 });
  const boots = part(W, H, (g, c) => { poly(g, [[22, 69], [31, 69], [31, 77], [19, 77]], c); poly(g, [[33, 69], [42, 69], [45, 77], [33, 77]], c); }, PLATE_D, { hi: 1, lo: 1, deep: 2 });
  const tasset = part(W, H, (g, c) => poly(g, [[23, 44], [41, 44], [43, 53], [32, 54], [22, 53]], c), PLATE, { hi: 1, lo: 2, deep: 4 });
  const torso = part(W, H, (g, c) => poly(g, [[23, 25], [40, 25], [42, 33], [41, 45], [23, 45], [22, 33]], c), PLATE, { hi: 2, lo: 2, deep: 6 });
  const padB = part(W, H, (g, c) => ellipse(g, 21.5, 27.5, 6, 4.5, c), PLATE, { hi: 1, lo: 2, deep: 3 });
  const armB = part(W, H, (g, c) => poly(g, [[17, 29], [23, 29], [23, 42], [18, 43]], c), PLATE_D);
  let body = compose(W, H, [[cape, 0, 0], [legB, 0, 0], [legF, 0, 0], [boots, 0, 0], [armB, 0, 0], [tasset, 0, 0], [torso, 0, 0], [padB, 0, 0]]);
  // 금테·장식: 가슴 문장, 허리띠, 무릎·장화 금테
  line(body, 24, 26, 39, 26, 'y'); line(body, 31, 27, 31, 43, 'g'); line(body, 23, 44, 41, 44, 'y'); line(body, 23, 45, 41, 45, 'O');
  ellipse(body, 31.5, 33, 2.5, 2.5, 'y'); set(body, 31, 32, 'Y'); set(body, 32, 34, 'O');
  [[24, 60, 30], [33, 60, 40], [20, 76, 31], [33, 76, 45]].forEach(([x0, y, x1]) => line(body, x0, y, x1, y, 'y'));
  line(body, 16, 30, 26, 30, 'y');
  // 손(뒤): 메이스 자루를 쥠
  if (by) body = shiftBand(body, 0, 46, by);

  // 머리
  const hd = head(W, H, { cx: 31, top: 2, hair: HAIR, skin: SKIN, iris: ['b', 'O', 'Y'], eye: 'sharp', brow: true, browColor: 'g', mouth: 'neutral', blush: false,
    capRx: 10, capRy: 9, bangs: [1, 2, 2, 3, 2, 1, 1, 2, 6, 7, 5, 2, 1, 1, 1], lockL: 0, lockR: 4 });
  // 뒤로 넘긴 머리 끝 (뒤통수에서 뻗음)
  const swept = part(W, H, (g, c) => { poly(g, [[22, 6], [14, 9], [21, 11]], c); poly(g, [[21, 10], [12, 14], [20, 15]], c); poly(g, [[22, 14], [15, 19], [22, 19]], c); }, HAIR, { hi: 1, lo: 1, deep: 2 });

  // 메이스 (뒤손) — 금 머리
  const mace = blank(W, H);
  for (let y = 28; y <= 52; y++) { set(mace, 17, y, 'b'); set(mace, 18, y, 'B'); }
  const maceHead = part(W, H, (g, c) => poly(g, [[14, 21], [17, 18], [20, 21], [21, 26], [17, 29], [13, 26]], c), GOLD, { hi: 1, lo: 1, deep: 3 });
  [[13, 22], [21, 22], [17, 17], [12, 26], [22, 26]].forEach(([x, y]) => set(maceHead, x, y, 'Y'));
  const handB = blank(W, H); [[41, 16, 'qqQ'], [42, 16, 'QqQ']].forEach(([y, x, s]) => [...s].forEach((c, i) => set(handB, x + i, y, c)));

  // 방패 (앞) — 쇠테 + 갈색 판 + 반석 문장 + 금 징
  const sx = 36 + bash;
  const rim = part(W, H, (g, c) => poly(g, [[sx, 26], [sx + 17, 26], [sx + 19, 31], [sx + 19, 51], [sx + 9.5, 62], [sx, 51], [sx - 1, 31]], c), PLATE, { hi: 1, lo: 1, deep: 3 });
  const field = part(W, H, (g, c) => poly(g, [[sx + 2, 28], [sx + 15, 28], [sx + 17, 32], [sx + 17, 50], [sx + 9.5, 59], [sx + 2, 50], [sx + 1, 32]], c), ['d', 'e', 'b', 'B'], { hi: 1, lo: 2, deep: 4 });
  let sh = compose(W, H, [[rim, 0, 0], [field, 0, 0]]);
  const ex = sx + 9.5;
  ellipse(sh, ex, 42, 5, 5, 'y'); ellipse(sh, ex, 42, 3.5, 3.5, 'O'); ellipse(sh, ex, 42, 2, 2, 'e');
  poly(sh, [[ex - 2, 38], [ex + 2, 38], [ex + 3, 43], [ex, 46], [ex - 3, 43]], 'g'); set(sh, Math.round(ex - 1), 39, 'l');      // 문장 안의 바위
  line(sh, Math.round(ex), 30, Math.round(ex), 36, 'y'); line(sh, Math.round(ex), 48, Math.round(ex), 56, 'y');
  [[sx + 3, 29], [sx + 14, 29], [sx + 3, 49], [sx + 16, 49]].forEach(([x, y]) => { set(sh, x, y, 'Y'); });
  const gy = 30 + ((glint * 7) % 26);
  set(sh, sx + 2 + (glint % 2), gy, 'W'); set(sh, sx + 3 + (glint % 2), gy + 1, 'W'); set(sh, sx + 3, gy + 2, 'l');
  sh = outline(sh);

  let g = compose(W, H, [[body, 0, 0], [mace, 0, by], [maceHead, 0, by], [swept, 0, by], [hd, 0, by]]);
  g = outline(g);
  // 흉터 (왼뺨) — 멋
  set(g, 26, 16 + by, 'Q'); set(g, 27, 17 + by, 'Q');
  return compose(W, H, [[g, 0, 0], [sh, 0, by]]);
}

export default {
  id: 'museoe', name: '무쇠 · 반석국 수호기사 (동료, 바위)', w: W, h: H, origin: [32, 77], group: '동료',
  anims: {
    idle: { ms: 200, frames: [knight({ glint: 0 }), knight({ by: 1, sway: 1, glint: 1 }), knight({ by: 1, sway: 2, glint: 2 }), knight({ sway: 1, glint: 3 })] },
    bash: { ms: 90, frames: [knight({ bash: -2 }), knight({ bash: 3, glint: 1 }), knight({ bash: 5, glint: 2 }), knight({ bash: 2 })] },
  },
};
