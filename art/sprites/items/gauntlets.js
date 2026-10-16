// 건틀릿 계열 무기 아이콘 24×24 — 등급별 5종 (N · R · E · L · M)
// 같은 실루엣에 등급이 오를수록 재질·장식·빛을 더한다.
import { compose, outline, part, poly, line, set, rect, ellipse, blank } from '../../lib.js';

const S = 24;
const P = (shape, ramp, opt) => outline(part(S, S, shape, ramp, opt));

function gauntlet({ metal, cuff, gem = null, spikes = false, engrave = null, aura = null, twinkle = -1 }) {
  const layers = [];
  if (aura) { // 뒤에서 피어오르는 기운
    const a = blank(S, S);
    aura.forEach(([x, y, c]) => set(a, x, y, c));
    layers.push([a, 0, 0]);
  }
  const cuffG = P((g, c) => poly(g, [[6, 15], [19, 15], [20, 22], [5, 22]], c), cuff, { hi: 1, lo: 1, deep: 3 });
  const fist = P((g, c) => poly(g, [[4, 6], [8, 3], [18, 3], [21, 6], [21, 14], [17, 16], [6, 16], [3, 12]], c), metal, { hi: 1, lo: 2, deep: 4 });
  const thumb = P((g, c) => poly(g, [[3, 9], [10, 9], [12, 13], [5, 14]], c), metal, { hi: 1, lo: 1, deep: 3 });
  layers.push([cuffG, 0, 0], [fist, 0, 0], [thumb, 0, 0]);
  const g = compose(S, S, layers);
  // 손가락 마디
  [8, 12, 16].forEach(x => line(g, x, 4, x, 8, metal[2]));
  line(g, 5, 18, 19, 18, cuff[2]);
  if (spikes) [[6, 2], [10, 1], [14, 1], [18, 2]].forEach(([x, y]) => { set(g, x, y, metal[0]); set(g, x, y + 1, metal[1]); set(g, x - 1, y + 1, 'K'); set(g, x + 1, y + 1, 'K'); set(g, x, y - 1, 'K'); });
  if (engrave) engrave.forEach(([x, y, c]) => set(g, x, y, c));
  if (gem) { // 손등 보석
    set(g, 13, 11, gem[0]); set(g, 14, 11, gem[1]); set(g, 13, 12, gem[1]); set(g, 14, 12, gem[2]);
    set(g, 12, 11, 'K'); set(g, 15, 11, 'K'); set(g, 12, 12, 'K'); set(g, 15, 12, 'K'); set(g, 13, 10, 'K'); set(g, 14, 10, 'K'); set(g, 13, 13, 'K'); set(g, 14, 13, 'K');
  }
  // 반짝임
  const tw = [[19, 4], [4, 7], [20, 16], [9, 20]];
  if (twinkle >= 0) { const [x, y] = tw[twinkle % tw.length]; set(g, x, y, 'W'); set(g, x - 1, y, 'W'); set(g, x + 1, y, 'W'); set(g, x, y - 1, 'W'); set(g, x, y + 1, 'W'); }
  return g;
}

const N = () => gauntlet({ metal: ['l', 'G', 'g', 'n'], cuff: ['o', 'b', 'B', 'K'] });
const R = () => gauntlet({ metal: ['C', 'U', 'u', 'k'], cuff: ['G', 'g', 'n', 'k'], gem: ['W', 'C', 'U'] });
const E = () => gauntlet({ metal: ['7', '8', 'p', 'B'], cuff: ['g', 'n', 'k', 'K'], gem: ['W', 'm', 'r'], spikes: true });
const L = t => gauntlet({ metal: ['1', '2', '3', 'b'], cuff: ['r', 'R', 'B', 'K'], gem: ['W', 'r', 'R'], spikes: true, twinkle: t,
  engrave: [[6, 12, '3'], [7, 13, '3'], [19, 10, '3'], [18, 12, '3'], [9, 20, '2'], [12, 20, '2'], [15, 20, '2']] });
const M = t => {
  const flame = [[2, 3, '5'], [3, 1, '4'], [21, 2, '5'], [22, 4, '4'], [1, 10, '6'], [22, 11, '5'], [2, 17, '5'], [21, 19, '6'], [12, 0, '4']]
    .map(([x, y, c], i) => [x, (y + (t + i) % 2) % 24, c]);
  return gauntlet({ metal: ['4', '5', '6', 'B'], cuff: ['k', 'K', 'K', 'K'], gem: ['W', 'Y', 'y'], spikes: true, twinkle: t, aura: flame,
    engrave: [[6, 7, 'K'], [7, 8, 'K'], [9, 12, 'K'], [10, 13, 'K'], [17, 6, 'K'], [18, 9, 'K'], [16, 13, 'K'], [10, 19, '5'], [14, 19, '5'], [12, 19, '4']] });
};

export const GAUNTLETS = [
  { id: 'gauntlet_iron', rarity: 'N', name: '쇠 건틀릿' },
  { id: 'gauntlet_azure', rarity: 'R', name: '청강 건틀릿' },
  { id: 'gauntlet_amethyst', rarity: 'E', name: '자수정 가시주먹' },
  { id: 'gauntlet_urs', rarity: 'L', name: '반석왕의 망치주먹' },
  { id: 'gauntlet_blackhand', rarity: 'M', name: '흑수의 파편' },
];

export default {
  id: 'gauntlets', name: '무기 아이콘 · 건틀릿 5등급 (N R E L M)', w: 24, h: 24, group: '아이템', rarityRow: ['N', 'R', 'E', 'L', 'M'],
  anims: {
    all: { ms: 400, frames: [N(), R(), E(), L(-1), M(0)] },
    legend: { ms: 200, frames: [L(0), L(1), L(2), L(3)] },
    myth: { ms: 160, frames: [M(0), M(1), M(2), M(3)] },
  },
};
