// 대화창 장면: 글자가 한 자씩 나오고, 탭/확인으로 넘긴다. 선택지도 지원.
// lines: [{ name?, text, portrait?(이미지) }, ...]
// 쓰는 법: const d = new DialogScene(G, lines, { choices }); G.scenes.push(d); const pick = await d.promise;
import { panel, text, wrap, measure, C } from '../core/render.js';
import { W, H } from '../core/screen.js';
import { sfx } from '../core/audio.js';
import { Button } from './button.js';
import { Menu } from './menu.js';

const BOX = { x: 8, y: H - 76, w: W - 16, h: 68 };
const SPEED = [0, 25, 45, 90]; // 설정의 글자 속도 → 초당 글자 수 (0 = 즉시)

export class DialogScene {
  constructor(G, lines, { choices = null } = {}) {
    this.G = G; this.lines = lines; this.i = 0; this.shown = 0; this.t = 0;
    this.choices = choices; this.menu = null; this.opaque = false;
    this.promise = new Promise(res => (this.resolve = res));
  }
  get line() { return this.lines[this.i]; }
  finishLine() { this.shown = Infinity; }
  advance() {
    if (this.i < this.lines.length - 1) { this.i++; this.shown = 0; sfx('move'); return; }
    if (this.choices && !this.menu) { this.openChoices(); return; }
    if (!this.choices) this.close(null);
  }
  openChoices() {
    const n = this.choices.length, bw = 150, bh = 24;
    const btns = this.choices.map((label, k) => new Button({ x: W - bw - 12, y: BOX.y - 6 - (n - k) * (bh + 4), w: bw, h: bh, label, onClick: () => this.close(k) }));
    this.menu = new Menu(btns);
    this.menu.keyboard = true;
  }
  close(result) { this.G.scenes.pop(); this.resolve(result); }
  update(dt) {
    const { input } = this.G;
    if (this.menu) { this.menu.update(this.G, dt); return; }
    const full = this.line.text.length;
    const speed = SPEED[this.G.settings.textSpeed] ?? 45;
    if (this.shown < full) {
      const before = Math.floor(this.shown);
      this.shown = speed ? Math.min(full, this.shown + speed * dt) : full;
      if (Math.floor(this.shown) > before && before % 2 === 0) sfx('type');
    }
    this.t += dt;
    if (input.pressed('confirm') || input.pointer.tapped || input.pressed('cancel')) {
      if (this.shown < full) this.finishLine(); else this.advance();
    }
  }
  draw(ctx) {
    const L = this.line;
    panel(ctx, BOX.x, BOX.y, BOX.w, BOX.h);
    let tx = BOX.x + 12;
    if (L.portrait) {
      ctx.drawImage(L.portrait, BOX.x + 6, BOX.y + BOX.h - L.portrait.height - 4);
      tx = BOX.x + L.portrait.width + 12;
    }
    if (L.name) {
      const nw = Math.max(48, Math.ceil(measure(ctx, L.name)) + 20);
      panel(ctx, BOX.x + 6, BOX.y - 14, nw, 18, { fill: C.deep, border: C.gold });
      text(ctx, L.name, BOX.x + 6 + nw / 2, BOX.y - 11, { color: C.gold, align: 'center' });
    }
    const lines = wrap(ctx, L.text, BOX.x + BOX.w - tx - 12);
    let left = Math.floor(this.shown);
    lines.slice(0, 3).forEach((ln, k) => {
      const part = ln.slice(0, Math.max(0, left)); left -= ln.length;
      text(ctx, part, tx, BOX.y + 12 + k * 17);
    });
    if (this.shown >= L.text.length && !this.menu && Math.floor(this.t * 3) % 2 === 0) text(ctx, '▼', BOX.x + BOX.w - 18, BOX.y + BOX.h - 16, { color: C.gold, size: 10 });
    this.menu?.draw(ctx);
  }
}
