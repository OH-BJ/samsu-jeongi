// 화면: 480×270 기준 해상도, 최근접 확대, 가로 고정 안내, 전체화면
export const W = 480, H = 270;

export const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

export function createScreen(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const wrap = canvas.parentElement;
  const rotate = document.getElementById('rotate');
  const screen = { canvas, ctx, scale: 1, portrait: false };

  function fit() {
    const cs = getComputedStyle(wrap);
    const aw = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    // 휴대폰은 꽉 차게(비정수 허용), PC는 정수배로 선명하게
    let s = Math.min(aw / W, ah / H);
    if (!isTouch && s >= 1) s = Math.floor(s);
    screen.scale = s;
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
    screen.portrait = isTouch && innerHeight > innerWidth;
    rotate.style.display = screen.portrait ? 'flex' : 'none';
  }
  addEventListener('resize', fit);
  addEventListener('orientationchange', () => setTimeout(fit, 200));
  fit();

  // 화면 좌표 → 게임 좌표
  screen.toGame = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return { x: (clientX - r.left) * W / r.width, y: (clientY - r.top) * H / r.height };
  };

  screen.isFullscreen = () => !!document.fullscreenElement;
  screen.toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        await screen.orientation?.lock?.('landscape').catch(() => {});
      }
    } catch (e) { /* 지원하지 않는 기기 (iOS 사파리 등) */ }
    setTimeout(fit, 100);
  };
  return screen;
}
