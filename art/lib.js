// 도트 격자 도구 — 브라우저와 Node 양쪽에서 쓴다.
// 격자(grid) = { w, h, px: 길이 w*h 배열 (팔레트 키 또는 null) }
import { PALETTE, DARKER } from './palette.js';

export function parse(rows) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const px = new Array(w * h).fill(null);
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.' && r[x] !== ' ') px[y * w + x] = r[x]; });
  return { w, h, px };
}
// 왼쪽 절반만 그린 줄들을 좌우대칭으로 완성 (가운데 열 중복 여부 선택)
export function mirror(rows, { center = false } = {}) {
  return rows.map(r => r + r.split('').reverse().join('').slice(center ? 1 : 0));
}
export const blank = (w, h) => ({ w, h, px: new Array(w * h).fill(null) });
// 좌표로 그리기: segs = [[y, x, '색글자들'], ...]  ('.' 은 건너뜀)
export function draw(w, h, segs) {
  const g = blank(w, h);
  for (const [y, x, s] of segs) for (let i = 0; i < s.length; i++) if (s[i] !== '.') set(g, x + i, y, s[i]);
  return g;
}
export const clone = g => ({ w: g.w, h: g.h, px: g.px.slice() });
export const get = (g, x, y) => (x < 0 || y < 0 || x >= g.w || y >= g.h) ? null : g.px[y * g.w + x];
export function set(g, x, y, c) { if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.px[y * g.w + x] = c; }

// src 를 dst 의 (x, y) 에 덮어쓴다 (투명 픽셀은 무시)
export function paste(dst, src, x = 0, y = 0) {
  if (Array.isArray(src)) src = parse(src);
  for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) {
    const c = src.px[j * src.w + i];
    if (c) set(dst, x + i, y + j, c);
  }
  return dst;
}
// 여러 층을 순서대로 합성: [[grid, x, y], ...]
export function compose(w, h, layers) {
  const g = blank(w, h);
  for (const [src, x, y] of layers) if (src) paste(g, src, x | 0, y | 0);
  return g;
}
export function flipX(g) {
  const o = blank(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) o.px[y * g.w + (g.w - 1 - x)] = g.px[y * g.w + x];
  return o;
}
export function recolor(g, map) {
  const o = clone(g);
  o.px = o.px.map(c => (c && map[c]) ? map[c] : c);
  return o;
}
// y0~y1 줄 띠를 dy 만큼 세로 이동 (숨쉬기 애니메이션용)
export function shiftBand(g, y0, y1, dy) {
  const o = clone(g);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < g.w; x++) o.px[y * g.w + x] = null;
  for (let y = y0; y <= y1; y++) for (let x = 0; x < g.w; x++) {
    const c = g.px[y * g.w + x];
    if (c) set(o, x, y + dy, c);
  }
  // 띠가 위로 올라가며 생긴 빈 줄은 원래 픽셀로 메운다
  if (dy > 0) for (let y = y0; y < y0 + dy; y++) for (let x = 0; x < g.w; x++) if (!get(o, x, y) && get(g, x, y)) set(o, x, y, get(g, x, y));
  if (dy < 0) for (let y = y1 + dy + 1; y <= y1; y++) for (let x = 0; x < g.w; x++) if (!get(o, x, y) && get(g, x, y)) set(o, x, y, get(g, x, y));
  return o;
}
// 바깥 외곽선. mode: 'solid' = 모두 K / 'selective' = 이웃 색보다 어두운 색
export function outline(g, { color = 'K', mode = 'solid', diagonal = false } = {}) {
  const o = clone(g);
  const dirs = diagonal ? [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] : [[1,0],[-1,0],[0,1],[0,-1]];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (get(g, x, y)) continue;
    let nb = null;
    for (const [dx, dy] of dirs) { const c = get(g, x + dx, y + dy); if (c) { nb = c; break; } }
    if (!nb) continue;
    if (mode === 'solid') set(o, x, y, color);
    else { let c = DARKER[nb] || 'K'; c = DARKER[c] || c; set(o, x, y, c === nb ? 'K' : c); }
  }
  return o;
}
// 마스크 모양에 왼쪽 위 광원 음영을 자동으로 넣는다 (큰 보스용)
// ramp = [하이라이트, 기본, 그림자, 깊은 그림자]
export function shade(g, key, ramp, { hi = 2, lo = 2, deep = 4 } = {}) {
  const o = clone(g);
  const inside = (x, y) => get(g, x, y) === key;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (!inside(x, y)) continue;
    let c = ramp[1];
    if (!inside(x + deep, y + deep)) c = ramp[3];
    if (!inside(x + lo, y + lo)) c = ramp[2];
    if (!inside(x - hi, y - hi)) c = ramp[0];
    set(o, x, y, c);
  }
  return o;
}
// 실루엣의 한쪽 가장자리를 한 단계 어둡게 (좌우대칭 그림에 광원 방향을 주기 위함)
// dir: [1,0] = 오른쪽 가장자리, depth: 가장자리에서 몇 칸까지
export function edgeDarken(g, { dir = [1, 0], depth = 2, minX = 0 } = {}) {
  const o = clone(g);
  for (let y = 0; y < g.h; y++) for (let x = minX; x < g.w; x++) {
    const c = get(g, x, y);
    if (!c || c === 'K') continue;
    for (let d = 1; d <= depth; d++) {
      const n = get(g, x + dir[0] * d, y + dir[1] * d);
      if (!n || n === 'K') { set(o, x, y, DARKER[c] || c); break; }
    }
  }
  return o;
}
// ── 도형 (큰 스프라이트용) ──
export function ellipse(g, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1) set(g, x, y, c);
  }
  return g;
}
export function rect(g, x0, y0, w, h, c) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(g, x, y, c); return g; }
export function poly(g, pts, c) {
  const ys = pts.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      const yy = y + 0.5;
      if ((y1 <= yy && y2 > yy) || (y2 <= yy && y1 > yy)) xs.push(x1 + (yy - y1) / (y2 - y1) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) set(g, x, y, c);
  }
  return g;
}
export function line(g, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) set(g, Math.round(x0 + (x1 - x0) * i / (n || 1)), Math.round(y0 + (y1 - y0) * i / (n || 1)), c);
  return g;
}
// 한 부품: 모양을 그리는 함수 → 자동 음영 → 격자
export function part(w, h, shapeFn, ramp, opt) {
  const g = blank(w, h);
  shapeFn(g, '@');
  return shade(g, '@', ramp, opt);
}
// 사용된 색 목록
export const colorsUsed = g => [...new Set(g.px.filter(Boolean))];

// RGBA 버퍼로 변환
export function toRGBA(g) {
  const buf = new Uint8ClampedArray(g.w * g.h * 4);
  g.px.forEach((c, i) => {
    if (!c) return;
    const hex = PALETTE[c] || '#ff00ff';
    buf[i * 4] = parseInt(hex.slice(1, 3), 16);
    buf[i * 4 + 1] = parseInt(hex.slice(3, 5), 16);
    buf[i * 4 + 2] = parseInt(hex.slice(5, 7), 16);
    buf[i * 4 + 3] = 255;
  });
  return buf;
}
