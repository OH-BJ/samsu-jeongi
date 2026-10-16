// 장비: 무기 / 방어구 / 장신구. 등급에 따라 기본치와 옵션 줄 수가 정해진다.
export const SLOTS = ['weapon', 'armor', 'accessory'];
export const SLOT_KO = { weapon: '무기', armor: '방어구', accessory: '장신구' };

// R 등급 기준 기본치 (등급 배율 RARITY_MULT가 곱해진다)
// (시뮬레이터: 처음 값의 1/4로 줄였다. 장비 50회만 뽑아도 보스 승률 99%가 되어서)
export const BASE = {
  weapon: { atk: 3 },
  armor: { def: 2, hp: 8 },
  accessory: { spd: 1, crit: 0.01, luck: 2 },
};

// 등급별 랜덤 옵션 줄 수 [최소, 최대], 고유 옵션 수
export const OPTION_LINES = { N: [0, 1], U: [1, 1], R: [2, 2], E: [3, 3], L: [3, 3], M: [4, 4], X: [4, 4] };
export const UNIQUE_COUNT = { L: 1, M: 1, X: 2 };

// 이름 짓기: 등급별 앞말 + 부위별 이름
const PREFIX = {
  N: ['낡은', '쇠', '가죽', '나무'], U: ['단단한', '청동', '날렵한', '질긴'], R: ['청강', '은빛', '수련자의', '바람결'],
  E: ['자수정', '영웅의', '폭풍', '진홍'], L: ['반석왕의', '검성의', '천포의', '금빛 신의'], M: ['흑수의', '연의', '운명의'], X: ['초월한', '결정된'],
};
const NOUN = {
  weapon: ['건틀릿', '검', '지팡이', '철퇴', '쌍단검', '부채'],
  armor: ['조끼', '도복', '비늘갑옷', '법의', '흉갑'],
  accessory: ['반지', '부적', '목걸이', '방울', '주사위'],
};
export const nameFor = (slot, rarity, rng) => `${rng.pick(PREFIX[rarity])} ${rng.pick(NOUN[slot])}`;

// 고유 옵션: 전설 이상에만 붙는 특별한 효과 (여러 옵션을 강하게 묶은 것)
export const UNIQUES = {
  rock_quake:   { name: '대지 진동', text: '바위로 이기면 피해 +20%, 방어력 +6%', opts: { win_rock: 20, def_pct: 6 } },
  blade_wind:   { name: '칼바람', text: '가위로 이기면 피해 +20%, 치명타율 +4%', opts: { win_scissors: 20, crit: 4 } },
  paper_veil:   { name: '종이 장막', text: '보로 이기면 피해 +20%, 회피율 +4%', opts: { win_paper: 20, eva: 4 } },
  lucky_star:   { name: '행운의 별', text: '비기면 8% 확률로 승리, 행운 +8', opts: { draw_to_win: 8, luck: 8 } },
  second_wind:  { name: '두 번째 숨', text: '지면 7% 확률로 무승부, 패배 시 피해 -8%', opts: { lose_to_draw: 7, lose_dmg: 8 } },
  chain_heart:  { name: '이어지는 심장', text: '연승이 끊길 때 18% 확률로 유지', opts: { streak_keep: 18 } },
  fate_spring:  { name: '운명의 샘', text: '운명 게이지 획득량 +30%', opts: { fate_gain: 30 } },
};

// 장비 아이콘 (지금은 무기 = 건틀릿 그림만 있다. 나머지는 등급색 도형으로 임시 표시)
export const WEAPON_ICON_ROW = { N: 0, U: 0, R: 1, E: 2, L: 3, M: 4, X: 4 };
