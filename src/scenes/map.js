// 노드 지도: 구역마다 갈림길을 골라 나아간다. 노드를 지날 때마다 자동 저장, HP는 이어진다.
import { W, H } from '../core/screen.js';
import { panel, text, bar, C } from '../core/render.js';
import { createRng } from '../core/rng.js';
import { sfx } from '../core/audio.js';
import { save } from '../core/save.js';
import { Button } from '../ui/button.js';
import { toast } from '../ui/toast.js';
import { tooltip } from '../ui/tooltip.js';
import { drawFace } from '../ui/icons.js';
import { generateZone, isRevealed, NODE_KO } from '../systems/mapgen.js';
import { hpOf, maxHpOf, healParty, fullHeal } from '../systems/party.js';
import { generateItem } from '../systems/items.js';
import { DROP_TABLE, luckRates } from '../systems/economy.js';
import { encounter } from '../../data/encounters.js';
import { MOUNTS } from '../../data/mounts.js';
import { ALL_UNITS } from '../../data/companions.js';
import { BattleScene } from './battle.js';
import { runScript, StoryScene } from './story.js';
import { ShopScene } from './shop.js';

const NODE_COLOR = { battle: '#e43b44', elite: '#b55088', event: '#2ce8f5', treasure: '#feae34', rest: '#63c74d', shop: '#f77622', boss: '#ff0044', start: '#c0cbdc' };
const NODE_DESC = {
  battle: '일반 전투', elite: '강적 — 보상이 좋지만 위험하다', event: '무슨 일이 일어날지 모른다', treasure: '금화나 운명석을 얻는다',
  rest: 'HP 30% 회복', shop: '아이템을 산다', boss: '이 장의 보스', start: '구역 입구',
};
const AREA = { x: 20, y: 30, w: 440, h: 168 };

export class MapScene {
  // chapter: data/chapters/chXX.js 모듈, onBoss: 보스를 이겼을 때
  constructor(G, chapter, { onLeave, onBossWin }) {
    this.G = G; this.ch = chapter; this.onLeave = onLeave; this.onBossWin = onBossWin; this.t = 0; this.busy = false;
    const d = G.data;
    if (!d.progress.map || d.progress.map.chapter !== chapter.CHAPTER.id) {
      d.progress.map = { chapter: chapter.CHAPTER.id, zone: 0, cur: 0, seed: (d.seed ^ (chapter.CHAPTER.id * 7919)) >>> 0, visited: [0], introSeen: {}, usedEvents: [], skipUsed: false };
    }
    this.load();
    this.leaveBtn = new Button({ x: 380, y: 246, w: 94, h: 20, label: '마을로 돌아가기', size: 10, onClick: () => this.leave() });
    this.skipBtn = new Button({ x: 280, y: 246, w: 96, h: 20, label: '한 칸 건너뛰기', size: 10, onClick: () => { this.skipMode = !this.skipMode; } });
  }
  get m() { return this.G.data.progress.map; }
  get zoneDef() { return this.ch.ZONES[this.m.zone]; }
  get mount() { const id = this.G.data.mount; return id ? MOUNTS[id].effect : {}; }
  load() {
    this.zone = generateZone(this.zoneDef, (this.m.seed + this.m.zone * 101) >>> 0);
    this.rng = createRng((this.m.seed ^ (this.m.visited.length * 2654435761)) >>> 0);
  }
  enter() { this.maybeIntro(); }
  async maybeIntro() {
    const z = this.zoneDef;
    if (z.intro && !this.m.introSeen[this.m.zone]) {
      this.busy = true;
      this.m.introSeen[this.m.zone] = true;
      await runScript(this.G, this.ch.SCRIPTS[z.intro], { bg: this.ch.CHAPTER.bg });
      save('auto', this.G.data);
      this.busy = false;
    }
  }
  leave() { save('auto', this.G.data); this.G.scenes.pop(); this.onLeave?.(); }

