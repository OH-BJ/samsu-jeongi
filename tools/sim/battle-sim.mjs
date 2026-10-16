// 전투 시뮬레이터: 조우마다 수천 번 자동으로 싸워서 전멸 확률·승률을 잰다
// 사용법: node tools/sim/battle-sim.mjs [횟수=3000] [조우=all|normal|elite|boss] [--gear=장비뽑기횟수(기본 20)]
// 「적정 장비」 = 장비 우물 20회를 뽑아 부위마다 가장 좋은 것을 낀 파티 (1장 보스 시점)
// 손은 운이다 (적의 자세를 보여 주지 않으므로 아무 손이나 낸다. 보스의 「예고」만 믿는다)
import { Battle, makeHeroFrom, makeEnemy } from '../../src/systems/battle/battle.js';
import { newGameData } from '../../src/core/save.js';
import { pull } from '../../src/systems/gacha.js';
import { unitBuild } from '../../src/systems/party.js';
import { rank } from '../../data/rarity.js';
import { autoController } from '../../src/systems/battle/auto.js';
import { createRng } from '../../src/core/rng.js';
import { ENCOUNTERS } from '../../data/enemies.js';

const N = +process.argv[2] || 3000;
const which = process.argv[3] && process.argv[3] !== 'all' && !process.argv[3].startsWith('--') ? [process.argv[3]] : Object.keys(ENCOUNTERS);
const GEAR = +(process.argv.find(a => a.startsWith('--gear='))?.split('=')[1] ?? 20);

// 장비 우물 n회 → 부위마다 가장 좋은 장비를 낀 파티
export function gearedParty(seed, n = GEAR) {
  const d = newGameData(seed), rng = createRng(seed * 7 + 1);
  if (n) pull(d, 'equip', n, rng);
  const used = new Set();
  for (const m of d.party) for (const slot of ['weapon', 'armor', 'accessory']) {
    const best = d.inventory.filter(i => i.slot === slot && !used.has(i.uid)).sort((a, b) => rank(b.rarity) - rank(a.rarity))[0];
    if (best) { used.add(best.uid); (d.equip[m.id] ||= {})[slot] = best.uid; }
  }
  return d.party.map(m => makeHeroFrom(unitBuild(d, m.id), m.row));
}
console.log(`장비: 장비 우물 ${GEAR}회분`);

for (const key of which) {
  const enc = ENCOUNTERS[key];
  let win = 0, lose = 0, fled = 0, rounds = 0, hpLeft = 0, clashes = 0, wins = 0, fate = 0, timeout = 0;
  for (let i = 0; i < N; i++) {
    const rng = createRng(1000 + i);
    const party = gearedParty(i);
    const enemies = enc.enemies.map(([id]) => makeEnemy(id));
    const b = new Battle({ party, enemies, rng, canFlee: false });
    const ctrl = autoController(createRng(5000 + i));
    // 무한 전투 방지
    const ev = ctrl.event;
    ctrl.event = e => { if (e.type === 'round' && e.round > 60) { b.result = 'lose'; timeout++; } return ev(e); };
    const r = await b.run(ctrl);
    if (r === 'win') { win++; hpLeft += party.reduce((a, p) => a + p.hp, 0) / party.reduce((a, p) => a + p.maxHp, 0); }
    else if (r === 'lose') lose++; else fled++;
    rounds += b.round; clashes += b.stats.clashes; wins += b.stats.wins; fate += b.stats.fateUsed;
  }
  const pct = v => (v / N * 100).toFixed(1) + '%';
  console.log(`[${key}] ${enc.name} — ${enc.desc}`);
  console.log(`  승리 ${pct(win)} · 전멸 ${pct(lose)}${timeout ? ` (60라운드 초과 ${timeout})` : ''} · 평균 ${(rounds / N).toFixed(1)}라운드 · 이긴 판 남은 HP ${win ? (hpLeft / win * 100).toFixed(0) : '-'}% · 합 승률 ${(wins / clashes * 100).toFixed(1)}% · 운명 사용 ${(fate / N).toFixed(2)}회`);
}
