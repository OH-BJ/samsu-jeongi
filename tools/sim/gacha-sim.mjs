// 뽑기·강화 시뮬레이터
// 사용법: node tools/sim/gacha-sim.mjs [플레이어 수=5000] [1인당 뽑기 횟수=800]
// - 우물마다 실제 등급 비율이 확률표와 맞는지, 천장이 제대로 도는지
// - 이야기 전체(약 700~900회)에서 전설·신화를 몇 개 얻는지
// - 강화 +10 / +15까지 평균 몇 번, 얼마나 드는지
import { createRng } from '../../src/core/rng.js';
import { pull, newPity } from '../../src/systems/gacha.js';
import { tryEnhance, enhanceCost } from '../../src/systems/enhance.js';
import { WELLS } from '../../data/gacha-pools.js';
import { RARITY_ORDER } from '../../data/rarity.js';

const PLAYERS = +process.argv[2] || 5000, PULLS = +process.argv[3] || 800;
const blank = () => ({ shards: 0, inventory: [], companions: {}, jobs: {}, mounts: {}, pity: {} });

console.log(`뽑기: 플레이어 ${PLAYERS}명 × ${PULLS}회 (10연차로)\n`);
for (const wellId of Object.keys(WELLS)) {
  const w = WELLS[wellId], counts = {}, hasM = { yes: 0 }, Ls = [];
  let pityL = 0, total = 0;
  for (let p = 0; p < PLAYERS; p++) {
    const rng = createRng(77 + p), data = blank();
    let L = 0, M = 0;
    for (let i = 0; i < PULLS / 10; i++) {
      const before = data.pity[wellId]?.L ?? 0;
      for (const r of pull(data, wellId, 10, rng)) {
        counts[r.rarity] = (counts[r.rarity] || 0) + 1; total++;
        if (r.rarity === 'L') L++;
        if (r.rarity === 'M' || r.rarity === 'X') M++;
      }
      if (before + 10 >= w.pity.L && data.pity[wellId].L < 10) pityL++;
    }
    data.inventory.length = 0;
    Ls.push(L); if (M) hasM.yes++;
  }
  const avgL = Ls.reduce((a, v) => a + v, 0) / PLAYERS;
  Ls.sort((a, b) => a - b);
  console.log(`[${w.name}]`);
  console.log('  등급 비율 (실제 / 표):', RARITY_ORDER.filter(r => w.rates[r] !== undefined).map(r => `${r} ${(100 * (counts[r] || 0) / total).toFixed(r === 'M' || r === 'X' ? 3 : 2)}/${w.rates[r]}`).join('  '));
  console.log(`  ${PULLS}회 동안 전설: 평균 ${avgL.toFixed(2)}개 (하위 10% ${Ls[Math.floor(PLAYERS * 0.1)]}개 · 상위 10% ${Ls[Math.floor(PLAYERS * 0.9)]}개)`);
  console.log(`  신화 이상을 하나라도 얻을 확률: ${(100 * hasM.yes / PLAYERS).toFixed(1)}%\n`);
}

// 강화
console.log('강화 (보호 부적 없이 / 매번 보호 부적):');
for (const target of [10, 15]) {
  for (const protect of [false, true]) {
    let tries = 0, gold = 0, stones = 0, charms = 0;
    const N = 2000;
    for (let p = 0; p < N; p++) {
      const rng = createRng(900 + p), item = { rarity: 'R', plus: 0, fails: 0 };
      while (item.plus < target) {
        const c = enhanceCost(item); gold += c.gold; stones += c.enhance; tries++;
        const useCharm = protect && item.plus >= 9;
        const r = tryEnhance(item, rng, { protect: useCharm });
        if (useCharm && r === 'protected') charms++;
      }
    }
    console.log(`  +${target} ${protect ? '보호 부적 사용' : '부적 없음'}: 평균 ${(tries / N).toFixed(0)}번 · 금화 ${(gold / N).toFixed(0)} · 강화석 ${(stones / N).toFixed(0)}${protect ? ` · 부적 ${(charms / N).toFixed(1)}장` : ''} (희귀 장비 기준)`);
  }
}
