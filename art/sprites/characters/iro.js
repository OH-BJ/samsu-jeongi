// 주인공 이로 — 견습 수투사 (64×80, 오른쪽을 바라봄, 싸움 자세)
// 삐친 갈색 머리 + 붉은 머리띠, 붉은 목도리, 남색 도복 상의(금테) + 주황 허리띠, 무기: 큰 강철 건틀릿 한 쌍
import { blank, compose, outline, part, poly, line, set, rect, shiftBand } from '../../lib.js';
import { head } from '../../chara.js';

const W = 64, H = 80;
const HAIR = ['d', 'o', 'b', 'B'];
const SKIN = ['S', 'q', 'Q', 'o'];
const JACKET = ['U', 'u', 'n', 'k'];
const PANTS = ['l', 'G', 'g', 'n'];
const BOOT = ['o', 'b', 'B', 'K'];
const STEEL = ['W', 'l', 'G', 'g'];
const RED = ['m', 'r', 'R', 'B'];

// 건틀릿 (주먹 + 손목 금테) — 좌상단 (x, y), 크기 s
function gauntlet(x, y, s = 7) {
  const g = part(W, H, (gg, c) => poly(gg, [[x, y + 1], [x + 1, y], [x + s - 1, y], [x + s, y + 2], [x + s, y + s - 1], [x + s - 2, y + s], [x, y + s]], c), STEEL, { hi: 1, lo: 2, deep: 3 });
  for (let k = 1; k < s - 1; k += 2) set(g, x + k + 1, y + 1, 'W');          // 손가락 마디 반짝
  line(g, x + 1, y + 3, x + s - 1, y + 3, 'g');                                 // 마디 홈
  line(g, x, y + s - 1, x, y + s - 3, 'y'); line(g, x + 1, y + s, x + s - 3, y + s, 'y');  // 금테
  set(g, x + Math.floor(s / 2), y + Math.floor(s / 2) + 1, 'C');                // 손등 보석
  return g;
}

