// 주인공·이야기 동료·뽑기 동료
// hand: 손 성향 (rock / scissors / paper / balanced)
import { RARITY_MULT } from './rarity.js';

// 주인공과 이야기 동료 (1장 적정 수준, 영웅 등급으로 무료 합류)
export const HEROES = {
  iro:    { name: '이로', rarity: 'E', story: true, hand: 'balanced', hp: 150, mp: 30, atk: 28, def: 12, spd: 12, crit: 0.08, eva: 0.05, skills: ['punch', 'cheonbung', 'fate_fist'], row: 'front', look: { sprite: 'iro' } },
  museoe: { name: '무쇠', rarity: 'E', story: true, hand: 'rock',     hp: 200, mp: 20, atk: 22, def: 20, spd: 7,  crit: 0.05, eva: 0.02, skills: ['mace', 'shield_bash', 'iron_fist'], row: 'front', look: { sprite: 'museoe' } },
  serin:  { name: '세린', rarity: 'E', story: true, hand: 'scissors', hp: 115, mp: 24, atk: 27, def: 9,  spd: 16, crit: 0.18, eva: 0.10, skills: ['knife', 'twin_slash', 'dice'], row: 'back', look: { sprite: 'serin' } },
  haram:  { name: '하람', rarity: 'E', story: true, hand: 'paper',    hp: 105, mp: 40, atk: 24, def: 9,  spd: 11, crit: 0.05, eva: 0.05, skills: ['talisman', 'foresight', 'heal', 'paper_storm'], row: 'back', look: { sprite: 'haram' } },
};

// 뽑기 동료 30명. 역할(role)에 따라 능력치와 스킬이 정해지고, 등급 배율이 곱해진다.
// 그림: DRAWN 목록은 픽셀랩 그림, 나머지는 이야기 동료 그림에 색을 입힌 임시 모습
const ROLE = {
  tank:      { hp: 190, mp: 18, atk: 21, def: 20, spd: 7,  crit: 0.05, eva: 0.02, row: 'front', sprite: 'museoe' },
  healer:    { hp: 108, mp: 40, atk: 21, def: 10, spd: 10, crit: 0.05, eva: 0.05, row: 'back',  sprite: 'haram' },
  dps:       { hp: 120, mp: 24, atk: 29, def: 10, spd: 13, crit: 0.12, eva: 0.06, row: 'front', sprite: 'iro' },
  ranged:    { hp: 110, mp: 26, atk: 27, def: 9,  spd: 14, crit: 0.12, eva: 0.08, row: 'back',  sprite: 'serin' },
  mage:      { hp: 104, mp: 42, atk: 28, def: 9,  spd: 11, crit: 0.06, eva: 0.05, row: 'back',  sprite: 'haram' },
  support:   { hp: 118, mp: 36, atk: 23, def: 11, spd: 12, crit: 0.06, eva: 0.06, row: 'back',  sprite: 'haram' },
  trickster: { hp: 115, mp: 30, atk: 25, def: 10, spd: 15, crit: 0.15, eva: 0.10, row: 'back',  sprite: 'serin' },
  summoner:  { hp: 150, mp: 28, atk: 25, def: 14, spd: 9,  crit: 0.06, eva: 0.04, row: 'front', sprite: 'museoe' },
};
const ROLE_KO = { tank: '방어', healer: '회복', dps: '공격', ranged: '원거리', mage: '마법', support: '지원', trickster: '도박', summoner: '소환' };
export { ROLE_KO };

