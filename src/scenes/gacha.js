// 운명의 우물: 우물 고르기 → 1회 / 10회 → 등급별 연출 → 결과 카드 + 라운 대사
import { W, H } from '../core/screen.js';
import { IMG } from '../core/assets.js';
import { panel, text, wrap, measure, C } from '../core/render.js';
import { ease } from '../core/tween.js';
import { createRng } from '../core/rng.js';
import { sfx } from '../core/audio.js';
import { save } from '../core/save.js';
import { Button } from '../ui/button.js';
import { Menu } from '../ui/menu.js';
import { toast } from '../ui/toast.js';
import { drawResources } from '../ui/resources.js';
import { drawItemIcon, drawFace, rarityColor, rarityGlow, rarityBox } from '../ui/icons.js';
import { WELLS } from '../../data/gacha-pools.js';
import { RARITY, RARITY_ORDER, rank } from '../../data/rarity.js';
import { COMPANIONS } from '../../data/companions.js';
import { JOBS } from '../../data/jobs.js';
import { MOUNTS } from '../../data/mounts.js';
import { RAUN_LINES } from '../../data/raun-lines.js';
import { pull, canAfford, pay, costOf, pityLeft, newPity } from '../systems/gacha.js';

const WELL_IDS = ['equip', 'companion', 'job', 'mount'];
const CUR_KO = { stones: '운명석', jobTicket: '의식권' };

// 뽑기 난수: 저장 데이터에 상태를 남겨서 새로고침으로 다시 굴릴 수 없게 한다
function gachaRng(data) {
  const rng = createRng(data.seed ^ 0x9e3779b9);
  if (data.rng.gacha !== undefined) rng.state = data.rng.gacha;
  return rng;
}

export const resultName = r => r.item ? r.item.name : ({ companion: COMPANIONS, job: JOBS, mount: MOUNTS }[r.kind][r.id]?.name ?? r.id);

export class GachaScene {
  constructor(G) {
    this.G = G; this.t = 0; this.well = 'equip'; this.showRates = false;
    this.line = RAUN_LINES.first[0];
    this.tabs = WELL_IDS.map((id, i) => new Button({ x: 6 + i * 118, y: 21, w: 114, h: 22, label: WELLS[id].name, size: 11, onClick: () => { this.well = id; } }));
    this.btn1 = new Button({ x: 262, y: 196, w: 100, h: 34, label: '1회', onClick: () => this.doPull(1) });
    this.btn10 = new Button({ x: 368, y: 196, w: 104, h: 34, label: '10회', onClick: () => this.doPull(10) });
    this.rateBtn = new Button({ x: 262, y: 236, w: 100, h: 24, label: '확률 보기', size: 11, onClick: () => { this.showRates = !this.showRates; } });
    this.backBtn = new Button({ x: 368, y: 236, w: 104, h: 24, label: '돌아가기', size: 11, onClick: () => G.scenes.pop() });
    this.menu = new Menu([this.btn1, this.btn10, this.rateBtn, this.backBtn], { columns: 2, onCancel: () => (this.showRates ? (this.showRates = false) : G.scenes.pop()) });
  }

  doPull(n) {
    const d = this.G.data;
    if (!canAfford(d, this.well, n)) { const c = costOf(this.well, n); toast(`${CUR_KO[c.currency]}이 부족해요 (${c.amount}개 필요)`, { color: C.red }); return; }
    const before = { ...(d.pity[this.well] || newPity()) };
    pay(d, this.well, n);
    const rng = gachaRng(d);
    const results = pull(d, this.well, n, rng);
    d.rng.gacha = rng.state;
    // 결과는 바로 저장한다 (새로고침으로 다시 굴리기 방지)
    save('auto', d);
    const best = results.reduce((a, r) => (rank(r.rarity) > rank(a) ? r.rarity : a), 'N');
    const w = WELLS[this.well];
    const hitPity = before.L + n >= w.pity.L && rank(best) >= rank('L');
    d.badStreak = rank(best) >= rank('E') ? 0 : (d.badStreak || 0) + 1;
    const pool = hitPity ? RAUN_LINES.pity : d.badStreak >= 3 && rank(best) <= rank('R') ? RAUN_LINES.streakBad : RAUN_LINES[best];
    this.line = pool[Math.floor(Math.random() * pool.length)];
    this.G.scenes.push(new RevealScene(this.G, results, best, this.line));
  }

