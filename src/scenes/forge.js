// 대장간: 강화(+15, 하락, 보호 부적, 실패 보정) · 재련(한 줄 고정 가능) · 분해 · 판매
import { W, H } from '../core/screen.js';
import { panel, text, C } from '../core/render.js';
import { createRng } from '../core/rng.js';
import { sfx } from '../core/audio.js';
import { save } from '../core/save.js';
import { Button } from '../ui/button.js';
import { toast } from '../ui/toast.js';
import { ListView } from '../ui/list.js';
import { drawResources } from '../ui/resources.js';
import { drawItemIcon, rarityGlow } from '../ui/icons.js';
import { RARITY, rank } from '../../data/rarity.js';
import { SLOT_KO, UNIQUES } from '../../data/equipment.js';
import { optionText, QUALITY } from '../../data/options.js';
import { ALL_UNITS } from '../../data/companions.js';
import { successRate, enhanceCost, tryEnhance, dropsOnFail, failBonus, MAX_PLUS } from '../systems/enhance.js';
import { reroll, rerollCost, dismantleValue, sellPrice, itemStats } from '../systems/items.js';
import { equippedBy } from '../systems/party.js';

const STAT_KO = { atk: '공격', def: '방어', hp: 'HP', spd: '속도', crit: '치명', luck: '행운' };

function forgeRng(data) {
  const rng = createRng(data.seed ^ 0x51ed27);
  if (data.rng.forge !== undefined) rng.state = data.rng.forge;
  return rng;
}

export class ForgeScene {
  constructor(G) {
    this.G = G; this.protect = false; this.lock = -1; this.confirm = null;
    this.list = new ListView({ x: 6, y: 22, w: 190, h: 244, rowH: 26, drawRow: (c, it, x, y, w, h, s) => this.drawRow(c, it, x, y, w, h, s), onSelect: () => { this.lock = -1; this.confirm = null; } });
    this.btnEnh = new Button({ x: 206, y: 196, w: 88, h: 30, label: '강화', onClick: () => this.enhance() });
    this.btnProt = new Button({ x: 206, y: 230, w: 88, h: 18, label: '', size: 10, onClick: () => { this.protect = !this.protect; } });
    this.btnRe = new Button({ x: 298, y: 196, w: 88, h: 30, label: '재련', onClick: () => this.reroll() });
    this.btnLock = new Button({ x: 298, y: 230, w: 88, h: 18, label: '', size: 10, onClick: () => this.cycleLock() });
    this.btnDis = new Button({ x: 390, y: 196, w: 84, h: 22, label: '분해', size: 11, onClick: () => this.ask('dis') });
    this.btnSell = new Button({ x: 390, y: 222, w: 84, h: 22, label: '판매', size: 11, onClick: () => this.ask('sell') });
    this.btnBack = new Button({ x: 390, y: 248, w: 84, h: 18, label: '돌아가기', size: 10, onClick: () => this.close() });
    this.btns = [this.btnEnh, this.btnProt, this.btnRe, this.btnLock, this.btnDis, this.btnSell, this.btnBack];
    this.rng = forgeRng(G.data);
    this.refresh();
  }
  get data() { return this.G.data; }
  get item() { return this.list.items[this.list.selected]; }
  close() { this.data.rng.forge = this.rng.state; save('auto', this.data); this.G.scenes.pop(); }
  refresh() {
    const inv = [...this.data.inventory].sort((a, b) => rank(b.rarity) - rank(a.rarity) || b.plus - a.plus);
    const cur = this.item;
    this.list.setItems(inv);
    if (cur) this.list.selected = Math.max(0, inv.indexOf(cur));
  }
  persist() { this.data.rng.forge = this.rng.state; save('auto', this.data); }
  cycleLock() { const n = this.item?.opts.length || 0; this.lock = this.lock + 1 >= n ? -1 : this.lock + 1; }

  enhance() {
    const it = this.item, d = this.data;
    if (!it || it.plus >= MAX_PLUS) return;
    const c = enhanceCost(it);
    if (d.gold < c.gold || d.enhance < c.enhance) { toast('금화나 강화석이 부족해요', { color: C.red }); return; }
    const useCharm = this.protect && dropsOnFail(it.plus) && d.protect > 0;
    d.gold -= c.gold; d.enhance -= c.enhance;
    const r = tryEnhance(it, this.rng, { protect: useCharm });
    if (r === 'protected') d.protect--;
    const msg = { success: [`성공! +${it.plus}`, C.yellow], fail: ['실패… (단계 유지)', C.mist], drop: [`실패… 한 단계 떨어졌다 (+${it.plus})`, C.red], protected: ['실패했지만 보호 부적이 막아 줬다', C.cyan] }[r];
    toast(msg[0], { color: msg[1] });
    sfx(r === 'success' ? 'win' : r === 'drop' ? 'lose' : 'cancel');
    if (r === 'success') this.G.fx.burst(240, 70, { n: 18 });
    if (r === 'drop') this.G.fx.shake(4, 250);
    this.persist(); this.refresh();
  }

  reroll() {
    const it = this.item, d = this.data;
    if (!it) return;
    if (!it.opts.length) { toast('옵션이 없는 장비예요', { color: C.mist }); return; }
    const cost = rerollCost(it, this.lock);
    if (d.rerollStone < cost) { toast(`재련석이 부족해요 (${cost}개 필요)`, { color: C.red }); return; }
    d.rerollStone -= cost;
    reroll(it, this.rng, this.lock);
    sfx('confirm'); this.G.fx.burst(330, 120, { n: 12, colors: ['#63c74d', '#a7f070', '#fff'] });
    toast('옵션을 다시 굴렸다', { color: C.green });
    this.persist();
  }

