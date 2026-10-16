// 이야기 실행기: 대본(배열)을 한 줄씩 실행한다. 대사 · 선택지 · 분기 · 플래그 · 전투 · 뽑기 · 보상
//
// ['인물', '대사']                       인물 키는 data/speakers.js. 'narr'는 해설. {job} {item}은 바뀐다
// { bg: 'village' }                      배경 (src/ui/backdrops.js)
// { label: '이름' } / { goto: '이름' }     건너뛰기
// { choice: [['보기', 'label'], ...] }   선택지 → 고른 label로
// { random: [[가중치, 'label'], ...] }   운에 맡겨 label로
// { battle: '키'|조우, lose?: 'label' }  전투 (lose가 없으면 이길 때까지 다시 도전)
// { gacha: 우물, count, free, min?, slot?, equipTo? }  뽑기 (연출 포함)
// { autoParty: true }                    빈자리를 가진 동료로 채운다
// { join: '동료' }                        이야기 동료 합류
// { give: { stones: 10, ... } }          재화 · 아이템 지급
// { pay: { gold: 100 }, fail: 'label' }  지불 (모자라면 fail로)
// { item: 'normal' }                     드롭표에서 장비 하나 → {item}
// { heal: 0.5 } / { hurt: 0.15 }         파티 HP 회복 / 감소 (비율)
// { flag: '이름' }                        플래그 켜기
import { W, H } from '../core/screen.js';
import { lookImage } from '../core/assets.js';
import { createRng } from '../core/rng.js';
import { save } from '../core/save.js';
import { sprite, shadow, C } from '../core/render.js';
import { DialogScene } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { drawBackdrop } from '../ui/backdrops.js';
import { RES } from '../ui/resources.js';
import { SPEAKERS } from '../../data/speakers.js';
import { JOBS } from '../../data/jobs.js';
import { ALL_UNITS } from '../../data/companions.js';
import { pull, freePull } from '../systems/gacha.js';
import { generateItem } from '../systems/items.js';
import { DROP_TABLE, luckRates } from '../systems/economy.js';
import { autoFillParty, fixRows, healParty, hurtParty, unitBuild, power } from '../systems/party.js';
import { BattleScene } from './battle.js';
import { RevealScene, resultName } from './gacha.js';
import { RAUN_LINES } from '../../data/raun-lines.js';
import { rank } from '../../data/rarity.js';

// 배경과 서 있는 인물을 그리는 장면 (대화창은 그 위에 따로 뜬다)
export class StoryScene {
  constructor(G, bg = 'village') { this.G = G; this.bg = bg; this.t = 0; this.left = null; this.right = null; }
  speak(key) {
    const sp = SPEAKERS[key];
    if (!sp || !sp.look) return;
    if (sp.side === 'right') this.right = key; else this.left = key;
    this.active = key;
  }
  update(dt) { this.t += dt; }
  draw(ctx) {
    drawBackdrop(ctx, this.bg, this.t);
    for (const key of [this.left, this.right]) {
      if (!key) continue;
      const sp = SPEAKERS[key], im = lookImage(sp.look);
      if (!im) continue;
      const big = im.width > 64;
      const x = sp.side === 'right' ? W - 150 : big ? 40 : 90, y = big ? 64 : 120;
      const bob = Math.floor((this.t * 1000) / 500) % 2;
      shadow(ctx, x + im.width / 2, y + im.height - 2, im.width * 0.4);
      sprite(ctx, im, x, y + bob, { alpha: this.active === key ? 1 : 0.55 });
    }
  }
}

function storyRng(data) {
  const rng = createRng(data.seed ^ 0x5eed);
  if (data.rng.story !== undefined) rng.state = data.rng.story;
  return rng;
}

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

