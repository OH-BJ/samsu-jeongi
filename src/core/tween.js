// 트윈, 파티클, 화면 흔들림, 화면 번쩍임
export const ease = {
  linear: t => t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inQuad: t => t * t,
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
  outElastic: t => t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
};

const MAX_PARTICLES = 300;

export function createFx() {
  const tweens = [], parts = [];
  const fx = { shakeT: 0, shakePow: 0, flashT: 0, flashMax: 0, flashColor: '#fff' };

  // obj의 숫자 속성을 ms 동안 목표값으로. Promise를 돌려주므로 await로 연출을 이어 붙일 수 있다.
  fx.tween = (obj, to, ms, e = ease.outQuad, delay = 0) => new Promise(done => {
    const from = {};
    for (const k in to) from[k] = obj[k];
    tweens.push({ obj, from, to, ms, e, t: -delay, done });
  });
  fx.wait = ms => fx.tween({ v: 0 }, { v: 1 }, ms, ease.linear);

  fx.shake = (pow = 4, ms = 250) => { fx.shakePow = Math.max(fx.shakePow, pow); fx.shakeT = Math.max(fx.shakeT, ms); };
  fx.flash = (color = '#fff', ms = 120) => { fx.flashColor = color; fx.flashT = fx.flashMax = ms; };

  // 파티클 n개를 (x,y)에서 터뜨린다
  fx.burst = (x, y, { n = 12, colors = ['#fee761', '#feae34', '#ffffff'], speed = 90, life = 500, gravity = 160, size = 2 } = {}) => {
    for (let i = 0; i < n && parts.length < MAX_PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.6);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, life, max: life, color: colors[i % colors.length], gravity, size });
    }
  };

  fx.update = dt => {
    const ms = dt * 1000;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += ms;
      if (tw.t < 0) continue;
      const k = Math.min(1, tw.t / tw.ms), v = tw.e(k);
      for (const p in tw.to) tw.obj[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * v;
      if (k >= 1) { tweens.splice(i, 1); tw.done(); }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= ms; p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    fx.shakeT = Math.max(0, fx.shakeT - ms); if (!fx.shakeT) fx.shakePow = 0;
    fx.flashT = Math.max(0, fx.flashT - ms);
  };

  // 장면을 그리기 전에 호출 → 흔들림 적용. 그린 뒤 drawOver()로 파티클·번쩍임
  fx.begin = ctx => {
    ctx.save();
    if (fx.shakeT) ctx.translate(Math.round((Math.random() * 2 - 1) * fx.shakePow), Math.round((Math.random() * 2 - 1) * fx.shakePow));
  };
  fx.drawOver = (ctx, w, h) => {
    for (const p of parts) {
      ctx.globalAlpha = Math.min(1, p.life / p.max * 2);
      ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (fx.flashT) { ctx.globalAlpha = fx.flashT / fx.flashMax * 0.8; ctx.fillStyle = fx.flashColor; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  };
  fx.clear = () => { tweens.length = 0; parts.length = 0; };
  return fx;
}
