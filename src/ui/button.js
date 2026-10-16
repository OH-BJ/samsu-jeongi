// 버튼: 탭/클릭, 마우스 올림, 키보드 포커스. 휴대폰 손가락 크기를 위해 최소 30×30(기준 해상도)
import { panel, text, C } from '../core/render.js';
import { sfx } from '../core/audio.js';

export class Button {
  constructor({ x, y, w, h = 24, label = '', onClick, icon = null, sub = '', disabled = false, size = 12 }) {
    Object.assign(this, { x, y, w: Math.max(30, w), h: Math.max(24, h), label, onClick, icon, sub, disabled, size });
    this.focus = false; this.pressT = 0;
  }
  update(G, dt) {
    const { input } = G;
    this.hover = !this.disabled && input.over(this.x, this.y, this.w, this.h);
    this.pressT = Math.max(0, this.pressT - dt);
    if (!this.disabled && input.tappedIn(this.x, this.y, this.w, this.h)) { this.click(); return true; }
    return false;
  }
  click() { if (this.disabled) return; this.pressT = 0.1; sfx('confirm'); this.onClick?.(this); }
  draw(ctx) {
    const on = this.focus || this.hover;
    const dy = this.pressT > 0 ? 1 : 0;
    panel(ctx, this.x, this.y + dy, this.w, this.h, {
      fill: this.disabled ? C.night : on ? C.deep : C.night,
      border: this.disabled ? C.slate : on ? C.gold : C.pale,
      accent: on ? C.yellow : C.gold,
    });
    let tx = this.x + this.w / 2, align = 'center';
    if (this.icon) {
      const iy = this.y + dy + Math.round((this.h - this.icon.height) / 2);
      ctx.drawImage(this.icon, this.x + 4, iy - (on ? 1 : 0));
      tx = this.x + this.icon.width + 10; align = 'left';
    }
    const col = this.disabled ? C.slate : on ? C.gold : C.white;
    if (this.sub) {
      text(ctx, this.label, tx, this.y + dy + this.h / 2 - 12, { color: col, align, size: this.size });
      text(ctx, this.sub, tx, this.y + dy + this.h / 2 + 2, { color: C.mist, align, size: 10 });
    } else text(ctx, this.label, tx, this.y + dy + (this.h - this.size) / 2, { color: col, align, size: this.size });
  }
}
