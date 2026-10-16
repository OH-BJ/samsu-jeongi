// 반석국 일반 적 — 돌골렘 (48×48). 바위 자세가 많은 적.
// 부품마다 각진 다각형 → 자동 음영 → 부품별 외곽선 → 합성
import { compose, outline, part, poly, line, set } from '../../lib.js';

const ROCK = ['l', 'G', 'g', 'n'];
const ROCK_D = ['G', 'g', 'n', 'k'];
const P = (shape, ramp, opt) => outline(part(48, 48, shape, ramp, opt));

function golem({ bob = 0, glow = 'C', fistY = 0, fistX = 0 } = {}) {
  const b = bob;
  const legL = P((g, c) => poly(g, [[13, 35], [21, 35], [22, 42], [20, 45], [11, 45], [12, 40]], c), ROCK_D);
  const legR = P((g, c) => poly(g, [[27, 35], [35, 35], [36, 40], [37, 45], [28, 45], [26, 42]], c), ROCK_D);
  const body = P((g, c) => poly(g, [[14, 16 + b], [24, 13 + b], [34, 16 + b], [38, 24 + b], [35, 35 + b], [24, 38 + b], [13, 35 + b], [10, 24 + b]], c), ROCK, { hi: 2, lo: 3, deep: 6 });
  const head = P((g, c) => poly(g, [[18, 8 + b], [24, 5 + b], [30, 8 + b], [31, 15 + b], [24, 18 + b], [17, 15 + b]], c), ROCK, { hi: 1, lo: 2, deep: 4 });
  const shL = P((g, c) => poly(g, [[4, 19 + b], [11, 16 + b], [15, 21 + b], [13, 28 + b], [6, 28 + b], [3, 24 + b]], c), ROCK, { hi: 1, lo: 2, deep: 4 });
  const shR = P((g, c) => poly(g, [[37, 16 + b], [44, 19 + b], [45, 24 + b], [42, 28 + b], [35, 28 + b], [33, 21 + b]], c), ROCK, { hi: 1, lo: 2, deep: 4 });
  const fy = fistY, fx = fistX;
  const fistL = P((g, c) => poly(g, [[1 - fx, 30 + fy], [9 - fx, 28 + fy], [13 - fx, 33 + fy], [12 - fx, 40 + fy], [4 - fx, 41 + fy], [0 - fx, 36 + fy]], c), ROCK, { hi: 1, lo: 2, deep: 4 });
  const fistR = P((g, c) => poly(g, [[39 + fx, 28 + fy], [47 + fx, 30 + fy], [48 + fx, 36 + fy], [44 + fx, 41 + fy], [36 + fx, 40 + fy], [35 + fx, 33 + fy]], c), ROCK, { hi: 1, lo: 2, deep: 4 });

  const g = compose(48, 48, [[legL, 0, 0], [legR, 0, 0], [body, 0, 0], [shL, 0, 0], [shR, 0, 0], [fistL, 0, 0], [fistR, 0, 0], [head, 0, 0]]);
  // 균열·주먹 마디
  [[19, 20, 22, 25], [22, 25, 20, 30], [30, 23, 28, 29], [28, 29, 30, 33]].forEach(([a, c1, d, e]) => line(g, a, c1 + b, d, e + b, 'n'));
  [[4, 35, 10, 34], [38, 34, 44, 35]].forEach(([a, c1, d, e]) => line(g, a - (a < 20 ? fx : -fx), c1 + fy, d - (a < 20 ? fx : -fx), e + fy, 'g'));
  // 이끼 (어깨·머리 위)
  [[7, 17, 'hH'], [6, 18, 'HhhH'], [38, 17, 'Hh'], [38, 18, 'HhhH'], [21, 6, 'hhH'], [20, 7, 'HhhhH'], [15, 16, 'Hh']]
    .forEach(([x, y, s]) => [...s].forEach((c, i) => set(g, x + i, y + b, c)));
  // 눈과 가슴의 룬
  const dim = glow === 'C' ? 'U' : 'u';
  [[20, 11], [21, 11], [27, 11], [28, 11]].forEach(([x, y]) => set(g, x, y + b, glow));
  [[21, 12], [27, 12]].forEach(([x, y]) => set(g, x, y + b, dim));
  [[24, 22], [23, 23], [25, 23], [22, 24], [24, 24], [26, 24], [23, 25], [25, 25], [24, 26], [24, 27]].forEach(([x, y]) => set(g, x, y + b, glow));
  [[24, 28], [23, 27], [25, 27]].forEach(([x, y]) => set(g, x, y + b, dim));
  return g;
}

export default {
  id: 'stone-golem', name: '돌골렘 (반석국 일반 적)', w: 48, h: 48, origin: [24, 45], group: '적',
  anims: {
    idle: { ms: 220, frames: [golem({ glow: 'C' }), golem({ bob: 1, glow: 'U' }), golem({ bob: 1, glow: 'C' }), golem({ glow: 'U' })] },
    attack: { ms: 110, frames: [
      golem({ fistY: -8, bob: -1, fistX: -1 }), golem({ fistY: -12, bob: -2, fistX: -2 }),
      golem({ fistY: 3, bob: 1, fistX: 2 }), golem({ fistY: 2, bob: 1, fistX: 1 }),
    ] },
  },
};
