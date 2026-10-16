// 토스트: 화면 위쪽에 잠깐 떴다 사라지는 알림. 모든 장면 위에 그린다.
import { panel, text, measure, C } from '../core/render.js';
import { W } from '../core/screen.js';

const list = [];
export function toast(msg, { color = C.white, ms = 1800 } = {}) { list.push({ msg, color, t: 0, ms }); if (list.length > 3) list.shift(); }

export function updateToasts(dt) {
  for (let i = list.length - 1; i >= 0; i--) { list[i].t += dt * 1000; if (list[i].t > list[i].ms) list.splice(i, 1); }
}
export function drawToasts(ctx) {
  list.forEach((t, k) => {
    const w = Math.ceil(measure(ctx, t.msg)) + 24;
    const slide = Math.min(1, t.t / 150, (t.ms - t.t) / 200);
    const y = 6 + k * 24 - (1 - slide) * 20;
    ctx.globalAlpha = slide;
    panel(ctx, (W - w) / 2, y, w, 20, { fill: C.ink, border: C.gold });
    text(ctx, t.msg, W / 2, y + 4, { color: t.color, align: 'center', alpha: slide });
    ctx.globalAlpha = 1;
  });
}