  nodePos(nd) {
    const cx = AREA.x + 24 + nd.col * ((AREA.w - 48) / (this.zone.cols - 1));
    const cy = AREA.y + AREA.h / 2 + (nd.n === 1 ? 0 : (nd.row / (nd.n - 1) - 0.5) * (AREA.h - 50));
    return { x: Math.round(cx), y: Math.round(cy) };
  }
  get cur() { return this.zone.nodes[this.m.cur]; }
  // 갈 수 있는 노드 (건너뛰기: 두 칸 앞)
  choices() {
    const nexts = this.cur.next.map(id => this.zone.nodes[id]);
    if (!this.skipMode) return nexts;
    return [...new Set(nexts.flatMap(n => n.next))].map(id => this.zone.nodes[id]);
  }
  revealOpts() { const mt = this.mount; return { reveal: 1 + (mt.reveal || 0), mapAll: !!mt.mapAll }; }

  async moveTo(nd) {
    if (this.busy) return;
    this.busy = true;
    if (this.skipMode) { this.m.skipUsed = true; this.skipMode = false; toast('그리핀이 한 칸을 건너뛰었다!', { color: C.cyan }); }
    this.m.cur = nd.id; this.m.visited.push(nd.id);
    sfx('confirm');
    // 이동 중 운명석 줍기 (탈것)
    if (this.mount.pickStones && this.rng.chance(0.15)) { this.G.data.stones++; toast('이동 중에 운명석을 주웠다! +1', { color: C.cyan }); }
    save('auto', this.G.data);
    await this.resolve(nd);
    this.busy = false;
  }

  async resolve(nd) {
    const G = this.G, d = G.data, z = this.zoneDef, rng = this.rng;
    if (nd.type === 'battle' || nd.type === 'elite') {
      const ids = rng.pick(nd.type === 'elite' ? z.elite : z.normal);
      const enc = encounter(nd.type === 'elite' ? '강적 출현' : z.name, ids, { canFlee: true, scale: z.scale || 1 });
      const result = await new Promise(res => G.scenes.push(new BattleScene(G, enc, { onEnd: res })));
      if (result === 'lose') { this.gameOver(); return; }
    } else if (nd.type === 'event') {
      const pool = this.ch.EVENTS.filter(e => !this.m.usedEvents.includes(e));
      const ev = rng.pick(pool.length ? pool : this.ch.EVENTS);
      this.m.usedEvents.push(ev);
      await runScript(G, this.ch.SCRIPTS[ev], { bg: this.ch.CHAPTER.bg });
    } else if (nd.type === 'treasure') {
      const gold = rng.int(80, 150);
      d.gold += gold;
      let msg = `금화 +${gold}`;
      if (rng.chance(0.4)) { const s = rng.int(1, 3); d.stones += s; msg += ` · 운명석 +${s}`; }
      if (rng.chance(0.25)) { const it = generateItem(rng.weighted(luckRates(DROP_TABLE.normal.rates, 0)), rng); d.inventory.push(it); msg += ` · ${it.name}`; }
      sfx('win'); toast(`보물 상자! ${msg}`, { color: C.yellow, ms: 2600 });
    } else if (nd.type === 'rest') {
      healParty(d, 0.3); sfx('win'); toast('잠시 쉬었다. 파티 HP 30% 회복', { color: C.green });
    } else if (nd.type === 'shop') {
      await new Promise(res => { const sh = new ShopScene(G); sh.exit = res; G.scenes.push(sh); });
    } else if (nd.type === 'boss') {
      await runScript(G, this.ch.SCRIPTS.boss_before, { bg: this.ch.CHAPTER.bg });
      const result = await new Promise(res => G.scenes.push(new BattleScene(G, this.ch.BOSS, { onEnd: res, retry: false })));
      if (result !== 'win') { this.gameOver(); return; }
      await runScript(G, this.ch.SCRIPTS.boss_after, { bg: this.ch.CHAPTER.bg });
      save('auto', d);
      G.scenes.pop();
      this.onBossWin?.();
      return;
    }
    // 구역 끝 → 다음 구역
    if (nd.exit && !this.zoneDef.boss) {
      this.m.zone++; this.m.cur = 0; this.m.visited = [0];
      this.load();
      toast(`다음 구역: ${this.zoneDef.name}`, { color: C.gold, ms: 2400 });
      await this.maybeIntro();
    }
    save('auto', d);
  }

