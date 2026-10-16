// 이야기 배경. 픽셀랩 그림이 있는 곳(반석국)은 그림을 쓰고, 세갈래 마을은 아직 그림이 없어 코드로 그린다 (임시)
import { W, H } from '../core/screen.js';
import { IMG } from '../core/assets.js';

const SKY = {
  village: ['#7fc8f8', '#c8ecff', '#f4f4c8'],
  village_dusk: ['#3a2a5e', '#d77643', '#feae34'],
  village_night: ['#0b0a1a', '#181425', '#262b44'],
};

function band(ctx, y0, y1, colors) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0);
}

// 세갈래 마을: 하늘, 언덕, 지붕들, 우물, 들판
function village(ctx, key, t) {
  const night = key === 'village_night', dusk = key === 'village_dusk';
  band(ctx, 0, 150, SKY[key]);
  if (night) { // 별과 갈라진 하늘
    for (let i = 0; i < 40; i++) { ctx.fillStyle = i % 5 ? '#c0cbdc' : '#fee761'; ctx.fillRect((i * 97) % W, (i * 53) % 110, 1, 1); }
    ctx.strokeStyle = '#68386c'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(300, 0); ctx.lineTo(286, 30); ctx.lineTo(298, 52); ctx.lineTo(280, 86); ctx.stroke();
    ctx.strokeStyle = '#b55088'; ctx.lineWidth = 1; ctx.stroke();
  } else {
    ctx.fillStyle = dusk ? '#fee761' : '#fff4b8'; ctx.beginPath(); ctx.arc(dusk ? 380 : 90, dusk ? 118 : 40, dusk ? 22 : 14, 0, Math.PI * 2); ctx.fill();
  }
  // 먼 언덕
  for (let x = 0; x < W; x += 2) {
    const h1 = 26 + Math.sin(x * 0.015) * 12 + Math.sin(x * 0.05) * 4;
    ctx.fillStyle = night ? '#1e2a3a' : dusk ? '#5a4466' : '#5aa05a'; ctx.fillRect(x, 150 - h1, 2, h1);
  }
  // 집들
  const roofs = night ? '#3e2731' : dusk ? '#a22633' : '#be4a2f', walls = night ? '#3a4466' : '#ead4aa';
  [[30, 112], [92, 118], [330, 114], [400, 110]].forEach(([x, y], i) => {
    ctx.fillStyle = walls; ctx.fillRect(x, y, 44, 34);
    ctx.fillStyle = roofs; for (let k = 0; k < 14; k++) ctx.fillRect(x - 4 + k, y - k, 52 - k * 2, 1);
    ctx.fillStyle = night ? (i % 2 ? '#feae34' : '#262b44') : '#733e39'; ctx.fillRect(x + 16, y + 14, 10, 20);
  });
  // 들판
  band(ctx, 146, H, night ? ['#1e3a2a', '#0e1a14'] : dusk ? ['#8a6a3a', '#4a3a2a'] : ['#63c74d', '#3e8948']);
  ctx.fillStyle = night ? '#16301f' : dusk ? '#6a502e' : '#3e8948';
  for (let i = 0; i < 60; i++) ctx.fillRect((i * 71) % W, 152 + (i * 37) % 30, 3, 1);
  // 우물
  ctx.fillStyle = '#5a6988'; ctx.fillRect(214, 130, 52, 22); ctx.fillStyle = '#8b9bb4'; ctx.fillRect(216, 132, 48, 6);
  ctx.fillStyle = '#733e39'; ctx.fillRect(216, 100, 4, 30); ctx.fillRect(260, 100, 4, 30); ctx.fillRect(212, 98, 56, 5);
  ctx.fillStyle = night ? '#68386c' : '#2ce8f5'; ctx.globalAlpha = 0.5 + Math.sin(t * 2) * 0.2; ctx.fillRect(220, 132, 40, 3); ctx.globalAlpha = 1;
}

export function drawBackdrop(ctx, key, t = 0) {
  if (key && key.startsWith('village')) { village(ctx, key, t); return; }
  if (IMG.bg_rockpass) ctx.drawImage(IMG.bg_rockpass, 0, 0);
  ctx.fillStyle = '#181425'; ctx.fillRect(0, 229, W, H - 229);
}
