// 손 버튼 아이콘 32×32 — 바위 / 가위 / 보 (소매 색 = 손 성향 상징색)
import { compose, outline, part, poly, line, set } from '../../lib.js';

const S = 32;
const SKIN = ['S', 'q', 'Q', 'o'];
const P = (shape, ramp, opt = { hi: 1, lo: 1, deep: 3 }) => outline(part(S, S, shape, ramp, opt));
const sleeve = ramp => P((g, c) => poly(g, [[9, 25], [24, 25], [25, 31], [8, 31]], c), ramp);

function rock() {
  const fist = P((g, c) => poly(g, [[7, 8], [24, 7], [27, 11], [27, 21], [23, 26], [9, 26], [5, 21], [5, 12]], c), SKIN, { hi: 2, lo: 2, deep: 4 });
  const thumb = P((g, c) => poly(g, [[5, 16], [18, 16], [21, 20], [19, 22], [7, 22]], c), SKIN);
  const g = compose(S, S, [[sleeve(['y', 'O', 'e', 'b']), 0, 0], [fist, 0, 0], [thumb, 0, 0]]);
  [11, 16, 21].forEach(x => line(g, x, 8, x, 14, 'Q'));
  [[9, 9], [13, 9], [18, 9], [23, 10]].forEach(([x, y]) => set(g, x, y, 'S'));
  return g;
}
function scissors() {
  const f1 = P((g, c) => poly(g, [[7, 4], [11, 2], [15, 15], [11, 17]], c), SKIN);
  const f2 = P((g, c) => poly(g, [[19, 1], [24, 3], [20, 17], [15, 16]], c), SKIN);
  const palm = P((g, c) => poly(g, [[8, 15], [23, 15], [26, 20], [23, 26], [10, 26], [7, 21]], c), SKIN, { hi: 1, lo: 2, deep: 4 });
  const curl = P((g, c) => poly(g, [[17, 15], [26, 15], [27, 21], [18, 21]], c), SKIN);
  const thumb = P((g, c) => poly(g, [[6, 18], [16, 19], [17, 23], [8, 23]], c), SKIN);
  const g = compose(S, S, [[sleeve(['C', 'U', 'u', 'k']), 0, 0], [f1, 0, 0], [f2, 0, 0], [palm, 0, 0], [curl, 0, 0], [thumb, 0, 0]]);
  line(g, 22, 16, 22, 20, 'Q');
  return g;
}
function paper() {
  const fingers = [
    [[6, 6], [10, 5], [11, 16], [7, 16]], [[11, 2], [15, 2], [15, 15], [11, 15]],
    [[16, 2], [20, 3], [19, 15], [16, 15]], [[21, 6], [25, 7], [23, 16], [20, 16]],
  ].map(pts => P((g, c) => poly(g, pts, c), SKIN));
  const palm = P((g, c) => poly(g, [[7, 14], [24, 14], [25, 22], [22, 26], [10, 26], [7, 22]], c), SKIN, { hi: 2, lo: 2, deep: 4 });
  const thumb = P((g, c) => poly(g, [[1, 12], [5, 11], [10, 17], [9, 21], [4, 17]], c), SKIN);
  return compose(S, S, [[sleeve(['m', 'P', 'p', 'B']), 0, 0], ...fingers.map(f => [f, 0, 0]), [palm, 0, 0], [thumb, 0, 0]]);
}

export default {
  id: 'hands', name: '손 버튼 · 바위 / 가위 / 보 (32×32)', w: 32, h: 32, group: 'UI',
  anims: { all: { ms: 600, frames: [rock(), scissors(), paper()] } },
};
