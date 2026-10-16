// 캐릭터 키트 — 모든 아군·동료가 같은 규칙으로 얼굴/눈/머리를 갖도록 하는 도구
// 기준: 64×80 캔버스, 키 약 76px(3.3등신), 얼굴 폭 약 13px, 눈 4×5, 진한 외곽선
import { blank, set, get, ellipse, poly, line, shade, clone } from './lib.js';

const put = (g, x, y, c) => set(g, Math.round(x), Math.round(y), c);
export const PALE = ['f', 'i', 'v', 'z'];   // 애니풍 밝은 피부
const run = (g, y, x0, x1, c) => { for (let x = Math.round(x0); x <= Math.round(x1); x++) set(g, x, y, c); };

// 얼굴 폭 (위에서 아래로, 중심에서 반폭)
const FACE_HALF = [5, 6, 6, 7, 7, 7, 7, 7, 7, 6, 6, 5, 4, 2];
const FACE_WIDE = [6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 6, 5, 3];   // 치비(2.5등신)용

/**
 * 머리 한 개를 그려 격자로 돌려준다 (W×H 크기 캔버스 좌표 그대로)
 * o: { cx, top, hair:[광택,밝음,기본,어둠], skin:[밝음,기본,그늘,깊음], iris:[어둠,중간,밝음], eye:'cute'|'sharp',
 *      bangs:[...], lockL, lockR, mouth:'smile'|'neutral'|'grin'|'open', blush, brow }
 */
