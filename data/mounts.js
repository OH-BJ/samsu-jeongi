// 탈것 15종. 효과는 주로 노드 지도 위에서 (M5에서 지도와 연결). 전투에는 도주·선공만 영향
// effect: flee(도주 +), firstStrike(선공 확률 +), reveal(앞 노드 공개 칸 수), skip(장당 노드 건너뛰기),
//         mapAll(지도 전체 공개), pickStones(이동 중 운명석 줍기), reroll(노드 결과 다시 굴리기)
export const MOUNTS = {
  donkey:     { name: '당나귀', rarity: 'N', effect: { flee: 0.05 }, desc: '느리지만 고집 있게 도망친다. 도주 +5%' },
  ox:         { name: '짐소', rarity: 'N', effect: { flee: 0.05 }, desc: '짐을 많이 싣는다. 도주 +5%' },
  pony:       { name: '조랑말', rarity: 'N', effect: { flee: 0.07 }, desc: '작고 날쌔다. 도주 +7%' },
  horse:      { name: '말', rarity: 'U', effect: { reveal: 1 }, desc: '다음 노드 종류 1칸 공개' },
  goose:      { name: '큰 거위', rarity: 'U', effect: { reveal: 1, flee: 0.05 }, desc: '시끄럽다. 1칸 공개, 도주 +5%' },
  boar:       { name: '멧돼지', rarity: 'U', effect: { firstStrike: 0.08 }, desc: '들이받는다. 선공 확률 +8%' },
  warhorse:   { name: '전투마', rarity: 'R', effect: { firstStrike: 0.15, reveal: 2 }, desc: '선공 확률 +15%, 2칸 공개' },
  wolf:       { name: '회색 늑대', rarity: 'R', effect: { firstStrike: 0.15, reveal: 2 }, desc: '냄새로 길을 찾는다. 선공 +15%, 2칸 공개' },
  ostrich:    { name: '사막 타조', rarity: 'R', effect: { flee: 0.2, reveal: 2 }, desc: '도주 +20%, 2칸 공개' },
  griffin:    { name: '그리핀', rarity: 'E', effect: { skip: 1, reveal: 2 }, desc: '노드 1칸 건너뛰기 (장당 1회)' },
  stonebear:  { name: '반석 곰', rarity: 'E', effect: { firstStrike: 0.25, reveal: 2 }, desc: '선공 확률 +25%' },
  cloudwhale: { name: '아기 구름고래', rarity: 'L', effect: { mapAll: true, pickStones: true }, desc: '지도 전체 공개 + 이동 중 운명석 줍기' },
  firekirin:  { name: '화염 기린', rarity: 'L', effect: { mapAll: true, firstStrike: 0.2 }, desc: '지도 전체 공개 + 선공 +20%' },
  paperdragon:{ name: '종이 용', rarity: 'L', effect: { mapAll: true, skip: 1 }, desc: '지도 전체 공개 + 노드 1칸 건너뛰기' },
  dicedragon: { name: '주사위 용', rarity: 'M', effect: { mapAll: true, reroll: 1, pickStones: true }, desc: '노드 결과를 한 번 다시 굴린다 + 지도 전체 공개' },
};