  // 전멸: 금화 20%를 잃고 마을로. 지도 위치는 그대로 남는다
  gameOver() {
    const d = this.G.data, lost = Math.floor(d.gold * 0.2);
    d.gold -= lost; fullHeal(d);
    // 진 노드는 다시 도전할 수 있게 한 칸 되돌린다
    d.progress.map.visited.pop();
    d.progress.map.cur = d.progress.map.visited[d.progress.map.visited.length - 1] ?? 0;
    save('auto', d);
    toast(`전멸… 금화 ${lost}을 잃고 마을로 돌아왔다`, { color: C.red, ms: 3000 });
    this.G.scenes.pop(); this.onLeave?.();
  }

  update(dt) {
    const G = this.G, p = G.input.pointer;
    this.t += dt;
    tooltip.begin(); tooltip.update(dt);
    if (this.busy) return;
    this.leaveBtn.update(G, dt);
    this.skipBtn.disabled = !this.mount.skip || this.m.skipUsed;
    this.skipBtn.update(G, dt);
    const opts = this.choices(), ro = this.revealOpts();
    // 키보드: 좌우로 고르고 Enter
    if (this.sel === undefined || !opts[this.sel]) this.sel = 0;
    if (G.input.pressed('up') || G.input.pressed('left')) { this.sel = (this.sel + opts.length - 1) % opts.length; sfx('move'); }
    if (G.input.pressed('down') || G.input.pressed('right')) { this.sel = (this.sel + 1) % opts.length; sfx('move'); }
    if (G.input.pressed('confirm') && opts[this.sel]) { this.moveTo(opts[this.sel]); return; }
    if (G.input.pressed('cancel')) { this.leave(); return; }
    for (const nd of this.zone.nodes) {
      const q = this.nodePos(nd), shown = isRevealed(nd, this.cur.col, ro);
      tooltip.check(G, q.x - 10, q.y - 10, 20, 20, shown ? `${NODE_KO[nd.type]} — ${NODE_DESC[nd.type]}` : '아직 알 수 없는 곳 (탈것으로 더 멀리 볼 수 있다)');
      if (p.tapped && Math.abs(p.x - q.x) < 13 && Math.abs(p.y - q.y) < 13 && opts.includes(nd)) { this.moveTo(nd); return; }
    }
  }

  drawIcon(ctx, type, x, y, shown) {
    const col = shown ? NODE_COLOR[type] : '#5a6988';
    ctx.fillStyle = C.ink; ctx.fillRect(x - 9, y - 9, 18, 18);
    ctx.fillStyle = col; ctx.fillRect(x - 8, y - 8, 16, 16);
    ctx.fillStyle = C.ink; ctx.fillRect(x - 6, y - 6, 12, 12);
    const glyph = shown ? { battle: '⚔', elite: '☠', event: '?', treasure: '◆', rest: '♨', shop: '$', boss: '♛', start: '●' }[type] : '·';
    text(ctx, glyph, x, y - 6, { size: 10, align: 'center', color: col, shadow: false });
  }