function roleSkills(role, hand, rarity) {
  const basic = { tank: 'mace', healer: 'talisman', dps: hand === 'scissors' ? 'knife' : 'punch', ranged: 'knife', mage: 'talisman', support: 'talisman', trickster: 'knife', summoner: 'mace' }[role];
  const main = {
    tank: ['shield_bash'], healer: ['heal'], mage: ['paper_storm'], support: ['foresight', 'heal'], trickster: ['dice', 'foresight'], summoner: ['iron_fist'],
    dps: [{ rock: 'iron_fist', scissors: 'twin_slash', paper: 'job_paper', balanced: 'fate_fist' }[hand]],
    ranged: [{ rock: 'job_balance_r', scissors: 'dice', paper: 'job_paper', balanced: 'job_balance_r' }[hand]],
  }[role];
  const extra = [];
  // 영웅 이상은 손 성향 스킬 하나 더, 전설·신화는 강한 것으로
  const tier = { E: 'e', L: 'l', M: 'l' }[rarity];
  if (tier) extra.push(hand === 'balanced' ? (rarity === 'M' ? 'job_fate' : 'job_balance_r') : `job_${hand}_${tier}`);
  return [basic, ...main, ...extra];
}

// [id, 이름, 등급, 손, 역할, 한 줄 소개, 색 tint]
const LIST = [
  ['guard', '마을 경비병', 'N', 'rock', 'tank', '가죽 모자에 창 한 자루. 성실함이 무기.', [0.9, 0.85, 0.75]],
  ['herbalist', '떠돌이 약장수', 'N', 'paper', 'healer', '밀짚모자와 약초 바구니.', [0.85, 1.05, 0.8]],
  ['fisher', '견습 어부', 'N', 'scissors', 'ranged', '그물과 생선칼을 든 소년.', [0.8, 0.95, 1.1]],
  ['courier', '우편 소녀', 'N', 'paper', 'support', '깃털 모자에 편지 가방.', [1.05, 0.95, 0.85]],
  ['woodboy', '나무꾼 소년', 'N', 'rock', 'dps', '작은 도끼와 코에 붙인 반창고.', [1.0, 0.85, 0.7]],
  ['gambler', '떠돌이 도박꾼', 'N', 'scissors', 'trickster', '헐렁한 조끼, 손에는 늘 카드.', [0.9, 0.9, 0.9]],
  ['miner', '반석국 광부', 'U', 'rock', 'tank', '헬멧 등불과 곡괭이, 얼굴엔 검댕.', [0.8, 0.8, 0.7]],
  ['pickpocket', '쌍검령 소매치기', 'U', 'scissors', 'ranged', '두건과 단검, 주머니가 잔뜩.', [0.75, 0.9, 0.95]],
  ['acolyte', '구름 수련생', 'U', 'paper', 'healer', '하얀 법의와 염주.', [1.05, 1.05, 1.1]],
  ['archer', '대나무 궁수', 'U', 'scissors', 'ranged', '대나무 활과 초록 하카마.', [0.8, 1.1, 0.8]],
  ['teahouse', '찻집 종업원', 'U', 'paper', 'support', '찻쟁반을 방패처럼 든다.', [1.1, 0.95, 0.9]],
  ['recruit', '방패 신병', 'U', 'rock', 'tank', '몸보다 큰 방패, 긴장한 얼굴.', [0.85, 0.9, 1.0]],
  ['dancer', '거리의 무희', 'U', 'balanced', 'support', '리본과 방울, 화려한 띠.', [1.15, 0.85, 1.0]],
  ['priestess', '구름 신관', 'R', 'paper', 'healer', '겹겹의 면사포와 떠다니는 종이.', [1.0, 1.0, 1.15]],
  ['deserter', '흑수 탈영병', 'R', 'balanced', 'dps', '깨진 검은 갑옷, 보랏빛 흉터.', [0.75, 0.65, 0.9]],
  ['ronin', '쌍검 낭인', 'R', 'scissors', 'dps', '해진 하오리와 두 자루 카타나.', [0.8, 0.8, 1.0]],
  ['tamer', '골렘 조련사', 'R', 'rock', 'summoner', '작은 돌골렘 펫과 고글.', [0.95, 0.9, 0.75]],
  ['seer', '점쟁이', 'R', 'paper', 'trickster', '수정 구슬과 별무늬 숄.', [0.9, 0.8, 1.15]],
  ['kiterider', '연 타는 소녀', 'R', 'paper', 'ranged', '고글과 커다란 종이 연.', [1.1, 1.0, 0.85]],
  ['smith', '대장장이의 딸', 'R', 'rock', 'dps', '큰 망치와 앞치마, 빛나는 집게.', [1.15, 0.85, 0.7]],
  ['giantgirl', '반석 거인 소녀', 'E', 'rock', 'tank', '바위판 팔에 꽃 화관. 키가 크다.', [0.95, 0.9, 0.8]],
  ['lantern', '홍등 무희', 'E', 'scissors', 'dps', '붉은 등롱과 부채 칼날.', [1.2, 0.8, 0.8]],
  ['dealer', '주사위 카지노 딜러', 'E', 'balanced', 'trickster', '정장 조끼와 떠다니는 거대 주사위.', [0.9, 0.9, 1.05]],
  ['stormmaiden', '폭풍 무녀', 'E', 'paper', 'mage', '번개 부적과 바람에 날리는 머리.', [0.9, 1.0, 1.2]],
  ['masked', '가면 검객', 'E', 'scissors', 'dps', '하얀 가면과 긴 목도리, 가는 칼.', [0.95, 0.95, 0.95]],
  ['apostle_ban', '반신의 사도', 'L', 'rock', 'tank', '돌의 후광과 황금 바위 건틀릿.', [1.15, 1.05, 0.75]],
  ['apostle_jeol', '절신의 사도', 'L', 'scissors', 'dps', '주위를 도는 수정 칼날, 청록 날개.', [0.8, 1.1, 1.2]],
  ['apostle_po', '포신의 사도', 'L', 'paper', 'healer', '흐르는 천 날개와 떠다니는 두루마리.', [1.15, 1.1, 1.15]],
  ['yeon', '연', 'M', 'balanced', 'support', '300년 전의 사람. 가장자리가 희미하게 바랜 흰 금빛 옷.', [1.2, 1.15, 1.05]],
  ['raun_true', '라운 (진짜 모습)', 'M', 'balanced', 'trickster', '별이 박힌 머리카락과 운명 주사위 왕관.', [1.15, 1.0, 1.2]],
];

