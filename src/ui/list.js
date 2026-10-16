// 스크롤 목록: 마우스 휠, 끌어서 넘기기(휴대폰), 방향키. 줄을 누르면 고른다.
// drawRow(ctx, item, x, y, w, h, selected, index)
import { C } from '../core/render.js';
import { sfx } from '../core/audio.js';

export class ListView {
  constructor({ x, y, w, h, rowH = 20, items = [], drawRow, onSelect = null, onPick = null, selected = 0 }) {
    Object.assign(this, { x, y, w, h, rowH, items, drawRow, onSelect, onPick, selected });
    this.scroll = 0; this.keyboard = false;
  }
  setItems(items) { this.items = items; this.selected = Math.min(this.selected, Math.max(0, items.length - 1)); this.clamp(); }
  get maxScroll() { return Math.max(0, this.items.length * this.rowH - this.h); }
  clamp() { this.scroll = Math.max(0, Math.min(this.maxScroll, this.scroll)); }
  ensureVisible() {
    const top = this.selected * this.rowH;
    if (top < this.scroll) this.scroll = top;
    if (top + this.rowH > this.scroll + this.h) this.scroll = top + this.rowH - this.h;
    this.clamp();
  }
  inside(px, py) { return px >= this.x && px < this.x + this.w && py >= this.y && py < this.y + this.h; }
  // keys: false면 방향키를 쓰지 않는다 (다른 메뉴와 함께 쓸 때)
  update(G, dt, { keys = true } = {}) {
    const { input } = G, p = input.pointer;
    if (this.inside(p.x, p.y)) {
      if (p.wheel) { this.scroll += p.wheel * 0.5; this.clamp(); }
      if (p.down && p.moved) { this.scroll -= p.dragDY; this.clamp(); }
    }
    if (keys && this.items.length) {
      const prev = this.selected;
      if (input.pressed('up')) this.selected = Math.max(0, this.selected - 1);
      if (input.pressed('down')) this.selected = Math.min(this.items.length - 1, this.selected + 1);
      if (prev !== this.selected) { this.keyboard = true; sfx('move'); this.ensureVisible(); this.onSelect?.(this.items[this.selected], this.selected); }
      if (input.pressed('confirm')) { sfx('confirm'); this.onPick?.(this.items[this.selected], this.selected); }
    }
    if (p.tapped && this.inside(p.x, p.y)) {
      const i = Math.floor((p.y - this.y + this.scroll) / this.rowH);
      if (i >= 0 && i < this.items.length) {
        const again = i === this.selected;
        this.selected = i; this.keyboard = false; sfx('move');
        this.onSelect?.(this.items[i], i);
        if (again || !this.onSelect) this.onPick?.(this.items[i], i);
      }
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.beginPath(); ctx.rect(this.x, this.y, this.w, this.h); ctx.clip();
    const first = Math.floor(this.scroll / this.rowH), last = Math.min(this.items.length, first + Math.ceil(this.h / this.rowH) + 1);
    for (let i = first; i < last; i++) {
      const y = Math.round(this.y + i * this.rowH - this.scroll);
      if (i === this.selected) { ctx.fillStyle = 'rgba(254,174,52,0.18)'; ctx.fillRect(this.x, y, this.w, this.rowH); ctx.fillStyle = C.gold; ctx.fillRect(this.x, y, 2, this.rowH); }
      this.drawRow(ctx, this.items[i], this.x, y, this.w, this.rowH, i === this.selected, i);
    }
    ctx.restore();
    // 스크롤 막대
    if (this.maxScroll > 0) {
      const bh = Math.max(12, this.h * this.h / (this.items.length * this.rowH));
      const by = this.y + (this.h - bh) * (this.scroll / this.maxScroll);
      ctx.fillStyle = C.deep; ctx.fillRect(this.x + this.w - 3, this.y, 3, this.h);
      ctx.fillStyle = C.mist; ctx.fillRect(this.x + this.w - 3, Math.round(by), 3, Math.round(bh));
    }
  }
}
