// 상점: 금화로 전투 아이템과 재료를 산다 (마을과 지도의 상점 노드에서 같이 쓴다)
import { W, H } from '../core/screen.js';
import { panel, text, C } from '../core/render.js';
import { sfx } from '../core/audio.js';
import { save } from '../core/save.js';
import { Button } from '../ui/button.js';
import { Menu } from '../ui/menu.js';
import { toast } from '../ui/toast.js';
import { drawResources } from '../ui/resources.js';

// [키, 이름, 가격, 설명, 넣을 곳]
const GOODS = [
  ['potion', '회복약', 60, '전투 중 HP 35% 회복 (가방에 보관)', 'items'],
  ['enhance', '강화석', 80, '대장간 강화 재료', 'data'],
  ['rerollStone', '재련석', 250, '장비 옵션을 다시 굴리는 재료', 'data'],
  ['protect', '보호 부적', 1500, '+10 이상 강화 실패 시 하락을 막는다', 'data'],
];

export class ShopScene {
  constructor(G) {
    this.G = G; this.opaque = false;
    const btns = GOODS.map(([key, name, price, desc, where], i) => {
      const b = new Button({ x: 96, y: 46 + i * 36, w: 288, h: 32, label: `${name}  ·  ${price} 금화`, sub: desc, onClick: () => this.buy(key, name, price, where) });
      return b;
    });
    btns.push(new Button({ x: 190, y: 46 + GOODS.length * 36 + 6, w: 100, h: 24, label: '나가기', onClick: () => G.scenes.pop() }));
    this.menu = new Menu(btns, { onCancel: () => G.scenes.pop() });
  }
  buy(key, name, price, where) {
    const d = this.G.data;
    if (d.gold < price) { toast('금화가 모자라요', { color: C.red }); return; }
    d.gold -= price;
    if (where === 'items') d.items[key] = (d.items[key] || 0) + 1; else d[key] = (d[key] || 0) + 1;
    sfx('confirm'); toast(`${name} 구입`, { color: C.green });
    save('auto', d);
  }
  update(dt) { this.menu.update(this.G, dt); }
  draw(ctx) {
    const d = this.G.data;
    ctx.fillStyle = 'rgba(24,20,37,0.75)'; ctx.fillRect(0, 0, W, H);
    panel(ctx, 84, 22, 312, 216);
    text(ctx, '상점', W / 2, 30, { color: C.gold, align: 'center' });
    this.menu.draw(ctx);
    text(ctx, `가진 회복약 ${d.items.potion || 0}개`, W / 2, 226, { size: 10, color: C.mist, align: 'center' });
    drawResources(ctx, d, ['gold', 'enhance', 'rerollStone', 'protect']);
  }
}
