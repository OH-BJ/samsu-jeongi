import { DRAWN } from '../../data/companions.js';
// 그림 불러오기. 실패한 그림은 null로 두고 계속 진행한다 (화면이 통째로 멈추지 않게).
export const IMG = {};

export const IMAGES = {
  bg_rockpass: 'assets/pixellab/bg/rock-pass.png',
  boss_urs: 'assets/pixellab/boss/urs-king.png',
  golem: 'assets/pixellab/golem/east.png',
  iro: 'assets/pixellab/side/iro.png',
  serin: 'assets/pixellab/side/serin.png',
  haram: 'assets/pixellab/side/haram.png',
  museoe: 'assets/pixellab/museoe/south-west.png',
  // 뽑기 동료 (픽셀랩)
  ...Object.fromEntries(DRAWN.map(id => ['c_' + id, `assets/pixellab/companions/${id}.png`])),
};

export function loadImages(map = IMAGES, onProgress) {
  const keys = Object.keys(map);
  let done = 0;
  return Promise.all(keys.map(k => new Promise(res => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; res(); onProgress?.(++done / keys.length); };
    im.onerror = () => { IMG[k] = null; console.warn('그림 불러오기 실패:', map[k]); res(); onProgress?.(++done / keys.length); };
    im.src = map[k];
  })));
}

// 글자 격자로 그린 도트(art/sprites/...)를 캔버스 프레임으로 바꾼다. 예: GRID.hands = [바위, 가위, 보]
import { toRGBA } from '../../art/lib.js';
export const GRID = {};
export async function loadGrid(key, path, anim) {
  try {
    const m = (await import('../../art/sprites/' + path + '.js')).default;
    const a = anim ? m.anims[anim] : Object.values(m.anims)[0];
    GRID[key] = a.frames.map(g => {
      const c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
      c.getContext('2d').putImageData(new ImageData(toRGBA(g), g.w, g.h), 0, 0);
      return c;
    });
  } catch (e) { console.warn('도트 불러오기 실패:', path, e); GRID[key] = []; }
}

// 적 모습: 그림 + 정수배 확대 + 색 곱하기를 한 번만 만들어 둔다
const lookCache = new Map();
export function lookImage(look) {
  const key = JSON.stringify(look);
  if (lookCache.has(key)) return lookCache.get(key);
  const src = IMG[look.sprite];
  if (!src) return null;
  const s = look.scale || 1, c = document.createElement('canvas');
  c.width = src.width * s; c.height = src.height * s;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  if (look.flip) { x.translate(c.width, 0); x.scale(-1, 1); }
  x.drawImage(src, 0, 0, c.width, c.height);
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (look.tint) {
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data, [r, g, b] = look.tint;
    for (let i = 0; i < p.length; i += 4) { p[i] = Math.min(255, p[i] * r); p[i + 1] = Math.min(255, p[i + 1] * g); p[i + 2] = Math.min(255, p[i + 2] * b); }
    x.putImageData(d, 0, 0);
  }
  lookCache.set(key, c);
  return c;
}
