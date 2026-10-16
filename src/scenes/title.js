// 타이틀: 새로 시작 / 이어하기 / 설정 / 검수용 거점
import { W, H } from '../core/screen.js';
import { IMG } from '../core/assets.js';
import { text, sprite, C } from '../core/render.js';
import { load, newGameData, save } from '../core/save.js';
import { Button } from '../ui/button.js';
import { Menu } from '../ui/menu.js';
import { toast } from '../ui/toast.js';
import { SettingsScene } from './settings.js';
import { HubScene } from './hub.js';
import { continueStory } from './flow.js';

export class TitleScene {
  constructor(G) {
    this.G = G; this.t = 0;
    const hasSave = !!load('auto');
    const bw = 140, x = (W - bw) / 2;
    const items = [
      ['새로 시작', () => { G.data = newGameData(); save('auto', G.data); this.menu.buttons[1].disabled = false; continueStory(G); }],
      ['이어하기', () => { G.data = load('auto'); if (!G.data) { toast('저장이 없어요', { color: C.red }); return; } G.data.test ? G.scenes.push(new HubScene(G)) : continueStory(G); }, !hasSave],
      ['설정', () => G.scenes.push(new SettingsScene(G))],
      ['검수용 거점 (M4)', () => { G.data = newGameData(undefined, { test: true }); save('auto', G.data); G.scenes.push(new HubScene(G)); }],
    ];
    this.menu = new Menu(items.map(([label, onClick, disabled], i) => new Button({ x, y: 140 + i * 28, w: bw, h: 24, label, onClick, disabled })), { index: hasSave ? 1 : 0 });
  }
  update(dt) { this.t += dt; this.menu.update(this.G, dt); }
  draw(ctx) {
    const bg = IMG.bg_rockpass;
    if (bg) ctx.drawImage(bg, 0, 0); else { ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(24,20,37,0.55)'; ctx.fillRect(0, 0, W, H);
    // 양옆에 주인공 일행
    const bob = k => Math.floor((this.t * 1000 + k) / 450) % 2;
    sprite(ctx, IMG.boss_urs, 8, 92 + bob(0), { alpha: 0.9 });
    sprite(ctx, IMG.iro, W - 150, 150 + bob(200));
    sprite(ctx, IMG.haram, W - 90, 146 + bob(400));
    // 제목
    const y = 40 + Math.sin(this.t * 1.5) * 2;
    text(ctx, '三手戰記', W / 2, y - 22, { color: C.mist, align: 'center', size: 12 });
    text(ctx, '삼수전기', W / 2, y, { color: C.gold, align: 'center', size: 32 });
    text(ctx, '운명을 내미는 손', W / 2, y + 42, { color: C.pale, align: 'center' });
    this.menu.draw(ctx);
    text(ctx, 'M5 체험판 (프롤로그~1장) · 개발 중', W - 6, H - 14, { color: C.slate, align: 'right', size: 10 });
  }
}
