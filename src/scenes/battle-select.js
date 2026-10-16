// 전투 시험: 조우를 골라 바로 싸운다 (M3 검수용)
import { W, H } from '../core/screen.js';
import { panel, text, C } from '../core/render.js';
import { Button } from '../ui/button.js';
import { Menu } from '../ui/menu.js';
import { ENCOUNTERS } from '../../data/enemies.js';
import { BattleScene } from './battle.js';

export class BattleSelectScene {
  constructor(G) {
    this.G = G; this.opaque = false;
    const keys = Object.keys(ENCOUNTERS);
    const btns = keys.map((k, i) => new Button({ x: 110, y: 58 + i * 40, w: 260, h: 34, label: ENCOUNTERS[k].name, sub: ENCOUNTERS[k].desc, onClick: () => G.scenes.push(new BattleScene(G, k)) }));
    btns.push(new Button({ x: 190, y: 58 + keys.length * 40 + 6, w: 100, h: 24, label: '돌아가기', onClick: () => G.scenes.pop() }));
    this.menu = new Menu(btns, { onCancel: () => G.scenes.pop() });
  }
  update(dt) { this.menu.update(this.G, dt); }
  draw(ctx) {
    ctx.fillStyle = 'rgba(24,20,37,0.7)'; ctx.fillRect(0, 0, W, H);
    panel(ctx, 96, 22, 288, 222);
    text(ctx, '전투 시험 — 1장 반석국', W / 2, 32, { color: C.gold, align: 'center' });
    this.menu.draw(ctx);
    text(ctx, this.G.data ? '거점에서 편성한 파티로 싸워요 · 이기면 보상 획득' : '기본 파티 (무쇠·이로 / 세린·하람)', W / 2, 228, { color: C.mist, align: 'center', size: 10 });
  }
}