// ctx: { encounters: {키: 조우}, bg, scene: 이미 띄운 StoryScene }
export async function runScript(G, script, ctx = {}) {
  const d = G.data, vars = ctx.vars || {};
  const labels = {};
  script.forEach((c, i) => { if (c.label) labels[c.label] = i; });
  let scene = ctx.scene;
  const own = !scene;
  if (own) { scene = new StoryScene(G, ctx.bg); G.scenes.push(scene); }
  const rng = storyRng(d);
  const say = async (lines, choices) => {
    const dlg = new DialogScene(G, lines, choices ? { choices } : {});
    G.scenes.push(dlg);
    return dlg.promise;
  };

  for (let i = 0; i < script.length; i++) {
    const c = script[i];
    if (Array.isArray(c)) {
      const [who, text] = c;
      scene.speak(who);
      const sp = SPEAKERS[who] || { name: who };
      await say([{ name: sp.name, text: fill(text, vars) }]);
      continue;
    }
    if (c.bg) { scene.bg = c.bg; scene.left = scene.right = null; }
    if (c.goto) { i = labels[c.goto]; continue; }
    if (c.choice) {
      const k = await say([{ name: null, text: '어떻게 할까?' }], c.choice.map(x => x[0]));
      i = labels[c.choice[k][1]];
      continue;
    }
    if (c.random) { const to = rng.weighted(c.random.map(([w, l]) => [l, w])); d.rng.story = rng.state; i = labels[to]; continue; }
    if (c.flag) { d.progress.flags[c.flag] = true; save('auto', d); }
    if (c.give) {
      for (const [k, v] of Object.entries(c.give)) {
        if (k === 'potion') d.items.potion = (d.items.potion || 0) + v; else d[k] = (d[k] || 0) + v;
        toast(`${RES[k]?.[0] || (k === 'potion' ? '회복약' : k)} +${v}`, { color: C.yellow });
      }
      save('auto', d);
    }
    if (c.pay) {
      const ok = Object.entries(c.pay).every(([k, v]) => (d[k] || 0) >= v);
      if (!ok) { if (c.fail) i = labels[c.fail]; continue; }
      for (const [k, v] of Object.entries(c.pay)) d[k] -= v;
    }
    if (c.item) {
      const t = DROP_TABLE[c.item];
      const it = generateItem(rng.weighted(luckRates(t.rates, 0)), rng);
      d.inventory.push(it); vars.item = it.name; d.rng.story = rng.state; save('auto', d);
    }
    if (c.heal) healParty(d, c.heal);
    if (c.hurt) hurtParty(d, c.hurt);
    if (c.join) {
      if (d.companions[c.join] === undefined) d.companions[c.join] = 0;
      if (!d.party.some(p => p.id === c.join)) {
        if (d.party.length >= 4) {
          // 자리가 꽉 찼으면 가장 약한 동료(이로 제외)가 빠진다
          const weakest = d.party.filter(p => p.id !== 'iro').sort((a, b) => power(unitBuild(d, a.id)) - power(unitBuild(d, b.id)))[0];
          toast(`${ALL_UNITS[weakest.id].name} 대신 ${ALL_UNITS[c.join].name}이(가) 파티에 들어왔다`, { color: C.pale, ms: 2600 });
          d.party.splice(d.party.indexOf(weakest), 1);
        }
        d.party.push({ id: c.join, row: ALL_UNITS[c.join].row }); fixRows(d);
      }
      save('auto', d);
    }
    if (c.autoParty) { autoFillParty(d); save('auto', d); }
    if (c.gacha) await storyGacha(G, c, vars);
    if (c.battle) {
      const enc = typeof c.battle === 'string' ? ctx.encounters[c.battle] : c.battle;
      const result = await new Promise(res => G.scenes.push(new BattleScene(G, enc, { onEnd: res, retry: !c.lose })));
      if (result === 'lose' && c.lose) { i = labels[c.lose]; continue; }
    }
  }
  if (own) G.scenes.pop();
}

// 이야기 뽑기: 무료. 한 번 받은 보상은 다시 받지 않게 플래그를 남긴다 (중간에 껐다 켜도 두 번 받지 않음)
async function storyGacha(G, c, vars) {
  const d = G.data;
  const key = `got_${c.gacha}_${c.count}_${c.min || ''}_${c.slot || ''}_${d.progress.chapter}`;
  if (d.progress.flags[key]) { vars.job = JOBS[d.job]?.name; return; }
  const rng = createRng(d.seed ^ 0x9e3779b9);
  if (d.rng.gacha !== undefined) rng.state = d.rng.gacha;
  const results = c.min || c.slot ? freePull(d, c.gacha, c.count, rng, { min: c.min, slot: c.slot }) : pull(d, c.gacha, c.count, rng);
  d.rng.gacha = rng.state;
  if (c.gacha === 'job') { d.job = results[0].id; vars.job = JOBS[d.job].name; }
  if (results[0].item) {
    vars.item = results[0].item.name;
    if (c.equipTo) (d.equip[c.equipTo] ||= {})[results[0].item.slot] = results[0].item.uid;
  }
  d.progress.flags[key] = true;
  save('auto', d);
  const best = results.reduce((a, r) => (rank(r.rarity) > rank(a) ? r.rarity : a), 'N');
  const pool = RAUN_LINES[best];
  // 연출 장면이 닫히면 이어서 진행
  await new Promise(res => {
    const rv = new RevealScene(G, results, best, pool[Math.floor(Math.random() * pool.length)]);
    rv.exit = res;
    G.scenes.push(rv);
  });
  vars.names = results.map(resultName).join(', ');
}
