// 파티: 저장 데이터 → 전투에 쓸 능력치 (직업 · 돌파 · 장비 · 옵션)
import { ALL_UNITS } from '../../data/companions.js';
import { JOBS } from '../../data/jobs.js';
import { SLOTS } from '../../data/equipment.js';
import { itemStats } from './items.js';

export const BREAK_STEP = 0.04, BREAK_FULL_BONUS = 0.05; // 돌파 1단계 +4%, 5단계에서 +5% 더

export const findItem = (data, uid) => data.inventory.find(i => i.uid === uid);
export const equippedBy = (data, uid) => Object.keys(data.equip).find(id => SLOTS.some(s => data.equip[id]?.[s] === uid));

export function unitBuild(data, id) {
  const d = ALL_UNITS[id];
  const s = { hp: d.hp, mp: d.mp, atk: d.atk, def: d.def, spd: d.spd, crit: d.crit, eva: d.eva, luck: 0 };
  let hand = d.hand, skills = [...d.skills];
  // 돌파
  const b = d.gacha ? (data.companions[id] || 0) : 0;
  const bm = 1 + b * BREAK_STEP + (b >= 5 ? BREAK_FULL_BONUS : 0);
  for (const k of ['hp', 'atk', 'def']) s[k] = Math.round(s[k] * bm);
  // 이로의 직업
  let job = null;
  if (id === 'iro' && data.job) {
    job = JOBS[data.job];
    const j = job.bonus;
    for (const k of ['hp', 'atk', 'def', 'mp']) if (j[k]) s[k] = Math.round(s[k] * (1 + j[k]));
    for (const k of ['spd']) if (j[k]) s[k] += j[k];
    for (const k of ['crit', 'eva']) if (j[k]) s[k] += j[k];
    hand = job.hand;
    skills = ['punch', 'cheonbung', job.skill];
  }
  // 장비
  const opts = {};
  const items = [];
  for (const slot of SLOTS) {
    const it = findItem(data, data.equip[id]?.[slot]);
    if (!it) continue;
    items.push(it);
    const { stats, opts: o } = itemStats(it);
    for (const [k, v] of Object.entries(stats)) s[k] = (s[k] || 0) + v;
    for (const [k, v] of Object.entries(o)) opts[k] = (opts[k] || 0) + v;
  }
  // 비율 옵션
  if (opts.atk_pct) s.atk = Math.round(s.atk * (1 + opts.atk_pct / 100));
  if (opts.hp_pct) s.hp = Math.round(s.hp * (1 + opts.hp_pct / 100));
  if (opts.def_pct) s.def = Math.round(s.def * (1 + opts.def_pct / 100));
  if (opts.crit) s.crit += opts.crit / 100;
  if (opts.eva) s.eva += opts.eva / 100;
  if (opts.spd) s.spd += opts.spd;
  if (opts.luck) s.luck += opts.luck;
  return { id, def: d, name: d.name, stats: s, hand, skills, opts, job, breakthrough: b, items };
}

// 전투력 (화면에 보여 줄 대략적인 강함)
export function power(build) {
  const s = build.stats;
  return Math.round(s.hp * 0.5 + s.atk * 6 + s.def * 4 + s.spd * 3 + s.crit * 300 + s.eva * 300);
}

// ───────────── 노드 지도에서 이어지는 HP ─────────────
export const maxHpOf = (data, id) => unitBuild(data, id).stats.hp;
export const hpOf = (data, id) => Math.min(maxHpOf(data, id), data.hp[id] ?? Infinity);
export function healParty(data, ratio) {
  for (const p of data.party) { const m = maxHpOf(data, p.id); data.hp[p.id] = Math.min(m, hpOf(data, p.id) + Math.ceil(m * ratio)); }
}
export function hurtParty(data, ratio) {
  for (const p of data.party) { const m = maxHpOf(data, p.id); data.hp[p.id] = Math.max(1, hpOf(data, p.id) - Math.ceil(m * ratio)); }
}
export const fullHeal = data => { data.hp = {}; };

// 빈자리를 가진 동료 중 전투력이 높은 순으로 채운다 (앞줄·뒷줄은 동료의 기본 위치로, 2명씩 맞춘다)
export function autoFillParty(data) {
  const inParty = new Set(data.party.map(p => p.id));
  const cand = Object.keys(data.companions).filter(id => !inParty.has(id)).sort((a, b) => power(unitBuild(data, b)) - power(unitBuild(data, a)));
  while (data.party.length < 4 && cand.length) data.party.push({ id: cand.shift(), row: 'back' });
  fixRows(data);
}
export function fixRows(data) {
  // 앞줄 2명을 넘지 않게: 앞줄 선호(방어·공격)부터
  const pref = p => (p.id === 'iro' ? 0 : ALL_UNITS[p.id].row === 'front' ? 1 : 2);
  const sorted = [...data.party].sort((a, b) => pref(a) - pref(b));
  sorted.forEach((p, i) => { p.row = i < 2 ? 'front' : 'back'; });
}