  draw(ctx) {
    const d = this.G.data, ro = this.revealOpts();
    // 양피지 지도
    ctx.fillStyle = '#3e2731'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e4c99a'; ctx.fillRect(AREA.x - 8, AREA.y - 8, AREA.w + 16, AREA.h + 16);
    ctx.fillStyle = '#d4b483'; for (let i = 0; i < 80; i++) ctx.fillRect(AREA.x + (i * 53) % AREA.w, AREA.y + (i * 31) % AREA.h, 3, 1);
    ctx.strokeStyle = '#733e39'; ctx.lineWidth = 2; ctx.strokeRect(AREA.x - 7, AREA.y - 7, AREA.w + 14, AREA.h + 14);
    // 길
    const opts = this.busy ? [] : this.choices();
    for (const nd of this.zone.nodes) for (const id of nd.next) {
      const a = this.nodePos(nd), b = this.nodePos(this.zone.nodes[id]);
      const walked = this.m.visited.includes(nd.id) && this.m.visited.includes(id);
      ctx.strokeStyle = walked ? '#a22633' : '#8a6a4a'; ctx.lineWidth = walked ? 2 : 1;
      ctx.setLineDash(walked ? [] : [3, 3]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.setLineDash([]);
    // 노드
    for (const nd of this.zone.nodes) {
      const q = this.nodePos(nd), shown = isRevealed(nd, this.cur.col, ro);
      const can = opts.includes(nd), selK = can && opts[this.sel] === nd;
      if (can) { ctx.fillStyle = selK ? C.yellow : C.gold; ctx.globalAlpha = 0.5 + Math.sin(this.t * 6) * 0.3; ctx.fillRect(q.x - 12, q.y - 12, 24, 24); ctx.globalAlpha = 1; }
      ctx.globalAlpha = this.m.visited.includes(nd.id) && nd.id !== this.m.cur ? 0.45 : 1;
      this.drawIcon(ctx, nd.type, q.x, q.y, shown);
      ctx.globalAlpha = 1;
    }
    // 이로의 위치
    const c = this.nodePos(this.cur);
    drawFace(ctx, 'iro', c.x - 11, c.y - 34 + Math.floor(this.t * 3) % 2, 22);
    // 위: 장·구역
    ctx.fillStyle = 'rgba(24,20,37,0.9)'; ctx.fillRect(0, 0, W, 18);
    text(ctx, `${this.ch.CHAPTER.name} · 구역 ${this.m.zone + 1}/${this.ch.ZONES.length} 「${this.zoneDef.name}」`, 6, 3, { size: 10, color: C.gold });
    text(ctx, `금화 ${d.gold} · 운명석 ${d.stones} · 회복약 ${d.items.potion || 0}`, W - 6, 3, { size: 10, align: 'right' });
    // 아래: 파티 HP
    panel(ctx, 4, 210, 272, 58);
    d.party.forEach((p, i) => {
      const x = 10 + (i % 2) * 134, y = 216 + Math.floor(i / 2) * 25;
      drawFace(ctx, p.id, x, y - 2, 20);
      const hp = hpOf(d, p.id), mx = maxHpOf(d, p.id);
      text(ctx, ALL_UNITS[p.id].name, x + 24, y, { size: 10 });
      bar(ctx, x + 24, y + 12, 100, 5, hp / mx, hp / mx < 0.3 ? C.red : C.green);
      text(ctx, `${hp}`, x + 128, y, { size: 10, align: 'right', color: C.pale });
    });
    panel(ctx, 278, 210, 198, 58, { accent: C.cyan });
    text(ctx, this.skipMode ? '두 칸 앞의 노드를 고르세요' : '빛나는 노드를 눌러 이동 (←→, Enter)', 286, 216, { size: 10, color: this.skipMode ? C.cyan : C.pale });
    text(ctx, d.mount ? `탈것: ${MOUNTS[d.mount].name}` : '탈것 없음 (시야 1칸)', 286, 230, { size: 10, color: C.mist });
    if (!this.busy) { this.leaveBtn.draw(ctx); if (this.mount.skip) this.skipBtn.draw(ctx); }
    tooltip.draw(ctx);
  }
}
