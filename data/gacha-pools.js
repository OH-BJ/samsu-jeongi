// 운명의 우물 (뽑기). 확률은 전부 게임 안에 공개한다. 단위: %
// pity: { E: 영웅 이상 확정까지, L: 전설 이상 확정까지 } — 우물마다 따로 센다
export const WELLS = {
  equip: {
    name: '장비 우물', kind: 'equip', desc: '무기 · 방어구 · 장신구',
    rates: { N: 62, U: 25, R: 9.5, E: 2.9, L: 0.5, M: 0.09, X: 0.01 },
    pity: { E: 60, L: 250 },
  },
  companion: {
    name: '동료 우물', kind: 'companion', desc: '함께 싸울 동료 (중복은 돌파)',
    rates: { N: 58, U: 27, R: 11, E: 3.5, L: 0.45, M: 0.05 },
    pity: { E: 60, L: 200 },
  },
  job: {
    name: '천직 의식', kind: 'job', desc: '이로의 직업 (전직 의식권 사용)',
    rates: { N: 55, U: 28, R: 12, E: 4.3, L: 0.65, M: 0.05 },
    pity: { E: 60, L: 80 }, ticket: 'jobTicket',
  },
  mount: {
    name: '탈것 우물', kind: 'mount', desc: '지도 위에서 도움을 주는 탈것',
    rates: { N: 64, U: 24, R: 9, E: 2.6, L: 0.38, M: 0.02 },
    pity: { E: 60, L: 150 },
  },
};

export const PULL_COST = 1;          // 운명석 1개 = 1회, 10연차 = 10개
export const TEN_PULL_GUARANTEE = 'R'; // 10번째 칸은 희귀 이상
export const SHARDS_PER_PULL = 1;    // 운명의 조각
export const SHARD_EXCHANGE = 1000;  // 조각 1,000개 = 신화 선택권

// 픽업 (4장부터 장마다 교체): 같은 등급 안에서 지정 대상 50%, 놓치면 다음은 확정
export const PICKUP_RATE = 0.5;

// 중복 보상: 동료는 돌파(최대 5), 그 뒤와 탈것·직업 중복은 조각으로
export const DUPLICATE_SHARDS = { N: 2, U: 5, R: 15, E: 40, L: 120, M: 400, X: 600 };
export const MAX_BREAKTHROUGH = 5;