// 픽셀랩으로 그린 동료 (assets/pixellab/companions/<id>.png). 없는 동료는 임시 모습을 쓴다.
export const DRAWN = ['yeon', 'raun_true', 'apostle_ban', 'apostle_jeol', 'apostle_po', 'giantgirl', 'lantern', 'dealer', 'stormmaiden', 'masked',
  'priestess', 'deserter', 'ronin', 'tamer', 'seer', 'smith', 'teahouse', 'dancer', 'pickpocket', 'archer', 'acolyte', 'recruit'];

export const COMPANIONS = Object.fromEntries(LIST.map(([id, name, rarity, hand, role, desc, tint]) => {
  const b = ROLE[role], m = RARITY_MULT[rarity];
  const r = v => Math.round(v * m);
  return [id, {
    name, rarity, hand, role, desc, gacha: true,
    hp: r(b.hp), mp: b.mp, atk: r(b.atk), def: r(b.def), spd: b.spd + (rarity === 'M' ? 2 : rarity === 'L' ? 1 : 0),
    crit: b.crit, eva: b.eva, row: b.row, skills: roleSkills(role, hand, rarity), look: DRAWN.includes(id) ? { sprite: 'c_' + id } : { sprite: b.sprite, tint },
  }];
}));

// 이로를 포함한 모든 아군 정의
export const ALL_UNITS = { ...HEROES, ...COMPANIONS };

// 기본 파티 배치: 앞줄 2명, 뒷줄 2명
export const DEFAULT_PARTY = [
  { id: 'museoe', row: 'front' },
  { id: 'iro', row: 'front' },
  { id: 'serin', row: 'back' },
  { id: 'haram', row: 'back' },
];
