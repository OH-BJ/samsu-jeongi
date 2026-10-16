// 장비 랜덤 옵션. 줄마다 품질을 따로 굴리고, 품질에 따라 수치 구간이 정해진다.
export const QUALITY = [
  { id: 0, name: '하급', rate: 60, color: '#c0cbdc' },
  { id: 1, name: '중급', rate: 30, color: '#63c74d' },
  { id: 2, name: '상급', rate: 9, color: '#2ce8f5' },
  { id: 3, name: '최상급', rate: 1, color: '#feae34' },
];

// range: [최소, 최대] — 품질 구간으로 4등분한다. weight: 나오는 비율
// (시뮬레이터: 처음 값의 약 1/3로 줄였다)
export const OPTIONS = {
  win_rock:     { label: '바위로 이기면 피해 +{v}%', range: [4, 14], weight: 6 },
  win_scissors: { label: '가위로 이기면 피해 +{v}%', range: [4, 14], weight: 6 },
  win_paper:    { label: '보로 이기면 피해 +{v}%', range: [4, 14], weight: 6 },
  draw_to_win:  { label: '비기면 {v}% 확률로 승리 처리', range: [1, 5], weight: 4 },
  lose_to_draw: { label: '지면 {v}% 확률로 무승부 처리', range: [1, 4], weight: 4 },
  lose_dmg:     { label: '패배 시 받는 피해 -{v}%', range: [2, 9], weight: 5 },
  streak_keep:  { label: '연승이 끊길 때 {v}% 확률로 유지', range: [2, 10], weight: 4 },
  fate_gain:    { label: '운명 게이지 획득량 +{v}%', range: [4, 18], weight: 4 },
  crit:         { label: '치명타율 +{v}%', range: [1, 4], weight: 6 },
  eva:          { label: '회피율 +{v}%', range: [1, 3], weight: 5 },
  luck:         { label: '행운 +{v}', range: [1, 5], weight: 5 },
  status:       { label: '상태이상 확률 +{v}%', range: [1, 5], weight: 4 },
  spd:          { label: '속도 +{v}', range: [1, 2], weight: 5 },
  atk_pct:      { label: '공격력 +{v}%', range: [1, 4], weight: 7 },
  hp_pct:       { label: '최대 HP +{v}%', range: [2, 5], weight: 7 },
  def_pct:      { label: '방어력 +{v}%', range: [2, 5], weight: 6 },
};

// 품질 q(0~3)에서 수치 하나를 굴린다
export function rollValue(id, q, rng) {
  const [lo, hi] = OPTIONS[id].range, step = (hi - lo + 1) / 4;
  const a = Math.round(lo + step * q), b = Math.max(a, Math.round(lo + step * (q + 1)) - 1);
  return rng.int(a, Math.min(hi, b));
}

export const optionText = o => OPTIONS[o.id].label.replace('{v}', o.v);
