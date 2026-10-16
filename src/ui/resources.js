// 위쪽 재화 줄
import { text, measure, C } from '../core/render.js';
import { W } from '../core/screen.js';

export const RES = {
  stones: ['운명석', C.cyan], gold: ['금화', C.gold], jobTicket: ['의식권', C.pink], enhance: ['강화석', C.orange],
  rerollStone: ['재련석', C.green], protect: ['보호 부적', C.yellow], shards: ['조각', C.mist],
};

export function drawResources(ctx, data, keys = ['stones', 'gold', 'jobTicket', 'enhance', 'rerollStone', 'protect', 'shards'], y = 3) {
  ctx.fillStyle = 'rgba(24,20,37,0.85)'; ctx.fillRect(0, 0, W, 17);
  let x = W - 6;
  for (const k of [...keys].reverse()) {
    const [name, col] = RES[k];
    const v = String(data[k] ?? 0), vw = Math.ceil(measure(ctx, v, 10)), nw = Math.ceil(measure(ctx, name, 10));
    text(ctx, v, x, y, { size: 10, align: 'right', color: C.white });
    text(ctx, name, x - vw - 3, y, { size: 10, align: 'right', color: col });
    x -= vw + nw + 12;
  }
}