function iro({ bx = 0, by = 0, tail = 0, arm = 'guard', fx = null } = {}) {
  // 목도리 꼬리 (뒤로 휘날림)
  const scarf = part(W, H, (g, c) => {
    poly(g, [[26, 25], [22, 27 + tail], [12, 30 + tail * 2], [6, 36 + tail * 2], [11, 35 + tail], [20, 31], [26, 29]], c);
    poly(g, [[25, 28], [16, 36 + tail], [12, 42 + tail], [17, 40 + tail], [24, 32]], c);
  }, RED, { hi: 1, lo: 1, deep: 3 });
  const legB = part(W, H, (g, c) => poly(g, [[22, 48], [31, 48], [30, 58], [26, 70], [17, 70], [19, 59]], c), PANTS, { hi: 1, lo: 2, deep: 4 });
  const legF = part(W, H, (g, c) => poly(g, [[32, 48], [41, 48], [45, 57], [46, 70], [37, 70], [35, 59]], c), PANTS, { hi: 1, lo: 2, deep: 4 });
  const boots = part(W, H, (g, c) => { poly(g, [[17, 68], [26, 68], [26, 77], [13, 77], [15, 72]], c); poly(g, [[37, 68], [46, 68], [49, 73], [49, 77], [37, 77]], c); }, BOOT, { hi: 1, lo: 1, deep: 2 });
  const torso = part(W, H, (g, c) => poly(g, [[24, 26], [38, 26], [40, 34], [39, 47], [24, 47], [23, 34]], c), JACKET, { hi: 1, lo: 2, deep: 5 });
  const sash = blank(W, H);
  rect(sash, 23, 45, 17, 4, 'O'); line(sash, 23, 45, 39, 45, 'y'); line(sash, 23, 48, 39, 48, 'e');
  [[47, 21, 'Oe'], [48, 19, 'OOe'], [49, 18, 'Oe'], [50, 17, 'e']].forEach(([y, x, s]) => [...s].forEach((c, i) => set(sash, x + i - Math.round(tail * 0.6), y, c)));

  let body = compose(W, H, [[scarf, 0, 0], [legB, 0, 0], [legF, 0, 0], [boots, 0, 0], [torso, 0, 0], [sash, 0, 0]]);
  // 도복: 흰 안섶(V), 금테, 장화 끈
  line(body, 29, 26, 31, 33, 'W'); line(body, 34, 26, 32, 33, 'W'); line(body, 30, 26, 31, 30, 'l');
  line(body, 28, 27, 30, 31, 'y'); line(body, 24, 44, 39, 44, 'y');
  for (let y = 61; y <= 67; y += 2) { line(body, 19, y, 27, y, 'S'); line(body, 37, y, 45, y, 'S'); }   // 정강이 붕대
  line(body, 16, 70, 25, 70, 'y'); line(body, 38, 70, 46, 70, 'y');
  // 목도리 감긴 부분
  const wrap = part(W, H, (g, c) => poly(g, [[26, 23], [36, 23], [37, 27], [26, 28]], c), RED, { hi: 1, lo: 1, deep: 2 });
  body = compose(W, H, [[body, 0, 0], [wrap, 0, 0]]);
  if (by) body = shiftBand(body, 0, 49, by);

  // 팔: 위팔(소매) + 붕대 감은 아래팔 + 건틀릿
  const arms = [];
  const limb = (pts, ramp) => part(W, H, (g, c) => poly(g, pts, c), ramp, { hi: 1, lo: 1, deep: 2 });
  if (arm === 'guard') {
    arms.push([limb([[22, 28], [26, 28], [25, 36], [21, 36]], JACKET), 0, 0], [limb([[21, 35], [25, 36], [26, 33], [23, 32]], SKIN), 0, 0], [gauntlet(23, 32, 6), 0, 0]);
    arms.push([limb([[36, 28], [40, 28], [42, 34], [38, 35]], JACKET), 0, 0], [limb([[39, 33], [43, 34], [45, 31], [42, 29]], SKIN), 0, 0], [gauntlet(43, 25, 7), 0, 0]);
  } else if (arm === 'windup') {
    arms.push([gauntlet(20, 27, 6), 0, 0]);
    arms.push([limb([[35, 28], [39, 28], [38, 35], [34, 35]], JACKET), 0, 0], [limb([[34, 34], [38, 34], [36, 30], [33, 30]], SKIN), 0, 0], [gauntlet(31, 25, 7), 0, 0]);
  } else { // punch
    arms.push([gauntlet(22, 33, 6), 0, 0]);
    arms.push([limb([[36, 28], [41, 28], [41, 33], [36, 33]], JACKET), 0, 0], [limb([[40, 29], [50, 29], [50, 33], [40, 33]], SKIN), 0, 0], [gauntlet(50, 27, 8), 0, 0]);
  }
  const armG = compose(W, H, arms);
  for (let x = 41; x < 50; x += 2) if (arm === 'punch') { set(armG, x, 30, 'l'); set(armG, x, 32, 'l'); }    // 팔 붕대 줄무늬

  const hd = head(W, H, { cx: 31, top: 3, hair: HAIR, skin: SKIN, iris: ['B', 'b', 'd'], eye: 'cute', brow: true, browColor: 'B', mouth: 'grin', blush: false,
    capRx: 11, capRy: 9, bangs: [3, 5, 4, 2, 5, 6, 3, 2, 5, 4, 2, 4, 5, 3, 2], lockL: 6, lockR: 0 });
  // 삐침 머리 (위·뒤로)
  const spikes = part(W, H, (g, c) => {
    [[20, 9, 13, 2, 23, 5], [23, 5, 21, -2, 28, 3], [28, 3, 30, -3, 33, 3], [32, 3, 38, -1, 37, 6], [37, 5, 44, 3, 41, 9], [19, 13, 10, 12, 20, 17]]
      .forEach(([a, b, c1, d, e, f]) => poly(g, [[a, b], [c1, d], [e, f]], c));
  }, HAIR, { hi: 1, lo: 1, deep: 2 });
  // 머리띠 + 매듭 꼬리
  const band = blank(W, H);
  line(band, 20, 10, 42, 9, 'r'); line(band, 20, 11, 42, 10, 'R'); set(band, 30, 9, 'm'); set(band, 34, 9, 'm');
  [[20, 9, 'R'], [18, 10, 'rR'], [15, 11 + tail, 'rrR'], [12, 12 + tail, 'rR'], [16, 13 + tail, 'rR'], [13, 15 + tail, 'R']].forEach(([x, y, s]) => [...s].forEach((c, i) => set(band, x + i, y, c)));

  let g = compose(W, H, [[body, 0, 0], [spikes, 0, by], [hd, 0, by], [band, 0, by], [armG, 0, by]]);
  if (bx) { const m = blank(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = g.px[y * W + x]; if (c) set(m, y < 46 ? x + bx : x, y, c); } g = m; }
  g = outline(g);
  if (fx === 'smear') [[28, 30, 'lllllll'], [29, 32, 'WWWWW'], [35, 31, 'lllll']].forEach(([y, x, s]) => [...s].forEach((c, i) => set(g, x + i + bx, y + by, c)));
  if (fx === 'spark') [[26, 61, 'W'], [27, 59, 'Y.Y'], [28, 58, 'YWWWY'], [29, 57, 'WWWWWWW'], [30, 58, 'YWWWY'], [31, 59, 'Y.Y'], [32, 61, 'W']]
    .forEach(([y, x, s]) => [...s].forEach((c, i) => { if (c !== '.') set(g, x + i + bx - 4, y + by, c); }));
  return g;
}

export default {
  id: 'iro', name: '이로 · 견습 수투사 (주인공)', w: W, h: H, origin: [32, 77], group: '캐릭터',
  anims: {
    idle: { ms: 170, frames: [iro({}), iro({ by: 1, tail: 1 }), iro({ by: 1, tail: 2 }), iro({ tail: 1 })] },
    attack: { ms: 80, frames: [
      iro({ arm: 'windup', bx: -1 }), iro({ arm: 'windup', bx: -2, by: 1, tail: 1 }),
      iro({ arm: 'punch', bx: 1, tail: 2, fx: 'smear' }), iro({ arm: 'punch', bx: 2, tail: 2, fx: 'spark' }),
      iro({ arm: 'punch', bx: 1, tail: 1 }), iro({ arm: 'guard' }),
    ] },
  },
};
