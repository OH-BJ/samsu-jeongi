// 버튼 묶음: 방향키로 포커스 이동, 확인 키로 선택, 탭으로 바로 선택
import { sfx } from '../core/audio.js';

export class Menu {
  // layout: 'vertical' | 'horizontal', columns > 1 이면 격자
  constructor(buttons, { layout = 'vertical', index = 0, onCancel = null, columns = 1 } = {}) {
    this.buttons = buttons; this.layout = layout; this.index = index; this.onCancel = onCancel; this.columns = columns;
    this.keyboard = false; // 키보드를 쓰기 시작하면 포커스 표시
  }
  update(G, dt) {
    const { input } = G, n = this.buttons.length;
    const prev = this.layout === 'vertical' ? 'up' : 'left', next = this.layout === 'vertical' ? 'down' : 'right';
    const step = d => {
      this.keyboard = true;
      for (let i = 1; i <= n; i++) { const j = (this.index + d * i + n * n) % n; if (!this.buttons[j].disabled) { this.index = j; break; } }
      sfx('move');
    };
    if (this.columns > 1) {
      // 격자: 좌우 1칸, 위아래 한 줄
      if (input.pressed('left')) step(-1);
      if (input.pressed('right')) step(1);
      if (input.pressed('up')) step(-this.columns);
      if (input.pressed('down')) step(this.columns);
    } else {
      if (input.pressed(prev)) step(-1);
      if (input.pressed(next)) step(1);
    }
    if (input.pointer.pressed) this.keyboard = false;
    this.buttons.forEach((b, i) => {
      b.focus = this.keyboard && i === this.index;
      if (b.update(G, dt)) this.index = i;
    });
    if (input.pressed('confirm')) this.buttons[this.index]?.click();
    else if (input.pressed('cancel') && this.onCancel) { sfx('cancel'); this.onCancel(); }
  }
  draw(ctx) { this.buttons.forEach(b => b.draw(ctx)); }
}
