// 강화 +0 ~ +15
// 성공 확률 (다음 단계 기준), +10 이상은 실패하면 1단계 하락 (보호 부적으로 막는다)
export const ENHANCE_RATE = [100, 95, 90, 80, 70, 60, 50, 40, 30, 25, 20, 15, 10, 5, 2]; // +1 ~ +15
export const MAX_PLUS = 15;
export const dropsOnFail = plus => plus >= 9; // +10 이상으로 올리려다 실패하면 하락

// 실패 보정: 실패할 때마다 +1%(최대 +10%), +10 이상 구간은 +3%(최대 +30%).
// 지금까지의 최고 단계를 넘어서야 초기화된다 → 하락했다 다시 올라가는 동안 보정이 유지된다.
// (시뮬레이터: 부적 없이 +15까지 평균 약 320번. +1%/최대 10%로는 약 15,000번이라 바꿨다)
export function failBonus(item) {
  const high = item.plus >= 9;
  return Math.min(high ? 30 : 10, (item.fails || 0) * (high ? 3 : 1));
}
export function successRate(item) {
  if (item.plus >= MAX_PLUS) return 0;
  return Math.min(100, ENHANCE_RATE[item.plus] + failBonus(item));
}

export function enhanceCost(item) {
  const r = ['N', 'U', 'R', 'E', 'L', 'M', 'X'].indexOf(item.rarity) + 1;
  return { gold: (item.plus + 1) * 40 * r, enhance: 1 + Math.floor(item.plus / 3) };
}

// 결과: 'success' | 'fail' | 'drop' | 'protected'
export function tryEnhance(item, rng, { protect = false } = {}) {
  const rate = successRate(item);
  if (rng.next() * 100 < rate) {
    item.plus++;
    if (item.plus > (item.best || 0)) { item.best = item.plus; item.fails = 0; }
    return 'success';
  }
  item.fails = (item.fails || 0) + 1;
  if (dropsOnFail(item.plus)) {
    if (protect) return 'protected';
    item.plus--; return 'drop';
  }
  return 'fail';
}