export function head(W, H, o) {
  const g = blank(W, H);
  const { cx, top } = o;
  const [sheen, hl, hb, hd] = o.hair;
  const [sk1, sk2, sk3] = o.skin;
  const faceTop = top + 8;

  // 1) 머리카락 덩어리 (뒤통수~정수리)
  const cap = blank(W, H);
  ellipse(cap, cx - 1, top + 10, o.capRx || 11, o.capRy || 10, '@');
  const capS = shade(cap, '@', [hl, hb, hd, hd], { hi: 2, lo: 3, deep: 6 });
  for (let i = 0; i < capS.px.length; i++) if (capS.px[i]) g.px[i] = capS.px[i];
  // 광택 띠 (정수리 둘레를 따라 호)
  for (let a = -0.9; a <= 0.5; a += 0.04) {
    const r = (o.capRx || 11) * 0.73;
    const x = cx - 1 + Math.sin(a) * r, y = top + 6 - Math.cos(a) * 3 + Math.abs(a) * 1.5 + (r - 8) * 0.4;
    put(g, x, y, sheen); if (a > -0.6 && a < 0.2) put(g, x, y + 1, hl);
  }
  if (o.shine !== false) { put(g, cx - 4, top + 4, 'W'); }

  // 2) 얼굴
  const FH = o.face === 'wide' ? FACE_WIDE : FACE_HALF;
  FH.forEach((hw, i) => {
    const y = faceTop + i;
    run(g, y, cx - hw, cx + hw, sk2);
    put(g, cx + hw, y, sk3);                           // 오른쪽(광원 반대) 그늘
    if (i < 2) run(g, y, cx - hw, cx + hw, sk3);       // 앞머리 그림자
  });
  // 볼 하이라이트
  put(g, cx - 5, faceTop + 6, sk1); put(g, cx - 4, faceTop + 7, sk1);

  // 3) 앞머리 (이마를 덮는 갈래, bangs[i] = 그 열에서 얼굴로 내려오는 길이)
  const bangs = o.bangs || [3, 4, 5, 3, 2, 4, 6, 4, 2, 3, 5, 4, 3, 2, 3];
  for (let i = 0; i < bangs.length; i++) {
    const x = cx - 7 + i;
    for (let y = top + 3; y < faceTop + bangs[i]; y++) put(g, x, y, y >= faceTop + bangs[i] - 1 ? hd : hb);
    if (bangs[i] >= 5) put(g, x, faceTop + 1, hl);
  }
  if (o.centerLock) {                                         // 눈 사이로 내려오는 한 가닥
    for (let k = 0; k < 5; k++) put(g, cx - 1 + (k > 2 ? 1 : 0), faceTop + k, k > 3 ? hd : hb);
  }
  // 4) 옆머리 (얼굴 양옆으로 흘러내림)
  const lock = (x0, len, dir) => {
    for (let k = 0; k < len; k++) {
      const y = faceTop + k, x = x0 + Math.round(Math.sin(k / 4) * dir);
      const w = k < len - 3 ? 3 : 2;
      for (let j = 0; j < w; j++) put(g, x + j * dir, y, j === 0 ? hl : (j === 1 ? hb : hd));
    }
  };
  if (o.lockL) lock(cx - 8, o.lockL, -1);
  if (o.lockR) lock(cx + 8, o.lockR, 1);

  // 5) 눈 (y: 얼굴 위에서 6~10번째 줄)
  const ey = faceTop + 6;
  const [i1, i2, i3] = o.iris;
  const eye = (x0, near) => {
    if (o.eye === 'anime') {                                  // 아치형 눈꺼풀, 세로로 긴 홍채, 반사점 2개
      const ox = near ? -1 : 4;
      put(g, x0 + 1, ey - 1, 'K'); put(g, x0 + 2, ey - 1, 'K'); put(g, x0 + ox, ey - 1, 'K');
      ['K', i1, i1, 'K'].forEach((c, j) => put(g, x0 + j, ey, c)); put(g, x0 + ox, ey, 'K');
      ['W', i1, 'K', i1].forEach((c, j) => put(g, x0 + j, ey + 1, c));
      ['W', i2, 'K', i2].forEach((c, j) => put(g, x0 + j, ey + 2, c));
      [i2, i3, i3, i2].forEach((c, j) => put(g, x0 + j, ey + 3, c));
      put(g, x0 + 1, ey + 4, i3); put(g, x0 + 2, ey + 4, 'W');
    } else if (o.eye === 'big') {                                     // 5×6 큰 눈 (치비)
      run(g, ey - 1, x0, x0 + 4, 'K'); run(g, ey, x0, x0 + 4, 'K');
      put(g, near ? x0 - 1 : x0 + 5, ey, 'K'); put(g, near ? x0 - 1 : x0 + 5, ey - 1, 'K'); put(g, near ? x0 - 2 : x0 + 6, ey - 2, 'K');
      ['W', 'W', i1, i1, i1].forEach((c, j) => put(g, x0 + j, ey + 1, c));
      ['W', i1, i2, i2, i1].forEach((c, j) => put(g, x0 + j, ey + 2, c));
      [i1, i2, 'K', i2, i1].forEach((c, j) => put(g, x0 + j, ey + 3, c));
      [i2, i3, i3, i3, 'W'].forEach((c, j) => put(g, x0 + j, ey + 4, c));
      run(g, ey + 5, x0 + 1, x0 + 3, i3);
    } else if (o.eye === 'sharp') {
      run(g, ey, x0 - (near ? 1 : 0), x0 + 3, 'K');         // 날카로운 윗눈꺼풀
      put(g, x0 + (near ? -1 : 4), ey - 1, 'K');
      ['W', i1, i1, i2].forEach((c, j) => put(g, x0 + j, ey + 1, c));
      [i1, i2, i3, i2].forEach((c, j) => put(g, x0 + j, ey + 2, c));
      run(g, ey + 3, x0 + 1, x0 + 2, sk3);
    } else {
      run(g, ey, x0, x0 + 3, 'K');                          // 윗눈꺼풀
      put(g, near ? x0 - 1 : x0 + 4, ey, 'K'); put(g, near ? x0 - 1 : x0 + 4, ey - 1, 'K'); // 바깥 속눈썹
      ['W', i1, i1, i1].forEach((c, j) => put(g, x0 + j, ey + 1, c));
      [i1, i2, i2, i1].forEach((c, j) => put(g, x0 + j, ey + 2, c));
      [i2, i3, i3, 'W'].forEach((c, j) => put(g, x0 + j, ey + 3, c));
      run(g, ey + 4, x0 + 1, x0 + 2, i3);
    }
  };
  if (o.eye === 'big') { eye(cx - 7, true); eye(cx + 3, false); }
  else if (o.eye === 'anime') { eye(cx - 5, true); eye(cx + 2, false); }
  else { eye(cx - 6, true); eye(cx + 2, false); }
  // 눈썹
  if (o.brow === true || (o.brow !== false && o.eye === 'sharp')) {
    const bc = o.browColor || hd;
    if (o.eye === 'sharp') { line(g, cx - 7, ey - 3, cx - 3, ey - 2, bc); line(g, cx + 2, ey - 2, cx + 6, ey - 3, bc); }
    else { run(g, ey - 2, cx - 6, cx - 4, bc); run(g, ey - 2, cx + 3, cx + 5, bc); }
  }
  // 6) 볼 홍조, 입
  if (o.eye === 'anime' && o.blush !== false) {             // 사선 홍조
    [[-6, 5], [-5, 6], [-4, 5], [4, 5], [5, 6], [6, 5]].forEach(([dx, dy]) => put(g, cx + dx, ey + dy, 'w'));
  } else if (o.blush !== false) { put(g, cx - 7, ey + 5, 'm'); put(g, cx - 6, ey + 6, 'm'); put(g, cx + 5, ey + 5, 'm'); put(g, cx + 6, ey + 6, 'm'); }
  const my = ey + (o.eye === 'big' ? 7 : 6);
  if (o.mouth === 'cat') { put(g, cx - 1, my, sk3); put(g, cx, my + 1, sk3); put(g, cx + 1, my, sk3); }
  else if (o.mouth === 'tiny') { put(g, cx, my, 'z'); put(g, cx, my + 1, 'w'); }
  else if (o.mouth === 'smile') { put(g, cx - 1, my, 'R'); put(g, cx, my, 'r'); }
  else if (o.mouth === 'grin') { run(g, my, cx - 1, cx + 1, 'K'); put(g, cx, my + 1, 'r'); put(g, cx + 1, my + 1, 'W'); }
  else if (o.mouth === 'open') { run(g, my, cx - 1, cx, 'K'); run(g, my + 1, cx - 1, cx, 'r'); }
  else { run(g, my, cx - 1, cx, sk3); }
  // 7) 목
  const nk = faceTop + FH.length;
  run(g, nk, cx - 2, cx + 1, sk3); run(g, nk + 1, cx - 2, cx + 1, sk2);
  return g;
}

