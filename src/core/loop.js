// 프레임 루프: update(dt초) → draw(). 탭이 가려졌다 돌아와도 dt가 튀지 않게 상한을 둔다.
export function startLoop(update, draw, onError) {
  let last = performance.now();
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // 한 프레임에서 오류가 나도 게임 전체가 멈추지 않게 한다
    try { update(dt); draw(); } catch (e) { console.error(e); onError?.(e); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
