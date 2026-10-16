// 아이콘: 장비(무기는 건틀릿 도트, 방어구·장신구는 등급색 도형으로 임시), 동료 얼굴, 등급 테두리
import { GRID, lookImage } from '../core/assets.js';
import { RARITY } from '../../data/rarity.js';
import { WEAPON_ICON_ROW } from '../../data/equipment.js';
import { ALL_UNITS } from '../../data/companions.js';
import { C } from '../core/render.js';

export const rarityColor = r => (r === 'X' ? rainbow() : RARITY[r].color);
export const rarityGlow = r => (r === 'X' ? rainbow() : RARITY[r].glow);
function rainbow() { const h = (performance.now() / 8) % 360; return `hsl(${h},90%,65%)`; }

// 24×24 장비 아이콘
export function drawItemIcon(ctx, item, x, y) {
  x = Math.round(x); y = Math.round(y);
  const col = rarityColor(item.rarity), glow = rarityGlow(item.rarity);
  if (item.slot === 'weapon' && GRID.gauntlets?.length) { ctx.drawImage(GRID.gauntlets[WEAPON_ICON_ROW[item.rarity]], x, y); return; }
  ctx.fillStyle = C.ink;
  if (item.slot === 'armor') {
    // 방패 모양 조끼
    ctx.fillRect(x + 4, y + 3, 16, 14); ctx.fillRect(x + 6, y + 17, 12, 3); ctx.fillRect(x + 9, y + 20, 6, 2);
    ctx.fillStyle = col; ctx.fillRect(x + 5, y + 4, 14, 12); ctx.fillRect(x + 7, y + 16, 10, 3); ctx.fillRect(x + 10, y + 19, 4, 2);
    ctx.fillStyle = glow; ctx.fillRect(x + 6, y + 5, 3, 8);
    ctx.fillStyle = C.ink; ctx.fillRect(x + 11, y + 4, 2, 14);
  } else {
    // 반지
    ctx.fillRect(x + 6, y + 9, 12, 12); ctx.fillStyle = col; ctx.fillRect(x + 7, y + 10, 10, 10);
    ctx.fillStyle = C.ink; ctx.fillRect(x + 9, y + 12, 6, 6);
    ctx.fillStyle = C.ink; ctx.fillRect(x + 9, y + 3, 6, 6); ctx.fillStyle = glow; ctx.fillRect(x + 10, y + 4, 4, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 10, y + 4, 1, 1);
  }
}

// 32×32 얼굴 (전투 그림의 머리 부분을 잘라 쓴다)
export function drawFace(ctx, id, x, y, size = 32) {
  const d = ALL_UNITS[id];
  const im = d && lookImage(d.look);
  if (!im) return;
  const sx = Math.round(im.width / 2 - size / 2), sy = 4;
  ctx.drawImage(im, sx, sy, size, size, Math.round(x), Math.round(y), size, size);
}

// 등급 테두리 칸
export function rarityBox(ctx, x, y, w, h, r, { fill = C.ink } = {}) {
  ctx.fillStyle = rarityColor(r); ctx.fillRect(Math.round(x), Math.round(y), w, h);
  ctx.fillStyle = fill; ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, w - 2, h - 2);
}
