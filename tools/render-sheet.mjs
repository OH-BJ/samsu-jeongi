// 도트 데이터를 확대 PNG 시트로 뽑는다 (검토·내보내기용)
// 사용법: node tools/render-sheet.mjs <sprite 모듈 경로> [배율=6] [출력 경로]
//         node tools/render-sheet.mjs all   → art/manifest.js 의 전부를 assets/sheets/ 에
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { toRGBA } from '../art/lib.js';

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function png(w, h, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

export function sheet(spr, scale = 6, bg = [58, 68, 102]) {
  const anims = Object.entries(spr.anims);
  const fw = spr.w, fh = spr.h, pad = 2;
  const cols = Math.max(...anims.map(([, a]) => a.frames.length));
  const W = (cols * (fw + pad) + pad) * scale, H = (anims.length * (fh + pad) + pad) * scale;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) { const cx = Math.floor((i % W) / (4 * scale)), cy = Math.floor(Math.floor(i / W) / (4 * scale)); const d = (cx + cy) % 2 ? 0 : 10; out[i * 4] = bg[0] + d; out[i * 4 + 1] = bg[1] + d; out[i * 4 + 2] = bg[2] + d; out[i * 4 + 3] = 255; }
  anims.forEach(([, a], row) => a.frames.forEach((g, col) => {
    const px = toRGBA(g);
    const ox = (pad + col * (fw + pad)) * scale, oy = (pad + row * (fh + pad)) * scale;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const s = (y * g.w + x) * 4;
      if (!px[s + 3]) continue;
      for (let j = 0; j < scale; j++) for (let i = 0; i < scale; i++) {
        const d = ((oy + y * scale + j) * W + ox + x * scale + i) * 4;
        out[d] = px[s]; out[d + 1] = px[s + 1]; out[d + 2] = px[s + 2]; out[d + 3] = 255;
      }
    }
  }));
  return png(W, H, out);
}

const [, , target, scaleArg, outArg] = process.argv;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const scale = +(scaleArg || 6);
if (target === 'all') {
  const { MANIFEST } = await import(pathToFileURL(path.join(root, 'art/manifest.js')));
  mkdirSync(path.join(root, 'assets/sheets'), { recursive: true });
  for (const p of MANIFEST) {
    const spr = (await import(pathToFileURL(path.join(root, 'art', p)))).default;
    writeFileSync(path.join(root, 'assets/sheets', spr.id + '.png'), sheet(spr, scale));
    console.log('ok', spr.id);
  }
} else {
  const spr = (await import(pathToFileURL(path.resolve(target)))).default;
  const out = outArg || path.join(root, 'assets/sheets', spr.id + '.png');
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, sheet(spr, scale));
  console.log('wrote', out);
}