  ask(kind) {
    const it = this.item;
    if (!it) return;
    if (this.confirm === kind) { this.confirm = null; kind === 'dis' ? this.dismantle() : this.sell(); return; }
    this.confirm = kind; toast('한 번 더 누르면 실행해요', { color: C.orange });
  }
  removeItem(it) {
    const d = this.data, owner = equippedBy(d, it.uid);
    if (owner) delete d.equip[owner][it.slot];
    d.inventory.splice(d.inventory.indexOf(it), 1);
  }
  dismantle() {
    const it = this.item, v = dismantleValue(it), d = this.data;
    this.removeItem(it); d.enhance += v.enhance; d.rerollStone += v.reroll;
    toast(`분해: 강화석 +${v.enhance}${v.reroll ? ` · 재련석 +${v.reroll}` : ''}`, { color: C.orange }); sfx('cancel');
    this.persist(); this.refresh();
  }
  sell() {
    const it = this.item, g = sellPrice(it);
    this.removeItem(it); this.data.gold += g;
    toast(`판매: 금화 +${g}`, { color: C.gold }); sfx('confirm');
    this.persist(); this.refresh();
  }

  update(dt) {
    const G = this.G;
    if (G.input.pressed('cancel')) { this.close(); return; }
    this.list.update(G, dt);
    const it = this.item, d = this.data;
    for (const b of this.btns) b.disabled = !it && b !== this.btnBack;
    if (it) {
      const c = enhanceCost(it);
      this.btnEnh.sub = it.plus >= MAX_PLUS ? '최대' : `${successRate(it)}%`;
      this.btnEnh.disabled = it.plus >= MAX_PLUS;
      this.btnProt.label = `보호 부적 ${this.protect ? '켜짐' : '꺼짐'} (${d.protect})`;
      this.btnRe.sub = `재련석 ${rerollCost(it, this.lock)}`;
      this.btnLock.label = this.lock >= 0 ? `${this.lock + 1}번 줄 고정` : '고정 없음';
      this.btnLock.disabled = !it.opts.length;
      this.costText = it.plus >= MAX_PLUS ? '' : `금화 ${c.gold} · 강화석 ${c.enhance}`;
    }
    for (const b of this.btns) b.update(G, dt);
  }

  drawRow(ctx, it, x, y, w, h, s) {
    drawItemIcon(ctx, it, x + 4, y + 1);
    text(ctx, `${it.name}${it.plus ? ' +' + it.plus : ''}`, x + 32, y + 3, { size: 11, color: rarityGlow(it.rarity) });
    const owner = equippedBy(this.data, it.uid);
    text(ctx, `${RARITY[it.rarity].name} ${SLOT_KO[it.slot]}${owner ? ' · ' + ALL_UNITS[owner].name : ''}`, x + 32, y + 14, { size: 10, color: owner ? C.green : C.mist });
  }

  draw(ctx) {
    const d = this.data, it = this.item;
    ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
    panel(ctx, 4, 20, 194, 248);
    this.list.draw(ctx);
    if (!d.inventory.length) text(ctx, '장비가 없어요. 장비 우물에서 뽑아 보세요.', 12, 30, { size: 10, color: C.mist });
    panel(ctx, 200, 20, 276, 172);
    if (it) {
      drawItemIcon(ctx, it, 210, 28);
      text(ctx, `${it.name}${it.plus ? ' +' + it.plus : ''}`, 240, 28, { color: rarityGlow(it.rarity) });
      text(ctx, `${RARITY[it.rarity].name} ${SLOT_KO[it.slot]} · 최고 +${it.best || it.plus}`, 240, 42, { size: 10, color: C.mist });
      const { stats } = itemStats(it);
      text(ctx, Object.entries(stats).map(([k, v]) => `${STAT_KO[k]} ${k === 'crit' ? (v * 100).toFixed(1) + '%' : v}`).join('  '), 210, 60, { size: 10 });
      let y = 76;
      it.opts.forEach((o, i) => {
        const q = QUALITY[o.q];
        text(ctx, `${this.lock === i ? '[고정]' : '·'} ${optionText(o)}`, 210, y, { size: 10, color: q.color });
        text(ctx, q.name, 466, y, { size: 10, color: q.color, align: 'right' });
        y += 13;
      });
      (it.uniques || []).forEach(u => { text(ctx, `★ ${UNIQUES[u].name}: ${UNIQUES[u].text}`, 210, y, { size: 10, color: C.yellow }); y += 13; });
      if (!it.opts.length && !(it.uniques || []).length) text(ctx, '옵션 없음', 210, y, { size: 10, color: C.slate });
      // 강화 정보
      const fb = failBonus(it);
      text(ctx, this.costText || '', 210, 160, { size: 10, color: C.pale });
      text(ctx, `${dropsOnFail(it.plus) ? '실패하면 1단계 하락' : '실패해도 단계 유지'}${fb ? ` · 실패 보정 +${fb}%` : ''}`, 210, 174, { size: 10, color: dropsOnFail(it.plus) ? C.red : C.mist });
    }
    for (const b of this.btns) b.draw(ctx);
    drawResources(ctx, d, ['gold', 'enhance', 'rerollStone', 'protect']);
    text(ctx, '대장간', 6, 3, { size: 10, color: C.gold });
  }
}
