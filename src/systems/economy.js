// 전투 보상: 금화, 강화석, 장비 드롭 (행운이 높은 등급 쪽으로 가중치를 옮긴다)
import { generateItem } from './items.js';

// 대상별 장비 드롭 확률과 등급 분포 (%)
export const DROP_TABLE = {
  normal: { chance: 0.08, rates: { N: 70, U: 22, R: 6.5, E: 1.3, L: 0.19, M: 0.01 } },
  elite:  { chance: 0.35, rates: { N: 40, U: 35, R: 18, E: 6, L: 0.9, M: 0.1 } },
  boss:   { chance: 1.0,  rates: { R: 70, E: 25, L: 4.5, M: 0.5 } },
};
export const GOLD = { normal: 30, elite: 140, boss: 600 };
export const STONES_FIRST_KILL = { elite: 2, boss: 10 }; // 운명석 (처음 쓰러뜨렸을 때)

// 행운 1당 높은 등급 쪽 가중치 ×1.01 (상한 ×1.5)
export function luckRates(rates, luck) {
  const order = Object.keys(rates);
  const k = Math.min(1.5, Math.pow(1.01, luck));
  return order.map((r, i) => [r, rates[r] * Math.pow(k, i)]);
}

export function rollRewards(enemies, rng, { luck = 0, firstKill = {} } = {}) {
  const out = { gold: 0, enhance: 0, stones: 0, items: [] };
  for (const e of enemies) {
    const tier = e.def.tier || 'normal';
    out.gold += Math.round(GOLD[tier] * (0.9 + rng.next() * 0.2));
    if (rng.chance(tier === 'normal' ? 0.3 : 1)) out.enhance += tier === 'boss' ? 5 : tier === 'elite' ? 2 : 1;
    const t = DROP_TABLE[tier];
    if (rng.chance(t.chance)) out.items.push(generateItem(rng.weighted(luckRates(t.rates, luck)), rng));
    if (STONES_FIRST_KILL[tier] && !firstKill[e.id]) { out.stones += STONES_FIRST_KILL[tier]; firstKill[e.id] = true; }
  }
  return out;
}
