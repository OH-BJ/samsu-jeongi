// 합 판정 기본 규칙 (화면과 무관 → 시뮬레이터에서도 같은 코드를 쓴다)
export const HANDS = ['rock', 'scissors', 'paper'];
export const HAND_KO = { rock: '바위', scissors: '가위', paper: '보' };
export const BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };   // 키가 이기는 손
export const BEATEN_BY = { rock: 'paper', scissors: 'rock', paper: 'scissors' }; // 키를 이기는 손

// mine 기준 결과
export const judge = (mine, theirs) => mine === theirs ? 'draw' : BEATS[mine] === theirs ? 'win' : 'lose';

// 상대 자세 확률(합 100)에서 내 손의 승·무·패 확률
export const outcomeOdds = (mine, stance) => ({ win: stance[BEATS[mine]], draw: stance[mine], lose: stance[BEATEN_BY[mine]] });

// 실수 확률표 → 합이 100인 정수 (최대 나머지 방식)
export function normalize(t) {
  const clamp = {};
  for (const h of HANDS) clamp[h] = Math.max(0, t[h] || 0);
  const sum = HANDS.reduce((a, h) => a + clamp[h], 0) || 1;
  const raw = HANDS.map(h => [h, clamp[h] * 100 / sum]);
  const out = Object.fromEntries(raw.map(([h, v]) => [h, Math.floor(v)]));
  let left = 100 - HANDS.reduce((a, h) => a + out[h], 0);
  raw.sort((a, b) => (b[1] % 1) - (a[1] % 1)).forEach(([h]) => { if (left > 0) { out[h]++; left--; } });
  return out;
}

export const rollHand = (stance, rng) => rng.weighted(HANDS.map(h => [h, stance[h]]));

// 결과별 배율
export const ATTACK_MULT = { win: 1.5, draw: 1.0, lose: 0 };
export const DEFENSE_MULT = { win: 0.3, draw: 0.7, lose: 1.0 };
export const COUNTER_CHANCE = { attackLose: 0.3, defenseWin: 0.3 };
export const STREAK_MAX = 10, STREAK_STEP = 0.1;
export const FATE_GAIN = { lose: 20, draw: 5, win: 0 }, FATE_MAX = 100;
export const BACK_ROW_TAKEN = 0.75, GUARD_TAKEN = 0.5;

// 성향 보너스: 같은 손으로 이기면 ×1.2, 균형 성향은 어떤 손이든 이기면 ×1.1
export function affinityBonus(affinity, hand, result) {
  if (result !== 'win') return 1;
  if (affinity === hand) return 1.2;
  if (affinity === 'balanced') return 1.1;
  return 1;
}

// 기본 피해 = (공격력 × 스킬 배율) − (방어력 × 0.5), 최소 1
export function baseDamage(atk, mult, def) { return Math.max(1, atk * mult - def * 0.5); }
