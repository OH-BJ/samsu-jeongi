// 장비 생성, 재련, 분해, 능력치 계산
import { RARITY_MULT } from '../../data/rarity.js';
import { SLOTS, BASE, OPTION_LINES, UNIQUE_COUNT, UNIQUES, nameFor } from '../../data/equipment.js';
import { OPTIONS, QUALITY, rollValue } from '../../data/options.js';

let seq = Date.now() % 1e6;
const newUid = () => 'i' + (++seq).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

function rollOption(rng, exclude = []) {
  const pool = Object.entries(OPTIONS).filter(([id]) => !exclude.includes(id));
  const id = rng.weighted(pool.map(([k, o]) => [k, o.weight]));
  const q = rng.weighted(QUALITY.map(x => [x.id, x.rate]));
  return { id, v: rollValue(id, q, rng), q };
}

// 같은 옵션이 두 줄 나오지 않게 굴린다
function rollOptions(n, rng, keep = []) {
  const out = [...keep];
  while (out.length < n) out.push(rollOption(rng, out.map(o => o.id)));
  return out;
}

export function generateItem(rarity, rng, slot = null) {
  slot ||= rng.pick(SLOTS);
  const m = RARITY_MULT[rarity];
  const base = {};
  for (const [k, v] of Object.entries(BASE[slot])) base[k] = k === 'crit' ? +(v * m).toFixed(3) : Math.max(1, Math.round(v * m));
  const [lo, hi] = OPTION_LINES[rarity];
  const opts = rollOptions(rng.int(lo, hi), rng);
  const uniques = [];
  const ids = Object.keys(UNIQUES);
  for (let i = 0; i < (UNIQUE_COUNT[rarity] || 0); i++) uniques.push(rng.pick(ids.filter(id => !uniques.includes(id))));
  return { uid: newUid(), slot, rarity, name: nameFor(slot, rarity, rng), base, opts, uniques, plus: 0, fails: 0 };
}

// 재련: 옵션 전체를 다시 굴린다. lock = 고정할 줄 번호 (없으면 -1)
export function reroll(item, rng, lock = -1) {
  const keep = lock >= 0 && item.opts[lock] ? [item.opts[lock]] : [];
  const n = item.opts.length || (OPTION_LINES[item.rarity][1]);
  item.opts = rollOptions(n, rng, keep);
  if (lock >= 0 && keep.length) { const k = item.opts.shift(); item.opts.splice(lock, 0, k); }
  return item;
}
export const rerollCost = (item, lock) => (1 + ['N', 'U', 'R', 'E', 'L', 'M', 'X'].indexOf(item.rarity)) * (lock >= 0 ? 3 : 1);

// 분해: 강화석·재련석, 판매: 금화
const DISMANTLE = { N: [1, 0], U: [2, 0], R: [4, 1], E: [8, 2], L: [20, 5], M: [50, 12], X: [120, 30] };
export const dismantleValue = item => ({ enhance: DISMANTLE[item.rarity][0] + item.plus, reroll: DISMANTLE[item.rarity][1] });
export const sellPrice = item => Math.round({ N: 20, U: 50, R: 150, E: 500, L: 2000, M: 8000, X: 20000 }[item.rarity] * (1 + item.plus * 0.2));

// 장비 하나의 효과: 기본치(강화 +5%씩) + 옵션 + 고유 옵션
export function itemStats(item) {
  const k = 1 + 0.05 * item.plus;
  const s = {};
  for (const [stat, v] of Object.entries(item.base)) s[stat] = stat === 'crit' ? v * k : Math.round(v * k);
  const opts = {};
  for (const o of item.opts) opts[o.id] = (opts[o.id] || 0) + o.v;
  for (const u of item.uniques || []) for (const [id, v] of Object.entries(UNIQUES[u].opts)) opts[id] = (opts[id] || 0) + v;
  // +10, +15 추가 효과
  if (item.plus >= 10) opts.atk_pct = (opts.atk_pct || 0) + 3;
  if (item.plus >= 15) opts.fate_gain = (opts.fate_gain || 0) + 10;
  return { stats: s, opts };
}
