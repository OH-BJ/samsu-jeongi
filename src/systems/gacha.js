// 운명의 우물: 등급 굴리기, 천장, 10연차 보정, 픽업, 중복 처리
import { WELLS, TEN_PULL_GUARANTEE, SHARDS_PER_PULL, PICKUP_RATE, DUPLICATE_SHARDS, MAX_BREAKTHROUGH, PULL_COST } from '../../data/gacha-pools.js';
import { RARITY_ORDER, rank } from '../../data/rarity.js';
import { COMPANIONS } from '../../data/companions.js';
import { JOBS } from '../../data/jobs.js';
import { MOUNTS } from '../../data/mounts.js';
import { generateItem } from './items.js';

export const newPity = () => ({ E: 0, L: 0, total: 0, pickupMiss: false });

// 최소 등급(min) 이상 안에서만 원래 비율대로 굴린다
function rollAtLeast(rates, min, rng) {
  const list = Object.entries(rates).filter(([r]) => rank(r) >= rank(min));
  return rng.weighted(list);
}

// 등급 하나 굴리기 (천장 반영) + 카운트 갱신
export function rollRarity(wellId, pity, rng, { tenth = false } = {}) {
  const w = WELLS[wellId];
  let r;
  if (pity.L + 1 >= w.pity.L) r = rollAtLeast(w.rates, 'L', rng);
  else if (pity.E + 1 >= w.pity.E) r = rollAtLeast(w.rates, 'E', rng);
  else if (tenth) r = rollAtLeast(w.rates, TEN_PULL_GUARANTEE, rng);
  else r = rng.weighted(Object.entries(w.rates));
  pity.total++;
  if (rank(r) >= rank('L')) { pity.L = 0; pity.E = 0; }
  else if (rank(r) >= rank('E')) { pity.E = 0; pity.L++; }
  else { pity.E++; pity.L++; }
  return r;
}

// 우물별 뽑기 대상 (등급 → id 목록)
function poolOf(kind, rarity) {
  const src = { companion: COMPANIONS, job: JOBS, mount: MOUNTS }[kind];
  const ids = Object.keys(src).filter(id => src[id].rarity === rarity);
  if (ids.length) return ids;
  // 그 등급에 대상이 없으면 한 단계 아래에서
  return poolOf(kind, RARITY_ORDER[rank(rarity) - 1]);
}

// 대상 고르기 (픽업: 같은 등급 안에서 50%, 놓치면 다음은 확정)
function pickTarget(kind, rarity, pity, rng, pickup) {
  const ids = poolOf(kind, rarity);
  if (pickup && ids.includes(pickup)) {
    if (pity.pickupMiss || rng.chance(PICKUP_RATE)) { pity.pickupMiss = false; return pickup; }
    pity.pickupMiss = true;
    const rest = ids.filter(i => i !== pickup);
    return rest.length ? rng.pick(rest) : pickup;
  }
  return rng.pick(ids);
}

// 저장 데이터(data)에 뽑기 결과를 넣는다. 돌려주는 값: [{ rarity, kind, id?, item?, isNew, dup, shards }]
export function pull(data, wellId, count, rng, { pickup = null } = {}) {
  const w = WELLS[wellId];
  const pity = (data.pity[wellId] ||= newPity());
  const results = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(wellId, pity, rng, { tenth: count >= 10 && i === count - 1 && !results.some(r => rank(r.rarity) >= rank(TEN_PULL_GUARANTEE)) });
    data.shards += SHARDS_PER_PULL;
    const res = { rarity, kind: w.kind, isNew: false, dup: false, shards: 0 };
    if (w.kind === 'equip') {
      res.item = generateItem(rarity, rng);
      data.inventory.push(res.item);
      res.isNew = true;
    } else {
      const id = pickTarget(w.kind, rarity, pity, rng, pickup);
      res.id = id;
      const owned = { companion: data.companions, job: data.jobs, mount: data.mounts }[w.kind];
      if (owned[id] === undefined) { owned[id] = 0; res.isNew = true; }
      else if (w.kind === 'companion' && owned[id] < MAX_BREAKTHROUGH) { owned[id]++; res.dup = 'break'; }
      else { res.dup = 'shards'; res.shards = DUPLICATE_SHARDS[rarity]; data.shards += res.shards; }
    }
    results.push(res);
  }
  return results;
}

// 이야기 보상 뽑기 (비용 없음, 천장 카운트는 센다). min: 최소 등급, slot: 장비 부위 고정
export function freePull(data, wellId, count, rng, { min = null, slot = null } = {}) {
  if (!min && !slot) return pull(data, wellId, count, rng);
  const w = WELLS[wellId], pity = (data.pity[wellId] ||= newPity());
  const out = [];
  for (let i = 0; i < count; i++) {
    const rarity = min ? rollAtLeast(w.rates, min, rng) : rollRarity(wellId, pity, rng);
    data.shards += SHARDS_PER_PULL;
    const item = generateItem(rarity, rng, slot);
    data.inventory.push(item);
    out.push({ rarity, kind: 'equip', item, isNew: true, dup: false, shards: 0 });
  }
  return out;
}

// 비용: 운명석(천직은 전직 의식권)
export function costOf(wellId, count) {
  const w = WELLS[wellId];
  return { currency: w.ticket || 'stones', amount: count * PULL_COST };
}
export function canAfford(data, wellId, count) {
  const c = costOf(wellId, count);
  return (data[c.currency] || 0) >= c.amount;
}
export function pay(data, wellId, count) { const c = costOf(wellId, count); data[c.currency] -= c.amount; }

// 천장까지 남은 횟수
export function pityLeft(wellId, pity = newPity()) {
  const w = WELLS[wellId];
  return { E: w.pity.E - pity.E, L: w.pity.L - pity.L };
}
