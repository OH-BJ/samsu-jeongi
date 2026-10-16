// 툴팁: 마우스를 올리거나 휴대폰에서 길게 누르면 설명을 띄운다.
// 장면의 update에서 tooltip.check(G, 사각형, 글) 을 부르고, draw 끝에서 tooltip.draw(ctx)
import { panel, text, wrap, C } from '../core/render.js';
import { W, H } from '../core/screen.js';

let cur = null, hoverT = 0, lastKey = null;
export const tooltip = {
  begin() { cur = null; },
  check(G, x, y, w, h, msg) {
    const p = G.input.pointer;
    const inside = p.x >= x && p.x < x + w && p.y >= y && p.y < y + h;
    if (!inside || !p.active) return;
    if (lastKey !== msg) { lastKey = msg; hoverT = 0; }
    // 마우스는 0.4초 올려 두면, 터치는 길게 누르면
    if (p.long || (!p.down && hoverT > 0.4)) cur = { msg, x: p.x, y: p.y };
  },
  update(dt) { hoverT += dt; },
  draw(ctx) {
    if (!cur) return;
    const lines = wrap(ctx, cur.msg, 180, 10);
    const w = 196, h = lines.length * 13 + 10;
    const x = Math.min(W - w - 4, Math.max(4, cur.x + 8)), y = Math.min(H - h - 4, Math.max(4, cur.y - h - 6));
    panel(ctx, x, y, w, h, { fill: C.ink, border: C.mist, accent: C.mist });
    lines.forEach((l, k) => text(ctx, l, x + 8, y + 5 + k * 13, { size: 10, color: C.pale }));
  },
};
