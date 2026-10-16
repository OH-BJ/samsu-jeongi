// ENDESGA 32 (https://lospec.com/palette-list/endesga-32) + 등급 연출용 보조색
// 도트 데이터에서는 글자 하나가 색 하나를 뜻한다. '.' 은 투명.
export const PALETTE = {
  // 어둠·회색 계열
  K: '#181425', // 외곽선 (순수 검정 대신)
  k: '#262b44',
  n: '#3a4466',
  g: '#5a6988',
  G: '#8b9bb4',
  l: '#c0cbdc',
  W: '#ffffff',
  // 갈색·피부
  B: '#3e2731',
  b: '#733e39',
  o: '#b86f50',
  Q: '#c28569', // 피부 그림자
  s: '#e4a672',
  q: '#e8b796', // 피부 기본
  S: '#ead4aa', // 피부·천 밝은 부분
  // 빨강·주황·노랑
  R: '#a22633',
  r: '#e43b44',
  m: '#f6757a',
  x: '#ff0044',
  e: '#be4a2f',
  d: '#d77643',
  O: '#f77622',
  y: '#feae34',
  Y: '#fee761',
  // 초록
  J: '#193c3e',
  j: '#265c42',
  H: '#3e8948',
  h: '#63c74d',
  // 파랑·청록
  u: '#124e89',
  U: '#0099db',
  C: '#2ce8f5',
  // 보라·분홍
  p: '#68386c',
  P: '#b55088',
  // ── 보조색 (ENDESGA 32 밖, 등급 연출 전용) ──
  '1': '#fff4b8', // 전설 금빛 하이라이트
  '2': '#ffd23f', // 전설 금
  '3': '#c98a1b', // 전설 금 그림자
  '4': '#ff6b9a', // 신화 진홍 하이라이트
  '5': '#d6004c', // 신화 진홍
  '6': '#7a0030', // 신화 진홍 그림자
  '7': '#c9a0ff', // 영웅 보라 하이라이트
  '8': '#8f5bd6', // 영웅 보라
  // ── 보조색: 애니풍 밝은 피부 + 홍조 (레퍼런스 분석 결과) ──
  f: '#fff3ec', // 피부 하이라이트
  i: '#fde0d3', // 피부 기본
  v: '#f2b9ac', // 피부 그늘
  z: '#d98f88', // 피부 깊은 그늘·입선
  w: '#ff8fa8', // 홍조·입 안
};

export const BASE_KEYS = 'KkngGlWBboQsqSRrmxedOyYJjHhuUCpP'.split('');

// 외곽선 색 자동 선택용: 각 색의 "더 어두운 색" (셀렉티브 아웃라인)
export const DARKER = {
  W: 'l', l: 'G', G: 'g', g: 'n', n: 'k', k: 'K', K: 'K',
  S: 'q', q: 'Q', s: 'Q', Q: 'o', o: 'b', b: 'B', B: 'K',
  Y: 'y', y: 'O', O: 'e', d: 'e', e: 'b', m: 'r', r: 'R', R: 'B', x: 'R',
  h: 'H', H: 'j', j: 'J', J: 'K', C: 'U', U: 'u', u: 'k', P: 'p', p: 'B',
  '1': '2', '2': '3', '3': 'b', '4': '5', '5': '6', '6': 'B', '7': '8', '8': 'p',
};

export const RARITY = {
  N: { name: '일반', color: '#8b9bb4', glow: '#c0cbdc' },
  U: { name: '고급', color: '#63c74d', glow: '#a7f070' },
  R: { name: '희귀', color: '#0099db', glow: '#2ce8f5' },
  E: { name: '영웅', color: '#8f5bd6', glow: '#c9a0ff' },
  L: { name: '전설', color: '#ffd23f', glow: '#fff4b8' },
  M: { name: '신화', color: '#d6004c', glow: '#ff6b9a' },
  X: { name: '초월', color: '#ffffff', glow: 'rainbow' },
};