// 길게 흘러내리는 뒷머리 (몸 뒤에 깔림)
export function longHair(W, H, { cx, y0, y1, width = 12, hair, sway = 0, tips = 3 }) {
  const g = blank(W, H);
  const [sheen, hl, hb, hd] = hair;
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / (y1 - y0);
    const w = Math.max(3, Math.round(width * (1 - t * 0.55)));
    const x0 = Math.round(cx - w / 2 - t * 4 + Math.sin(y / 6 + sway) * t * 2.5);
    for (let x = x0; x < x0 + w; x++) {
      const u = (x - x0) / w;
      set(g, x, y, u < 0.18 ? hl : u > 0.75 ? hd : hb);
    }
    if (y % 9 === 0) set(g, x0 + 2, y, sheen);
    // 끝은 갈래로 갈라짐
    if (y > y1 - 4) for (let k = 0; k < tips; k++) set(g, x0 + Math.round((k + 0.5) * w / tips), y, null);
  }
  return g;
}

// 지그재그 종이(시데)·리본 등에 쓰는 띠
export function zigzag(g, x, y, len, c1, c2, phase = 0) {
  for (let k = 0; k < len; k++) {
    const dx = ((k + phase) % 4 < 2) ? 0 : 1;
    set(g, x + dx, y + k, c1); set(g, x + dx + 1, y + k, c2);
  }
}

