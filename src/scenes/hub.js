// 거점 (임시 메뉴): 우물 · 파티 · 대장간 · 전투. 본편의 마을 화면은 M5에서 만든다.
import { W, H } from '../core/screen.js';
import { IMG, lookImage } from '../core/assets.js';
import { panel, text, sprite, C } from '../core/render.js';
import { save } from '../core/save.js';
import { Button } from '../ui/button.js';
import { Menu } from '../ui/menu.js';
import { toast } from '../ui/toast.js';
import { drawResources } from '../ui/resources.js';
import { unitBuild, power } from '../systems/party.js';
import { GachaScene } from './gacha.js';
import { PartyScene } from './party.js';
import { ForgeScene } from './forge.js';
import { BattleSelectScene } from './battle-select.js';
import { SettingsScene } from './settings.js';

export class HubScene {
  constructor(G) {
    this.G = G; this.t = 0;
    const items = [
      ['운명의 우물', '뽑기 · 장비 / 동료 / 천직 / 탈것', () => G.scenes.push(new GachaScene(G))],
      ['파티 편성', '동료 교체 · 장비 · 직업 · 탈것', () => G.scenes.push(new PartyScene(G))],
      ['대장간', '강화 · 재련 · 분해 · 판매', () => G.scenes.push(new ForgeScene(G))],
      ['전투 시험', '지금 파티로 싸우기 · 보상 획득', () => G.scenes.push(new BattleSelectScene(G))],
      ['저장', '자동 저장 칸에 저장', () => { save('auto', G.data); toast('저장했어요', { color: C.green }); }],
      ['설정', '', () => G.scenes.push(new SettingsScene(G))],
      ['타이틀로', '', () => { save('auto', G.data); G.scenes.pop(); }],
    ];
    this.menu = new Menu(items.map(([label, sub, onClick], i) => new Button({ x: 16, y: 28 + i * 33, w: 170, h: 29, label, sub, onClick, size: 12 })));
  }
  update(dt) { this.t += dt; this.menu.update(this.G, dt); }
  draw(ctx) {
    const d = this.G.data;
    if (IMG.bg_rockpass) ctx.drawImage(IMG.bg_rockpass, 0, 0);
    ctx.fillStyle = 'rgba(24,20,37,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.ink; ctx.fillRect(0, 229, W, H - 229);
    this.menu.draw(ctx);
    // 파티 미리보기 (편성·장비가 바뀌면 바로 반영되게 매번 계산)
    this.builds = d.party.map(p => unitBuild(d, p.id));
    panel(ctx, 200, 24, 272, 150, { alpha: 0.88 });
    text(ctx, '지금 파티', 212, 32, { color: C.gold, size: 11 });
    const total = this.builds.reduce((a, b) => a + power(b), 0);
    text(ctx, `전투력 ${total}`, 462, 32, { color: C.yellow, size: 11, align: 'right' });
    this.builds.forEach((b, i) => {
      const x = 210 + i * 66, bob = Math.floor((this.t * 1000 + i * 200) / 450) % 2;
      sprite(ctx, lookImage(b.def.look), x, 54 + bob);
      text(ctx, b.name.length > 5 ? b.name.slice(0, 5) + '…' : b.name, x + 32, 120, { align: 'center', size: 10 });
      text(ctx, `${d.party[i].row === 'front' ? '앞줄' : '뒷줄'} · ${power(b)}`, x + 32, 132, { align: 'center', size: 10, color: C.mist });
      if (b.job) text(ctx, b.job.name, x + 32, 144, { align: 'center', size: 10, color: C.pink });
    });
    text(ctx, '※ M4 검수용 임시 거점 · 시작 지급: 운명석 300 · 의식권 10', 212, 160, { size: 10, color: C.slate });
    drawResources(ctx, d);
    text(ctx, '거점', 6, 3, { size: 10, color: C.gold });
  }
}
