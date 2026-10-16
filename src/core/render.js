// 그리기 도우미: 글자, 창, 막대, 스프라이트
export const C = {
  ink: '#181425', night: '#262b44', deep: '#3a4466', slate: '#5a6988', mist: '#8b9bb4', pale: '#c0cbdc', white: '#f4f4f4',
  gold: '#feae34', yellow: '#fee761', orange: '#f77622', red: '#e43b44', green: '#63c74d', cyan: '#2ce8f5', blue: '#0099db', pink: '#f6757a',
};
export const FONT = 'Galmuri11';

export function text(ctx, s, x, y, { color = C.white, align = 'left', size = 12, shadow = true, alpha = 1 } = {}) {
  ctx.font = `${size}px ${FONT}, monospace`;
  ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.globalAlpha = alpha;
  if (shadow) { ctx.fillStyle = C.ink; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1); }
  ctx.fillStyle = color; ctx.fillText(s, Math.round(x), Math.round(y));
  ctx.globalAlpha = 1;
}

export function measure(ctx, s, size = 12) { ctx.font = `${size}px ${FONT}, monospace`; return ctx.measureText(s).width; }

// 폭에 맞춰 줄바꿈 (한국어는 글자 단위로 끊고, 공백이 있으면 공백에서 끊는다)
export function wrap(ctx, s, maxW, size = 12) {
  const lines = [];
  for (const para of s.split('\n')) {
    let line = '';
    for (const ch of para) {
      const t = line + ch;
      if (measure(ctx, t, size) > maxW && line) {
        const sp = line.lastIndexOf(' ');
        if (sp > 0 && ch !== ' ') { lines.push(line.slice(0, sp)); line = line.slice(sp + 1) + ch; }
        else { lines.push(line); line = ch === ' ' ? '' : ch; }
      } else line = t;
    }
    lines.push(line);
  }
  return lines;
}

// 도트 창: 바깥 테두리 + 안쪽 밝은 선 + 모서리 장식
export function panel(ctx, x, y, w, h, { fill = C.night, border = C.pale, accent = C.gold, alpha = 0.94 } = {}) {
  x = Math.round(x); y = Math.round(y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.ink; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = border;
  ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
  ctx.fillRect(x + 1, y + 1, 1, h - 2); ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
  ctx.fillStyle = C.deep; ctx.fillRect(x + 3, y + h - 3, w - 6, 1);
  ctx.fillStyle = accent;
  for (const [cx, cy] of [[x, y], [x + w - 3, y], [x, y + h - 3], [x + w - 3, y + h - 3]]) ctx.fillRect(cx, cy, 3, 3);
}

export function bar(ctx, x, y, w, h, ratio, color = C.green, back = C.ink) {
  ctx.fillStyle = back; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x + 1, y + 1, Math.max(0, Math.round((w - 2) * Math.min(1, ratio))), h - 2);
}

export function sprite(ctx, img, x, y, { flip = false, alpha = 1, scale = 1, sx = 0, sy = 0, sw, sh } = {}) {
  if (!img) return;
  sw ??= img.width; sh ??= img.height;
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.save(); ctx.translate(Math.round(x) + sw * scale, Math.round(y)); ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw * scale, sh * scale); ctx.restore();
  } else ctx.drawImage(img, sx, sy, sw, sh, Math.round(x), Math.round(y), sw * scale, sh * scale);
  ctx.globalAlpha = 1;
}

export function shadow(ctx, cx, cy, w) {
  ctx.fillStyle = 'rgba(24,20,37,0.35)';
  ctx.fillRect(Math.round(cx - w / 2), Math.round(cy - 2), w, 4);
  ctx.fillRect(Math.round(cx - w / 2 + 2), Math.round(cy - 3), w - 4, 6);
}
