// 천직: 이로의 직업 (20종). hand = 손 성향, bonus = 능력치 보정(비율), skill = 직업 스킬
// 일반 천직도 끝까지 쓸 수 있게 각성 경로를 둔다 (후반 퀘스트, M7)
export const JOBS = {
  // N
  apprentice: { name: '견습 수투사', rarity: 'N', hand: 'balanced', bonus: {}, skill: 'job_balance', desc: '모든 것의 시작. 이로의 첫 직업.' },
  woodcutter: { name: '나무꾼', rarity: 'N', hand: 'rock', bonus: { hp: 0.05, atk: 0.03 }, skill: 'job_rock', desc: '도끼질로 다져진 팔.' },
  tailor:     { name: '재단사', rarity: 'N', hand: 'scissors', bonus: { spd: 1, crit: 0.02 }, skill: 'job_scissors', desc: '가위질 하나는 대륙 최고.' },
  postman:    { name: '우편부', rarity: 'N', hand: 'paper', bonus: { spd: 2 }, skill: 'job_paper', desc: '편지는 반드시 전한다.' },
  wanderer:   { name: '떠돌이', rarity: 'N', hand: 'balanced', bonus: { eva: 0.03 }, skill: 'job_balance', desc: '어디에도 속하지 않는다.' },
  // U
  brawler:    { name: '격투가', rarity: 'U', hand: 'rock', bonus: { atk: 0.08, hp: 0.05 }, skill: 'job_rock', desc: '주먹으로 말한다.' },
  swordsman:  { name: '검사', rarity: 'U', hand: 'scissors', bonus: { atk: 0.08, crit: 0.03 }, skill: 'job_scissors', desc: '한 자루 검에 모든 것을 건다.' },
  mage:       { name: '견습 마법사', rarity: 'U', hand: 'paper', bonus: { atk: 0.06, mp: 0.2 }, skill: 'job_paper', desc: '종이 부적을 접어 날린다.' },
  hunter:     { name: '사냥꾼', rarity: 'U', hand: 'scissors', bonus: { spd: 2, crit: 0.04 }, skill: 'job_scissors', desc: '숲의 그림자.' },
  // R
  paladin:    { name: '성기사', rarity: 'R', hand: 'rock', bonus: { hp: 0.15, def: 0.15 }, skill: 'job_rock_r', desc: '바위신의 축복을 받은 방패.' },
  dualblade:  { name: '쌍검사', rarity: 'R', hand: 'scissors', bonus: { atk: 0.12, spd: 2 }, skill: 'job_scissors_r', desc: '두 칼날이 동시에 춤춘다.' },
  astrologer: { name: '점성술사', rarity: 'R', hand: 'paper', bonus: { atk: 0.1, eva: 0.04 }, skill: 'job_paper_r', desc: '별의 흐름을 읽는다.' },
  bard:       { name: '음유시인', rarity: 'R', hand: 'balanced', bonus: { hp: 0.08, atk: 0.08 }, skill: 'job_balance_r', desc: '노래로 운을 부른다.' },
  // E
  guardian:   { name: '철벽 수호자', rarity: 'E', hand: 'rock', bonus: { hp: 0.25, def: 0.25 }, skill: 'job_rock_e', desc: '어떤 바위도 뚫지 못하는 벽.' },
  bladedancer:{ name: '칼날 무희', rarity: 'E', hand: 'scissors', bonus: { atk: 0.18, spd: 3, crit: 0.05 }, skill: 'job_scissors_e', desc: '춤이 곧 검무다.' },
  cloudmage:  { name: '구름술사', rarity: 'E', hand: 'paper', bonus: { atk: 0.16, mp: 0.3 }, skill: 'job_paper_e', desc: '구름을 접어 폭풍을 만든다.' },
  // L
  fistsaint:  { name: '권성', rarity: 'L', hand: 'rock', bonus: { atk: 0.25, hp: 0.2 }, skill: 'job_rock_l', desc: '주먹의 성인. 바위신의 정통 계승자.' },
  swordsaint: { name: '검성', rarity: 'L', hand: 'scissors', bonus: { atk: 0.28, crit: 0.08 }, skill: 'job_scissors_l', desc: '베지 못할 것은 없다.' },
  sage:       { name: '천포 현자', rarity: 'L', hand: 'paper', bonus: { atk: 0.22, mp: 0.5, eva: 0.05 }, skill: 'job_paper_l', desc: '하늘을 감싸는 종이의 현자.' },
  // M
  fateweaver: { name: '운명술사', rarity: 'M', hand: 'balanced', bonus: { atk: 0.25, hp: 0.25, crit: 0.05 }, skill: 'job_fate', desc: '확률을 손끝으로 엮는다.' },
};
