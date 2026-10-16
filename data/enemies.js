// 적 데이터 (1장 반석국). 수치는 tools/sim/battle-sim.mjs 로 맞췄다 (2026-10-16, 손은 완전히 운 · 「적정 장비」= 장비 우물 20회분 기준)
// tier: normal(정확히 표시) / elite(약 ±10) / boss(일부 ???, 페이즈마다 자세가 바뀐다)
// stance: 손별 확률, patterns: 자세 패턴, skills: [[스킬, 가중치], ...]
// look: 그림 (sprite 키, scale 확대 배율, tint 색 곱하기 [r, g, b], flip 좌우 반전 — 아군 그림을 적으로 쓸 때)
export const ENEMIES = {
  stone_golem: {
    name: '돌골렘', short: '골렘', tier: 'normal', hp: 185, atk: 81, def: 10, spd: 7, crit: 0.05, eva: 0.02,
    stance: { rock: 60, scissors: 20, paper: 20 }, patterns: ['stubborn'],
    skills: [['slam', 1]], look: { sprite: 'golem' },
  },
  moss_golem: {
    name: '이끼 골렘', short: '이끼', tier: 'normal', hp: 165, atk: 71, def: 8, spd: 9, crit: 0.05, eva: 0.04,
    stance: { rock: 30, scissors: 20, paper: 50 }, patterns: ['excited'],
    skills: [['slam', 1], ['vine', 1]], look: { sprite: 'golem', tint: [0.8, 1.15, 0.75] },
  },
  rubble_golem: {
    name: '돌 부스러기', short: '부스러기', tier: 'normal', hp: 90, atk: 46, def: 8, spd: 6, crit: 0.05, eva: 0.02,
    stance: { rock: 70, scissors: 15, paper: 15 }, patterns: [],
    skills: [['slam', 1]], look: { sprite: 'golem', tint: [0.72, 0.72, 0.78] },
  },
  // ── 프롤로그
  rival_kid: {
    name: '마을 친구 도담', short: '도담', tier: 'normal', hp: 70, atk: 16, def: 4, spd: 8, crit: 0.03, eva: 0.02,
    stance: { rock: 34, scissors: 33, paper: 33 }, patterns: [],
    skills: [['slam', 1]], look: { sprite: 'c_recruit', flip: true },
  },
  shadow: {
    name: '흑수 그림자', short: '그림자', tier: 'normal', hp: 80, atk: 30, def: 6, spd: 9, crit: 0.05, eva: 0.04,
    stance: { rock: 40, scissors: 30, paper: 30 }, patterns: [],
    skills: [['slam', 1]], look: { sprite: 'golem', tint: [0.55, 0.4, 0.75] },
  },
  bel: {
    name: '검지 벨', short: '벨', tier: 'boss', hp: 520, atk: 40, def: 10, spd: 11, crit: 0.08, eva: 0.04,
    resist: { stun: 0.6, confuse: 0.5 },
    look: { sprite: 'c_deserter', flip: true, tint: [0.7, 0.6, 0.85] },
    phases: [
      { hpBelow: 1.01, stance: { rock: 30, scissors: 50, paper: 20 }, patterns: ['read'], hidden: ['rock', 'paper'],
        skills: [['slam', 2], ['petrify', 1]], line: '지목한다.' },
    ],
  },
  warden: {
    name: '굳은 파수꾼', short: '파수꾼', tier: 'elite', hp: 620, atk: 81, def: 14, spd: 9, crit: 0.08, eva: 0.03,
    stance: { rock: 45, scissors: 35, paper: 20 }, patterns: ['read'],
    skills: [['slam', 3], ['sweep', 1]], look: { sprite: 'golem', scale: 2, tint: [1.05, 0.88, 0.72] },
  },
  urs_king: {
    name: '반석왕 우르', short: '반석왕', tier: 'boss', hp: 1330, atk: 88, def: 16, spd: 10, crit: 0.08, eva: 0.02,
    resist: { stun: 0.7, confuse: 0.5, bleed: 0.3 },
    look: { sprite: 'boss_urs' },
    // hpBelow: HP 비율이 이 아래로 내려가면 이 페이즈로 넘어간다
    phases: [
      { hpBelow: 1.01, stance: { rock: 60, scissors: 20, paper: 20 }, patterns: ['stubborn'], hidden: ['scissors', 'paper'],
        skills: [['hammer', 3], ['quake', 1]], line: '굳어 버린 손은 바뀌지 않는다. 나는 언제나 바위를 낸다.' },
      { hpBelow: 0.6, stance: { rock: 50, scissors: 35, paper: 15 }, patterns: ['anger'], hidden: ['paper'], fateDrain: 30,
        skills: [['hammer', 3], ['quake', 1], ['petrify', 2]], line: '이 손이… 멈추지 않는다! 흑수여, 더 가져가라!' },
      { hpBelow: 0.3, stance: { rock: 40, scissors: 40, paper: 20 }, patterns: ['foretell'], truth: 0.7, hidden: ['rock', 'scissors', 'paper'], fateDrain: 20,
        skills: [['hammer', 3], ['quake', 2], ['petrify', 1], ['roar', 1]], line: '다음 손을 알려 주마. 믿을지는… 너희 운에 달렸다.' },
    ],
  },
};

// 조우 (전투 시험용). pos: 화면 위치(발 기준이 아니라 그림 왼쪽 위)
export const ENCOUNTERS = {
  normal: { name: '산길의 골렘들', desc: '일반 전투 · 목표 전멸 확률 3~5%', canFlee: true,
    enemies: [['stone_golem', 20, 108], ['moss_golem', 98, 92], ['stone_golem', 172, 112]] },
  elite: { name: '굳은 파수꾼', desc: '강적 · 목표 전멸 확률 15~20%', canFlee: true,
    enemies: [['warden', 36, 50], ['stone_golem', 176, 112]] },
  boss: { name: '반석왕 우르', desc: '보스 · 목표 첫 도전 승률 25~35%', canFlee: false,
    enemies: [['rubble_golem', 4, 112], ['urs_king', 46, 46], ['rubble_golem', 170, 114]] },
};
