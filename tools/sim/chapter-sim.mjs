// 장 시뮬레이터: 새 게임처럼 이야기 보상(직업 1회, 희귀↑ 무기 1회, 동료 10회)을 받고
// 1장 지도를 처음부터 끝까지 자동으로 진행한다. HP는 노드 사이에 이어지고, 휴식·상점·보물도 반영한다.
// 사용법: node tools/sim/chapter-sim.mjs [횟수=500]
import { createRng } from '../../src/core/rng.js';
import { newGameData } from '../../src/core/save.js';
import { pull, freePull } from '../../src/systems/gacha.js';
import { unitBuild, autoFillParty, fixRows, healParty, fullHeal, hpOf } from '../../src/systems/party.js';
import { generateZone } from '../../src/systems/mapgen.js';
import { Battle, makeHeroFrom, makeEnemy } from '../../src/systems/battle/battle.js';
import { autoController } from '../../src/systems/battle/auto.js';
import { rollRewards } from '../../src/systems/economy.js';
import { encounter } from '../../data/encounters.js';
import * as PRO from '../../data/chapters/prologue.js';
import * as CH from '../../data/chapters/ch01.js';

const N = +process.argv[2] || 500;

async function fight(d, enc, rng, { solo = false } = {}) {
  const members = solo ? d.party.filter(p => p.id === 'iro') : d.party;
  const party = members.map(p => { const u = makeHeroFrom(unitBuild(d, p.id), p.row); u.hp = Math.max(1, Math.min(u.maxHp, d.hp[p.id] ?? u.maxHp)); return u; });
  const enemies = enc.enemies.map(([id]) => makeEnemy(id, 0, 0, enc.scale || 1));
  const b = new Battle({ party, enemies, rng, canFlee: false, items: d.items, endAtHp: enc.endAtHp || 0, fateStart: enc.fateStart || 0 });
  const c = autoController(rng); const ev = c.event; c.event = e => { if (e.type === 'round' && e.round > 60) b.result = 'lose'; return ev(e); };
  const r = await b.run(c);
  if (r === 'win') {
    for (const p of party) d.hp[p.id] = Math.max(1, p.hp);
    const rw = rollRewards(enemies, rng, { firstKill: d.progress.firstKill });
    d.gold += rw.gold; d.enhance += rw.enhance; d.stones += rw.stones; d.inventory.push(...rw.items);
  }
  return r;
}

// 부위마다 가장 좋은 장비를 낀다
function autoEquip(d) {
  const R = ['N', 'U', 'R', 'E', 'L', 'M', 'X'], used = new Set();
  d.equip = {};
  for (const m of d.party) for (const slot of ['weapon', 'armor', 'accessory']) {
    const best = d.inventory.filter(i => i.slot === slot && !used.has(i.uid)).sort((a, b) => R.indexOf(b.rarity) - R.indexOf(a.rarity))[0];
    if (best) { used.add(best.uid); (d.equip[m.id] ||= {})[slot] = best.uid; }
  }
}

