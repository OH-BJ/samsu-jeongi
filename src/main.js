// 부팅: 화면·입력·연출 준비 → 글꼴·그림 불러오기 → 타이틀
import { createScreen, W, H } from './core/screen.js';
import { createInput } from './core/input.js';
import { createScenes } from './core/scene.js';
import { createFx } from './core/tween.js';
import { startLoop } from './core/loop.js';
import { loadImages, loadGrid } from './core/assets.js';
import { audio, unlockAudio } from './core/audio.js';
import { loadSettings, load, save } from './core/save.js';
import { text, bar, C, FONT } from './core/render.js';
import { updateToasts, drawToasts, toast } from './ui/toast.js';
import { TitleScene } from './scenes/title.js';

const screen = createScreen(document.getElementById('game'));
const input = createInput(screen);
const G = {
  screen, input,
  scenes: createScenes(),
  fx: createFx(),
  settings: loadSettings(),
  data: load('auto'),
  // HTML 덮개 창 (글 입력·복사가 필요한 저장 코드용). onAct(act, box)가 true를 돌려주면 닫는다
  overlay(html, onAct) {
    const ov = document.getElementById('overlay'), box = ov.querySelector('.box');
    box.innerHTML = html; ov.style.display = 'flex';
    box.onclick = async e => { const act = e.target.dataset?.act; if (act && await onAct(act, box)) ov.style.display = 'none'; };
  },
};
window.G = G; // 개발 중 콘솔에서 확인용
audio.volume = G.settings.sfx;
input.onAnyInput(unlockAudio);

// 불러오는 동안 진행 막대
let progress = 0;
const drawLoading = () => {
  const ctx = screen.ctx;
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  text(ctx, '불러오는 중…', W / 2, H / 2 - 16, { color: C.pale, align: 'center' });
  bar(ctx, W / 2 - 80, H / 2 + 4, 160, 6, progress, C.gold);
};
drawLoading();
await document.fonts.load(`12px ${FONT}`).catch(() => {});
await Promise.all([loadImages(undefined, p => { progress = p; drawLoading(); }), loadGrid('hands', 'ui/hands'), loadGrid('gauntlets', 'items/gauntlets')]);

G.scenes.push(new TitleScene(G));

startLoop(dt => {
  input.update();
  try {
    if (!screen.portrait) {
      G.scenes.update(dt);
      G.fx.update(dt);
      updateToasts(dt);
      if (G.data) G.data.playMs += dt * 1000;
    }
  } finally { input.endFrame(); }
}, () => {
  const ctx = screen.ctx;
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  G.fx.begin(ctx);
  G.scenes.draw(ctx);
  G.fx.drawOver(ctx, W, H);
  drawToasts(ctx);
}, (() => { let last = 0; return e => { if (performance.now() - last > 3000) { last = performance.now(); toast('오류: ' + e.message, { color: C.red, ms: 4000 }); } }; })());

// 탭을 닫거나 숨길 때 자동 저장
const autosave = () => { if (G.data) save('auto', G.data); };
addEventListener('pagehide', autosave);
document.addEventListener('visibilitychange', () => { if (document.hidden) autosave(); });
