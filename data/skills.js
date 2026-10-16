// 스킬 데이터
// kind: normal(일반기) / finisher(필승기: 이겼을 때만) / stable(안정기: 져도 50% 기본 발동)
//       fixed(손 고정기: hand로만) / gamble(도박기: 효과표) / manip(판정 조작기: 합 없음) / heal(회복: 합 없음)
//       guard_all 등 특수는 effect로 처리
// target: enemy / all_enemies / ally / self
// melee: true면 뒷줄에서 쓸 수 없다
// status: { type, chance } — 이기면 확정, 비기면 chance, 지면 없음
export const SKILLS = {
  // ── 기본 공격 (MP 없음)
  punch:      { name: '정권 찌르기', kind: 'normal', mult: 1.0, mp: 0, target: 'enemy', melee: true, desc: '주먹으로 곧게 찌른다.' },
  mace:       { name: '철퇴 내려치기', kind: 'normal', mult: 1.0, mp: 0, target: 'enemy', melee: true, desc: '철퇴로 내려친다.' },
  knife:      { name: '비수 던지기', kind: 'normal', mult: 0.9, mp: 0, target: 'enemy', melee: false, desc: '뒷줄에서도 던질 수 있는 비수.' },
  talisman:   { name: '부적 날리기', kind: 'normal', mult: 0.9, mp: 0, target: 'enemy', melee: false, status: { type: 'confuse', chance: 0.1 }, desc: '부적을 날린다. 낮은 확률로 혼란.' },

  // ── 이로 (균형)
  cheonbung:  { name: '천붕권', kind: 'finisher', mult: 2.2, mp: 10, target: 'enemy', melee: true, desc: '필승기. 이겼을 때만 발동하지만 하늘이 무너질 듯 강하다 (×3.3).' },
  fate_fist:  { name: '운명의 주먹', kind: 'stable', mult: 1.2, mp: 6, target: 'enemy', melee: true, desc: '안정기. 져도 50% 확률로 기본 발동한다.' },

  // ── 무쇠 (바위)
  shield_bash:{ name: '방패 강타', kind: 'stable', mult: 1.1, mp: 6, target: 'enemy', melee: true, status: { type: 'stun', chance: 0.25 }, desc: '안정기. 져도 50%로 발동. 기절 확률.' },
  iron_fist:  { name: '철권', kind: 'fixed', hand: 'rock', mult: 1.8, mp: 8, target: 'enemy', melee: true, desc: '손 고정기. 바위로만 낼 수 있지만 강하다.' },

  // ── 세린 (가위)
  twin_slash: { name: '쌍검 난무', kind: 'normal', mult: 1.3, mp: 6, target: 'enemy', melee: true, status: { type: 'bleed', chance: 0.4 }, desc: '두 칼로 연달아 벤다. 출혈 확률.' },
  dice:       { name: '주사위 던지기', kind: 'gamble', mult: 1.0, mp: 8, target: 'enemy', melee: false, desc: '도박기. 효과표를 굴린다. 이기면 두 번 굴려 좋은 쪽.' },

  // ── 하람 (보)
  foresight:  { name: '예지', kind: 'manip', mp: 6, target: 'self', desc: '판정 조작기. 다음 한 판에서 지면 무승부로 바꿔 준다 (공격·방어 모두).' },
  heal:       { name: '정화의 바람', kind: 'heal', mult: 1.6, mp: 8, target: 'ally', desc: '아군 한 명의 HP를 회복한다.' },
  paper_storm:{ name: '지풍 폭풍', kind: 'normal', mult: 0.7, mp: 12, target: 'all_enemies', melee: false, status: { type: 'confuse', chance: 0.15 }, desc: '적 전체 공격. 합은 대표 대상(고른 적)과 한 번만 겨룬다.' },

  // ── 천직 스킬 (이로의 직업에 따라 바뀐다)
  job_balance:    { name: '수투 연격', kind: 'stable', mult: 1.2, mp: 5, target: 'enemy', melee: true, desc: '안정기. 져도 50%로 기본 발동.' },
  job_rock:       { name: '통나무 부수기', kind: 'fixed', hand: 'rock', mult: 1.6, mp: 6, target: 'enemy', melee: true, desc: '손 고정기(바위).' },
  job_scissors:   { name: '마름질', kind: 'normal', mult: 1.3, mp: 6, target: 'enemy', melee: true, status: { type: 'bleed', chance: 0.3 }, desc: '출혈 확률.' },
  job_paper:      { name: '종이 화살', kind: 'normal', mult: 1.1, mp: 6, target: 'enemy', melee: false, status: { type: 'confuse', chance: 0.2 }, desc: '뒷줄에서도 쓸 수 있다. 혼란 확률.' },
  job_balance_r:  { name: '행운의 노래', kind: 'stable', mult: 1.45, mp: 7, target: 'enemy', melee: false, desc: '안정기. 뒷줄에서도 쓸 수 있다.' },
  job_rock_r:     { name: '성스러운 철퇴', kind: 'fixed', hand: 'rock', mult: 1.9, mp: 8, target: 'enemy', melee: true, status: { type: 'stun', chance: 0.2 }, desc: '손 고정기(바위). 기절 확률.' },
  job_scissors_r: { name: '쌍월참', kind: 'normal', mult: 1.55, mp: 8, target: 'enemy', melee: true, status: { type: 'bleed', chance: 0.4 }, desc: '출혈 확률.' },
  job_paper_r:    { name: '유성 부적', kind: 'normal', mult: 0.8, mp: 10, target: 'all_enemies', melee: false, desc: '적 전체 공격.' },
  job_rock_e:     { name: '철벽 강타', kind: 'fixed', hand: 'rock', mult: 2.2, mp: 9, target: 'enemy', melee: true, status: { type: 'stun', chance: 0.3 }, desc: '손 고정기(바위). 기절 확률.' },
  job_scissors_e: { name: '칼날 윤무', kind: 'finisher', mult: 2.4, mp: 10, target: 'enemy', melee: true, status: { type: 'bleed', chance: 1 }, desc: '필승기. 이기면 확정 출혈.' },
  job_paper_e:    { name: '구름 폭풍', kind: 'normal', mult: 1.0, mp: 12, target: 'all_enemies', melee: false, status: { type: 'confuse', chance: 0.2 }, desc: '적 전체 공격. 혼란 확률.' },
  job_rock_l:     { name: '권성 붕격', kind: 'fixed', hand: 'rock', mult: 2.7, mp: 10, target: 'enemy', melee: true, status: { type: 'stun', chance: 0.4 }, desc: '손 고정기(바위). 기절 확률.' },
  job_scissors_l: { name: '일섬', kind: 'finisher', mult: 2.9, mp: 11, target: 'enemy', melee: true, status: { type: 'bleed', chance: 1 }, desc: '필승기. 베지 못할 것은 없다.' },
  job_paper_l:    { name: '천포 강림', kind: 'normal', mult: 1.25, mp: 14, target: 'all_enemies', melee: false, status: { type: 'confuse', chance: 0.3 }, desc: '적 전체 공격. 혼란 확률.' },
  job_fate:       { name: '운명 엮기', kind: 'fate_gain', amount: 40, mp: 10, target: 'self', desc: '운명 게이지 +40.' },

  // ── 적
  slam:       { name: '내려치기', kind: 'normal', mult: 1.0, target: 'enemy', melee: true },
  vine:       { name: '덩굴 채찍', kind: 'normal', mult: 0.9, target: 'enemy', melee: false, status: { type: 'bleed', chance: 0.3 } },
  sweep:      { name: '휩쓸기', kind: 'normal', mult: 0.6, target: 'all_enemies', melee: true },
  hammer:     { name: '반석 망치', kind: 'normal', mult: 1.25, target: 'enemy', melee: true },
  quake:      { name: '대지 울림', kind: 'normal', mult: 0.6, target: 'all_enemies', melee: false },
  petrify:    { name: '흑수의 손길', kind: 'normal', mult: 0.5, target: 'enemy', melee: false, status: { type: 'petrify', chance: 0.5 }, desc: '굳음: 한 턴 동안 움직일 수 없다.' },
  roar:       { name: '왕의 포효', kind: 'fate_drain', amount: 20, target: 'self', desc: '운명 게이지 -20' },
};

// 도박기 효과표: [이름, 배율, 가중치, 부가 효과]
export const GAMBLE_TABLE = [
  ['꽝… 주사위가 굴러갔다', 0.3, 30, null],
  ['평범한 눈', 1.0, 35, null],
  ['좋은 눈!', 1.8, 22, null],
  ['쌍육! 출혈까지', 2.2, 10, 'bleed'],
  ['대박! 666', 4.0, 3, 'stun'],
];

export const STATUS_KO = { bleed: '출혈', stun: '기절', confuse: '혼란', petrify: '굳음' };
export const STATUS_TURNS = { bleed: 3, stun: 1, confuse: 2, petrify: 1 };

// 아이템 (전투용, M4에서 확장)
export const ITEMS = {
  potion: { name: '회복약', heal: 0.35, desc: 'HP를 최대치의 35% 회복' },
};
