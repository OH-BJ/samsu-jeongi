// 대사에 나오는 인물: 이름과 서 있는 모습 (side: 화면 오른쪽 = 아군 쪽, 왼쪽 = 상대 쪽)
// 아직 전용 그림이 없는 인물은 다른 그림을 빌려 쓴다 (임시)
export const SPEAKERS = {
  narr:     { name: null },
  iro:      { name: '이로', look: { sprite: 'iro' }, side: 'right' },
  museoe:   { name: '무쇠', look: { sprite: 'museoe' }, side: 'right' },
  serin:    { name: '세린', look: { sprite: 'serin' }, side: 'right' },
  haram:    { name: '하람', look: { sprite: 'haram' }, side: 'right' },
  grandma:  { name: '백소 할머니', look: { sprite: 'c_priestess', flip: true, tint: [0.95, 0.92, 0.9] }, side: 'left' },
  villager: { name: '마을 사람', look: { sprite: 'c_teahouse', flip: true }, side: 'left' },
  rival:    { name: '도담', look: { sprite: 'c_recruit', flip: true }, side: 'left' },
  raun:     { name: '라운', look: { sprite: 'c_raun_true', flip: true }, side: 'left' },
  bel:      { name: '검지 벨', look: { sprite: 'c_deserter', flip: true, tint: [0.7, 0.6, 0.85] }, side: 'left' },
  smith:    { name: '대장장이', look: { sprite: 'c_smith', flip: true }, side: 'left' },
  child:    { name: '노래하는 아이', look: { sprite: 'c_acolyte', flip: true }, side: 'left' },
  urs:      { name: '반석왕 우르', look: { sprite: 'boss_urs' }, side: 'left', big: true },
  museoe_l: { name: '무쇠', look: { sprite: 'museoe', flip: true }, side: 'left' },
};