const stats = { proLose: 0, wipes: [0, 0, 0], boss1st: 0, clear: 0, nodes: 0, bossTries: 0, stonesEnd: 0, goldEnd: 0 };
for (let run = 0; run < N; run++) {
  const d = newGameData(run * 13 + 7), rng = createRng(run * 31 + 5);
  // 프롤로그
  if ((await fight(d, PRO.ENCOUNTERS.tutorial, rng, { solo: true })) !== 'win') { /* 튜토리얼은 져도 된다 */ }
  pull(d, 'job', 1, rng); d.job = Object.keys(d.jobs).pop();
  const w = freePull(d, 'equip', 1, rng, { min: 'R', slot: 'weapon' })[0].item; d.equip.iro = { weapon: w.uid };
  fullHeal(d);
  let ok = false;
  for (let t = 0; t < 5 && !ok; t++) { fullHeal(d); ok = (await fight(d, PRO.ENCOUNTERS.shadows, rng, { solo: true })) === 'win'; if (!ok) stats.proLose++; }
  ok = false;
  for (let t = 0; t < 5 && !ok; t++) { fullHeal(d); ok = (await fight(d, PRO.ENCOUNTERS.bel, rng, { solo: true })) === 'win'; if (!ok) stats.proLose++; }
  d.stones += 20;
  // 1장 도착: 동료 10회 + 남은 운명석으로 장비 뽑기
  pull(d, 'companion', 10, rng); autoFillParty(d);
  if (d.stones >= 10) pull(d, 'equip', Math.floor(d.stones / 10) * 10, rng), d.stones %= 10;
  autoEquip(d); fullHeal(d);
  // 지도
  let zone = 0, firstBoss = true;
  while (zone < CH.ZONES.length) {
    const z = CH.ZONES[zone];
    if (zone === 1) { d.companions.museoe = 0; if (d.party.length < 4) d.party.push({ id: 'museoe', row: 'front' }); else d.party[d.party.length - 1] = { id: 'museoe', row: 'front' }; fixRows(d); autoEquip(d); }
    const map = generateZone(z, run * 977 + zone);
    let cur = map.nodes[0], guard = 0;
    while (guard++ < 400) {
      const opts = cur.next.map(id => map.nodes[id]);
      if (!opts.length) break;
      const low = d.party.some(p => hpOf(d, p.id) < unitBuild(d, p.id).stats.hp * 0.45);
      const nd = (low && opts.find(o => o.type === 'rest')) || rng.pick(opts);
      stats.nodes++;
      let lost = false;
      if (nd.type === 'battle' || nd.type === 'elite') {
        lost = (await fight(d, encounter('', rng.pick(nd.type === 'elite' ? z.elite : z.normal), { scale: z.scale || 1 }), rng)) !== 'win';
      } else if (nd.type === 'rest') healParty(d, 0.3);
      else if (nd.type === 'treasure') { d.gold += 115; if (rng.chance(0.4)) d.stones += 2; }
      else if (nd.type === 'shop') { while (d.gold >= 60 && (d.items.potion || 0) < 4) { d.gold -= 60; d.items.potion = (d.items.potion || 0) + 1; } }
      else if (nd.type === 'event') { if (rng.chance(0.3)) healParty(d, 0.3); }
      else if (nd.type === 'boss') {
        stats.bossTries++;
        lost = (await fight(d, CH.BOSS, rng)) !== 'win';
        if (!lost) { if (firstBoss) stats.boss1st++; stats.clear++; cur = nd; break; }
        firstBoss = false;
      }
      if (lost) {
        // 게임과 같다: 금화 20%를 잃고 마을에서 회복, 지도 위치는 진 노드 바로 앞
        stats.wipes[zone]++;
        d.gold = Math.floor(d.gold * 0.8); fullHeal(d);
        if (d.stones >= 10) { pull(d, 'equip', Math.floor(d.stones / 10) * 10, rng); d.stones %= 10; autoEquip(d); }
        continue;
      }
      cur = nd;
    }
    zone++;
    // 구역 사이에 마을에 들러 여관 (금화가 있으면)
    if (d.gold >= 50) { d.gold -= 50; fullHeal(d); }
    if (d.stones >= 10) { pull(d, 'equip', Math.floor(d.stones / 10) * 10, rng); d.stones %= 10; autoEquip(d); }
  }
  stats.stonesEnd += d.stones; stats.goldEnd += d.gold;
}
const pct = v => (v / N * 100).toFixed(1) + '%';
console.log(`1장 시뮬레이션 ${N}회`);
console.log(`  프롤로그 패배(다시 도전) 평균 ${(stats.proLose / N).toFixed(2)}번`);
console.log(`  구역별 전멸(1회 진행당 평균): 1구역 ${(stats.wipes[0] / N).toFixed(2)} · 2구역 ${(stats.wipes[1] / N).toFixed(2)} · 3구역 ${(stats.wipes[2] / N).toFixed(2)}`);
console.log(`  보스 첫 도전 승률 ${pct(stats.boss1st)} · 1장 클리어 ${pct(stats.clear)} · 보스 평균 도전 ${(stats.bossTries / Math.max(1, stats.clear)).toFixed(2)}번`);
console.log(`  평균 노드 ${(stats.nodes / N).toFixed(1)}개`);
