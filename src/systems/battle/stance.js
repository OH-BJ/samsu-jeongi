// 적의 자세 확률: 기본표 + 패턴(고집·들뜸·분노·간파·예고) + 상태(혼란·예지)
import { HANDS, BEATEN_BY, normalize, rollHand } from './rules.js';

export const PATTERN_KO = { stubborn: '고집', excited: '들뜸', anger: '분노', read: '간파', foretell: '예고' };
export const PATTERN_DESC = {
  stubborn: '지면 다음 판에 같은 손을 낼 확률 +30%',
  excited: '이기면 다음 판의 확률이 무작위로 흔들린다',
  anger: 'HP 50% 이하에서 가장 많이 내는 손이 80% 이상이 된다',
  read: '플레이어가 직전에 낸 손을 이기는 손 +25%',
  foretell: '다음 손을 말로 알려 준다 (진실일 확률이 따로 있다)',
};

// 지금 페이즈의 설정 (보스는 phases, 일반 적은 정의 그대로)
export function phaseOf(e) { return e.def.phases ? e.def.phases[e.phase] : e.def; }

export function currentStance(e) {
  const ph = phaseOf(e);
  if (e.status.confuse && e.confuseStance) return e.confuseStance;
  const t = { ...ph.stance };
  for (const m of e.mods) t[m.hand] = (t[m.hand] || 0) + m.add;
  let s = normalize(t);
  if (ph.patterns?.includes('anger') && e.hp <= e.maxHp * 0.5) {
    const top = HANDS.reduce((a, h) => (s[h] > s[a] ? h : a));
    if (s[top] < 80) {
      const rest = HANDS.filter(h => h !== top), restSum = rest.reduce((a, h) => a + s[h], 0) || 1;
      const n = { [top]: 80 };
      rest.forEach(h => (n[h] = 20 * s[h] / restSum));
      s = normalize(n);
    }
  }
  return s;
}

// 합이 끝난 뒤: 이번 판 수정치를 지우고 패턴에 따라 다음 판 수정치를 만든다
// enemyResult: 적 입장의 결과
export function afterClash(e, { enemyHand, playerHand, enemyResult }, rng) {
  const ph = phaseOf(e);
  e.mods = [];
  const pats = ph.patterns || [];
  if (pats.includes('stubborn') && enemyResult === 'lose') e.mods.push({ hand: enemyHand, add: 30 });
  if (pats.includes('excited') && enemyResult === 'win') HANDS.forEach(h => e.mods.push({ hand: h, add: rng.int(-25, 25) }));
  if (pats.includes('read') && playerHand) e.mods.push({ hand: BEATEN_BY[playerHand], add: 25 });
  if (e.status.confuse) e.confuseStance = randomStance(rng);
}

export function randomStance(rng) { return normalize({ rock: rng.int(5, 90), scissors: rng.int(5, 90), paper: rng.int(5, 90) }); }

// 이번 판 적의 손. 「예고」 패턴이면 먼저 손을 말하고, truth 확률로 그대로 낸다.
export function decideEnemyHand(e, rng) {
  const s = currentStance(e), ph = phaseOf(e);
  if (ph.patterns?.includes('foretell')) {
    const said = rollHand(s, rng);
    const truthful = rng.chance(ph.truth ?? 0.7);
    if (truthful) return { hand: said, said };
    const others = HANDS.filter(h => h !== said);
    return { hand: rng.weighted(others.map(h => [h, s[h] + 1])), said };
  }
  return { hand: rollHand(s, rng), said: null };
}

// 숫자 대신 말로: 45% 이상 「자주」, 25% 이상 「가끔」, 그 아래 「거의 안」
export const FREQ = [[45, '자주'], [25, '가끔'], [0, '거의 안']];
export const freqWord = v => FREQ.find(([min]) => v >= min)[1];

// 화면에 보여 줄 자세: 일반 = 정확, 강적 = ±10 오차(말이 가끔 틀린다), 보스 = 일부 「???」 (예지로 공개)
// 돌려주는 값: { rock: {v, text, word}, ... }  v=null 이면 모름
export function displayStance(e, s) {
  const ph = phaseOf(e), tier = e.def.tier || 'normal';
  const out = {};
  for (const h of HANDS) {
    if (e.revealed || tier === 'normal') out[h] = { v: s[h], text: String(s[h]) };
    else if (tier === 'elite') { const v = Math.max(0, Math.min(100, s[h] + (e.noise?.[h] || 0))); out[h] = { v, text: '약' + v }; }
    else if ((ph.hidden || []).includes(h)) out[h] = { v: null, text: '???' };
    else out[h] = { v: s[h], text: String(s[h]) };
  }
  for (const h of HANDS) out[h].word = out[h].v === null ? '???' : freqWord(out[h].v);
  // 보스의 가려진 손은 남은 확률을 똑같이 나눠 가진 것으로 짐작한다 (예상 승률 계산용)
  const hid = HANDS.filter(h => out[h].v === null);
  if (hid.length) { const left = 100 - HANDS.reduce((a, h) => a + (out[h].v ?? 0), 0); hid.forEach(h => (out[h].guess = left / hid.length)); }
  return out;
}

// 강적의 오차는 판마다 새로 굴린다
export function rollNoise(e, rng) { if ((e.def.tier || 'normal') === 'elite') e.noise = Object.fromEntries(HANDS.map(h => [h, rng.int(-10, 10)])); }