// ─────────────────────────────────────────────────────────────
// headSoft — 정면 치비 얼굴 (레퍼런스 분석: 가로로 넓은 눈 + 흰자, 넓고 둥근 볼, 눈 바로 아래 작은 입, 번지는 홍조,
//            눈꺼풀까지 내려오는 가는 앞머리 가닥). 48~64px 키 캐릭터용.
// o: { cx, top, hair:[광택,밝음,기본,어둠], skin:[밝음,기본,그늘,깊음], iris:[어둠,중간,밝음], mouth:'soft'|'open'|'smirk', capRx, capRy, lock }
const SOFT_FACE = [7, 9, 10, 10, 11, 11, 11, 11, 11, 11, 10, 10, 9, 8, 6, 3];
const SOFT_EYE = ['.KKKKK.', 'KK111KK', 'W1WK11W', 'W12K22W', '.22332.', '..zzz..'];
export function headSoft(W, H, o) {
  const g = blank(W, H);
  const { cx, top } = o;
  const [sheen, hl, hb, hd] = o.hair;
  const [s1, s2, s3, s4] = o.skin;
  const [i1, i2, i3] = o.iris;
  const faceTop = top + 9;
  // 머리 덩어리
  const cap = blank(W, H);
  ellipse(cap, cx - 0.5, top + 12, o.capRx || 14, o.capRy || 13, '@');
  const capS = shade(cap, '@', [hl, hb, hd, hd], { hi: 2, lo: 3, deep: 7 });
  capS.px.forEach((c, i) => { if (c) g.px[i] = c; });
  // 광택 띠: 정수리를 가로지르는 밝은 호 + 짧은 끊김
  for (let x = -8; x <= 8; x++) {
    const y = top + 3 + Math.round((x * x) / 16);
    if (Math.abs(x) % 4 !== 3) { put(g, cx + x, y, sheen); put(g, cx + x, y + 1, hl); }
  }
  // 얼굴
  SOFT_FACE.forEach((hw, i) => {
    const y = faceTop + i;
    run(g, y, cx - hw, cx + hw - 1, s2);
    put(g, cx - hw, y, s3); put(g, cx + hw - 1, y, s3);
    if (i >= 13) run(g, y, cx - hw, cx + hw - 1, s3);
  });
  run(g, faceTop + SOFT_FACE.length, cx - 2, cx + 1, s3);                    // 목
  // 앞머리: 가는 가닥들이 눈꺼풀까지. 가닥마다 오른쪽에 진한 구분선
  const strands = o.strands || [[-11, 5], [-9, 8], [-6, 6], [-4, 9], [-1, 5], [1, 8], [4, 6], [6, 9], [9, 7]];
  for (const [dx, len] of strands) {
    const dir = dx < 0 ? -1 : 1;
    for (let k = 0; k < len; k++) {
      const w = k < len - 3 ? 3 : k < len - 1 ? 2 : 1;
      const sx = cx + dx + Math.round(k * dir * 0.3) + (k > len - 3 ? (dir > 0 ? 1 : 0) : 0);
      for (let j = 0; j < w; j++) put(g, sx + j, faceTop - 2 + k, j === (dir > 0 ? 0 : w - 1) ? hl : hb);
      put(g, dir > 0 ? sx + w : sx - 1, faceTop - 2 + k, hd);
    }
  }
  for (let x = cx - 11; x <= cx + 10; x++) for (let y = top + 6; y < faceTop - 1; y++) if (get(g, x, y) === s2) put(g, x, y, hb);
  // 옆머리 (볼을 감싸며 턱까지)
  const lock = (x0, dir) => {
    for (let k = 0; k < (o.lock || 14); k++) {
      const y = faceTop + k, x = x0 + Math.round(Math.sin(k / 5) * dir);
      [hl, hb, hb, hd].forEach((c, j) => put(g, x + j * dir, y, c));
    }
  };
  lock(cx - 11, -1); lock(cx + 10, 1);
  // 눈 (가로로 넓은 6×6, 흰자 포함) — 왼쪽 눈은 그대로, 오른쪽 눈은 좌우 반전
  const ey = faceTop + 6;
  const col = ch => ({ '1': i1, '2': i2, '3': i3, z: s4, K: 'K', W: 'W' }[ch]);
  SOFT_EYE.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch === '.') return;
    put(g, cx - 10 + i, ey - 1 + j, col(ch));
    put(g, cx + 9 - i, ey - 1 + j, col(ch));
  }));
  // 홍조 (눈 밑 번짐), 코, 입
  [[-9, 5], [-8, 5], [-7, 5], [-8, 6], [7, 5], [6, 5], [8, 5], [7, 6]].forEach(([dx, dy]) => put(g, cx + dx, ey + dy, (dx + dy) % 2 ? 'w' : s3));
  put(g, cx - 1, ey + 4, s3);
  const my = ey + 6;
  if (o.mouth === 'open') { run(g, my, cx - 2, cx + 1, s4); run(g, my + 1, cx - 2, cx + 1, 'R'); put(g, cx - 1, my + 1, 'w'); put(g, cx, my + 1, 'w'); run(g, my + 2, cx - 1, cx, s4); }
  else if (o.mouth === 'smirk') { put(g, cx - 1, my, s4); put(g, cx, my, s4); put(g, cx + 1, my - 1, s4); }
  else { put(g, cx - 1, my, s4); put(g, cx, my, 'R'); put(g, cx - 1, my + 1, s3); put(g, cx, my + 1, s3); }
  return g;
}