  update(dt) {
    this.t += dt;
    const G = this.G;
    this.tabs.forEach(b => { b.update(G, dt); b.focus = false; });
    // 우물 바꾸기: Q / E (방향키는 버튼 이동에 쓴다)
    if (G.input.pressed('KeyQ')) this.cycle(-1);
    if (G.input.pressed('KeyE')) this.cycle(1);
    const d = G.data, c1 = costOf(this.well, 1), c10 = costOf(this.well, 10);
    this.btn1.sub = `${CUR_KO[c1.currency]} ${c1.amount}`; this.btn10.sub = `${CUR_KO[c10.currency]} ${c10.amount}`;
    this.btn1.disabled = !canAfford(d, this.well, 1); this.btn10.disabled = !canAfford(d, this.well, 10);
    this.menu.update(G, dt);
  }
  cycle(dir) { const i = WELL_IDS.indexOf(this.well); this.well = WELL_IDS[(i + dir + 4) % 4]; sfx('move'); }

  drawWell(ctx, x, y) {
    const t = this.t;
    // 돌 우물
    ctx.fillStyle = C.ink; ctx.fillRect(x - 62, y - 6, 124, 46);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#5a6988' : '#8b9bb4'; ctx.fillRect(x - 60 + i * 20, y - 4, 19, 20); ctx.fillStyle = i % 2 ? '#8b9bb4' : '#5a6988'; ctx.fillRect(x - 60 + i * 20, y + 17, 19, 20); }
    // 빛나는 물
    const glow = this.well === 'equip' ? '#2ce8f5' : this.well === 'companion' ? '#c9a0ff' : this.well === 'job' ? '#ff8fa8' : '#a7f070';
    ctx.fillStyle = C.ink; ctx.fillRect(x - 54, y - 14, 108, 12);
    ctx.fillStyle = glow; ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.2; ctx.fillRect(x - 52, y - 12, 104, 8); ctx.globalAlpha = 1;
    // 피어오르는 빛 알갱이
    for (let i = 0; i < 14; i++) {
      const k = (t * 0.6 + i / 14) % 1;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = i % 3 ? glow : '#fff';
      ctx.fillRect(Math.round(x - 48 + ((i * 37) % 96)), Math.round(y - 14 - k * 70), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx) {
    const d = this.G.data, w = WELLS[this.well];
    if (IMG.bg_rockpass) ctx.drawImage(IMG.bg_rockpass, 0, 0);
    ctx.fillStyle = 'rgba(24,20,37,0.65)'; ctx.fillRect(0, 0, W, H);
    this.tabs.forEach((b, i) => { b.focus = WELL_IDS[i] === this.well; b.draw(ctx); });
    this.drawWell(ctx, 128, 168);
    // 라운 말풍선
    const lines = wrap(ctx, this.line, 200, 11);
    panel(ctx, 16, 54, 228, 18 + lines.length * 14, { fill: C.ink, border: C.pink, accent: C.pink });
    text(ctx, '라운', 24, 45, { color: C.pink, size: 10 });
    lines.forEach((l, k) => text(ctx, l, 26, 62 + k * 14, { size: 11 }));
    // 오른쪽 정보
    panel(ctx, 256, 50, 220, 140);
    text(ctx, w.name, 266, 58, { color: C.gold });
    text(ctx, w.desc, 266, 74, { color: C.pale, size: 10 });
    const left = pityLeft(this.well, d.pity[this.well]);
    text(ctx, `영웅 이상 확정까지  ${left.E}회`, 266, 96, { size: 11, color: RARITY.E.glow });
    text(ctx, `전설 이상 확정까지  ${left.L}회`, 266, 112, { size: 11, color: RARITY.L.glow });
    text(ctx, '10회 뽑기: 마지막 칸 희귀 이상 확정', 266, 132, { size: 10, color: C.mist });
    text(ctx, `운명의 조각 ${d.shards} / 1000 (신화 선택권)`, 266, 146, { size: 10, color: C.mist });
    const top = RARITY_ORDER.filter(r => w.rates[r] !== undefined).slice(-2);
    text(ctx, top.map(r => `${RARITY[r].name} ${w.rates[r]}%`).join(' · '), 266, 166, { size: 10, color: C.yellow });
    this.menu.draw(ctx);
    if (this.showRates) this.drawRates(ctx, w);
    drawResources(ctx, d);
    text(ctx, '운명의 우물 (Q·E: 우물 바꾸기)', 6, 3, { size: 10, color: C.gold });
  }

  drawRates(ctx, w) {
    panel(ctx, 30, 40, 420, 190, { fill: C.ink });
    text(ctx, `${w.name} 확률표 (모두 공개)`, 44, 50, { color: C.gold });
    RARITY_ORDER.filter(r => w.rates[r] !== undefined).forEach((r, i) => {
      const y = 72 + i * 18;
      rarityBox(ctx, 44, y, 12, 12, r);
      text(ctx, RARITY[r].name, 62, y, { size: 11, color: rarityGlow(r) });
      text(ctx, `${w.rates[r]}%`, 160, y, { size: 11, align: 'right' });
      const src = { companion: COMPANIONS, job: JOBS, mount: MOUNTS }[w.kind];
      const names = src ? Object.values(src).filter(x => x.rarity === r).map(x => x.name) : null;
      const s = names ? names.join(', ') : '무기 · 방어구 · 장신구 (랜덤 옵션)';
      text(ctx, s.length > 34 ? s.slice(0, 33) + '…' : s, 172, y, { size: 10, color: C.mist });
    });
    text(ctx, `천장: 영웅 이상 ${w.pity.E}회 · 전설 이상 ${w.pity.L}회 (우물마다 따로 센다) · 신화 천장 없음`, 44, 206, { size: 10, color: C.pale });
    text(ctx, '아무 데나 누르면 닫혀요', 436, 216, { size: 10, color: C.slate, align: 'right' });
    if (this.G.input.pointer.tapped) this.showRates = false;
  }
}

// ───────────── 연출 장면 ─────────────
export class RevealScene {
  constructor(G, results, best, line) {
    this.G = G; this.results = results; this.best = best; this.line = line;
    this.t = 0; this.phase = 'beam'; this.shown = 0; this.opaque = true;
    const r = rank(best);
    this.beamTime = [0.7, 0.8, 1.0, 1.3, 1.9, 2.4, 2.8][r];
    if (r >= rank('E')) G.fx.shake(r >= rank('M') ? 8 : r >= rank('L') ? 5 : 3, this.beamTime * 1000);
    sfx('confirm');
  }
  skip() { if (this.phase === 'beam') this.toCards(); else if (this.shown < this.results.length) this.shown = this.results.length; else this.G.scenes.pop(); }
  toCards() {
    this.phase = 'cards'; this.cardT = 0;
    const r = rank(this.best);
    if (r >= rank('L')) { this.G.fx.flash(rarityGlow(this.best), 400); sfx('win'); }
    else sfx('confirm');
  }
  update(dt) {
    const input = this.G.input;
    this.t += dt;
    if (this.phase === 'beam' && this.t > this.beamTime) this.toCards();
    if (this.phase === 'cards') {
      this.cardT += dt;
      const n = Math.min(this.results.length, Math.floor(this.cardT / 0.12) + 1);
      if (n > this.shown) { this.shown = n; const rr = this.results[n - 1]; if (rank(rr.rarity) >= rank('E')) { this.G.fx.burst(...this.cardPos(n - 1).map((v, k) => v + (k ? 34 : 26)), { n: 16, colors: [rarityGlow(rr.rarity), '#fff'] }); sfx('win'); } else sfx('move'); }
    }
    if (input.pointer.tapped || input.pressed('confirm') || input.pressed('cancel')) this.skip();
  }
  cardPos(i) {
    const n = this.results.length;
    if (n === 1) return [W / 2 - 26, 70];
    return [W / 2 - 5 * 30 + (i % 5) * 60 + 3, 28 + Math.floor(i / 5) * 96];
  }
  draw(ctx) {
    const best = this.best, col = rarityColor(best), glow = rarityGlow(best), r = rank(best);
    ctx.fillStyle = '#0b0a14'; ctx.fillRect(0, 0, W, H);
    if (this.phase === 'beam') {
      const k = Math.min(1, this.t / this.beamTime);
      // 빛기둥: 등급이 높을수록 굵고 길다
      const bw = 6 + r * 10 * k;
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(this.t * 20);
      ctx.fillStyle = glow; ctx.fillRect(W / 2 - bw, 0, bw * 2, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = col; ctx.fillRect(W / 2 - bw / 3, 0, (bw * 2) / 3, H);
      if (r >= rank('M')) { ctx.globalAlpha = 0.25 * k; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      if (best === 'X') { // 화면이 깨진다
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(W / 2, H / 2); const a = i * 0.7 + this.t; ctx.lineTo(W / 2 + Math.cos(a) * 300 * k, H / 2 + Math.sin(a) * 300 * k); ctx.stroke(); }
      }
      if (r >= rank('L') && k > 0.5) text(ctx, RARITY[best].name + '!', W / 2, H / 2 - 20, { size: 32, align: 'center', color: glow });
      text(ctx, '누르면 건너뛰기', W - 8, H - 14, { size: 10, align: 'right', color: C.slate });
      return;
    }
    // 결과 카드
    for (let i = 0; i < Math.min(this.shown, this.results.length); i++) this.drawCard(ctx, this.results[i], ...this.cardPos(i));
    // 라운 대사
    if (this.shown >= this.results.length) {
      const lines = wrap(ctx, this.line, 400, 11);
      panel(ctx, 20, H - 30 - lines.length * 14, W - 40, 14 + lines.length * 14, { fill: C.ink, border: C.pink, accent: C.pink });
      text(ctx, '라운', 30, H - 39 - lines.length * 14, { size: 10, color: C.pink });
      lines.forEach((l, k) => text(ctx, l, 32, H - 23 - lines.length * 14 + k * 14, { size: 11 }));
    }
  }
  drawCard(ctx, res, x, y) {
    const col = rarityColor(res.rarity), w = 54, h = 76;
    ctx.fillStyle = col; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#181425'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = col; ctx.globalAlpha = 0.18; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.globalAlpha = 1;
    text(ctx, RARITY[res.rarity].name, x + w / 2, y + 3, { size: 10, align: 'center', color: rarityGlow(res.rarity) });
    if (res.item) drawItemIcon(ctx, res.item, x + 15, y + 17);
    else if (res.kind === 'companion') drawFace(ctx, res.id, x + 11, y + 14);
    else {
      ctx.fillStyle = col; ctx.fillRect(x + 15, y + 17, 24, 24); ctx.fillStyle = C.ink; ctx.fillRect(x + 17, y + 19, 20, 20);
      text(ctx, resultName(res)[0], x + w / 2, y + 23, { size: 12, align: 'center', color: rarityGlow(res.rarity) });
    }
    const name = resultName(res);
    const ls = wrap(ctx, name, w - 4, 10).slice(0, 2);
    ls.forEach((l, k) => text(ctx, l, x + w / 2, y + 47 + k * 11, { size: 10, align: 'center' }));
    const tag = res.isNew ? 'NEW' : res.dup === 'break' ? '돌파+1' : res.dup === 'shards' ? `조각+${res.shards}` : '';
    if (tag) text(ctx, tag, x + w / 2, y + h + 3, { size: 10, align: 'center', color: res.isNew ? C.yellow : C.cyan });
  }
}
