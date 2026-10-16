// 마을 (장마다 하나): 우물 · 파티 · 대장간 · 상점 · 여관 · 지도로 출발
import { W, H } from '../core/screen.js';
import { lookImage } from '../core/assets.js';
import { panel, text, bar, sprite, C } from '../core/render.js';
import { sfx } from '../core/audio.js';
import { save } from '../core/save.js';
import { Button } from '../ui/button.js';
import { Menu } from '../ui/menu.js';
import { toast } from '../ui/toast.js';
import { drawResources } from '../ui/resources.js';
import { drawBackdrop } from '../ui/backdrops.js';
import { unitBuild, hpOf, maxHpOf, fullHeal } from '../systems/party.js';
import { GachaScene } from './gacha.js';
import { PartyScene } from './party.js';
import { ForgeScene } from './forge.js';
import { ShopScene } from './shop.js';
import { MapScene } from './map.js';
import { SettingsScene } from './settings.js';
import { DialogScene } from '../ui/dialog.js';

export const INN_PRICE = 50;

export class TownScene {
  constructor(G, chapter) {
    this.G = G; this.ch = chapter; this.t = 0;
    const items = [
      ['지도로 출발', () => this.depart()],
      ['운명의 우물', () => G.scenes.push(new GachaScene(G))],
      ['파티 편성', () => G.scenes.push(new PartyScene(G))],
      ['대장간', () => G.scenes.push(new ForgeScene(G))],
      ['상점', () => G.scenes.push(new ShopScene(G))],
      [`여관 (${INN_PRICE} 금화)`, () => this.inn()],
      ['저장', () => { save('auto', G.data); toast('저장했어요', { color: C.green }); }],
      ['설정', () => G.scenes.push(new SettingsScene(G))],
      ['타이틀로', () => { save('auto', G.data); G.scenes.pop(); }],
    ];
    this.menu = new Menu(items.map(([label, onClick], i) => new Button({ x: 10 + (i % 3) * 102, y: 196 + Math.floor(i / 3) * 24, w: 98, h: 22, label, onClick, size: 11 })), { columns: 3 });
  }
  get done() { return !!this.G.data.progress.flags[`ch${this.ch.CHAPTER.id}_done`]; }
  depart() {
    if (this.done) {
      const d = new DialogScene(this.G, [{ name: null, text: '1장을 끝냈어요. 체험판은 여기까지예요. 지도를 다시 돌며 장비를 모을 수 있게 하는 기능은 다음 단계에서 만들어요.' }]);
      this.G.scenes.push(d); return;
    }
    this.G.scenes.push(new MapScene(this.G, this.ch, { onLeave: () => {}, onBossWin: () => {} }));
  }
  inn() {
    const d = this.G.data;
    if (d.party.every(p => hpOf(d, p.id) >= maxHpOf(d, p.id))) { toast('모두 기운이 넘쳐요', { color: C.mist }); return; }
    if (d.gold < INN_PRICE) { toast('금화가 모자라요', { color: C.red }); return; }
    d.gold -= INN_PRICE; fullHeal(d); save('auto', d);
    sfx('win'); toast('푹 쉬었다. 파티 HP 전부 회복', { color: C.green });
  }
  update(dt) { this.t += dt; this.menu.update(this.G, dt); }
  draw(ctx) {
    const d = this.G.data;
    drawBackdrop(ctx, this.ch.CHAPTER.bg, this.t);
    ctx.fillStyle = 'rgba(24,20,37,0.25)'; ctx.fillRect(0, 0, W, H);
    // 파티가 서 있는 모습 + HP
    d.party.forEach((p, i) => {
      const b = unitBuild(d, p.id), im = lookImage(b.def.look), x = 150 + i * 76, bob = Math.floor((this.t * 1000 + i * 200) / 450) % 2;
      sprite(ctx, im, x, 112 + bob);
      const hp = hpOf(d, p.id), mx = maxHpOf(d, p.id);
      bar(ctx, x + 8, 178, 48, 4, hp / mx, hp / mx < 0.3 ? C.red : C.green);
    });
    panel(ctx, 4, 190, 316, 78);
    this.menu.draw(ctx);
    panel(ctx, 324, 190, 152, 78, { accent: C.cyan });
    text(ctx, this.ch.CHAPTER.town, 332, 196, { size: 11, color: C.gold });
    const m = d.progress.map;
    const where = this.done ? '1장 완료!' : m && m.chapter === this.ch.CHAPTER.id ? `지도: 구역 ${m.zone + 1} / ${this.ch.ZONES.length}` : '지도: 아직 출발 전';
    text(ctx, where, 332, 212, { size: 10, color: C.pale });
    text(ctx, `회복약 ${d.items.potion || 0} · 금화 ${d.gold}`, 332, 226, { size: 10, color: C.mist });
    text(ctx, `동료 ${Object.keys(d.companions).length}명 · 장비 ${d.inventory.length}개`, 332, 240, { size: 10, color: C.mist });
    drawResources(ctx, d);
    text(ctx, this.ch.CHAPTER.name, 6, 3, { size: 10, color: C.gold });
  }
}
