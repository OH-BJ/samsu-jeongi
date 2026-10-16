// 입력: 키보드·마우스·터치를 하나로 (포인터 이벤트)
// 프레임마다 input.pressed(...) / input.pointer 를 읽고, 루프 끝에서 endFrame()으로 초기화한다.
const KEYMAP = {
  confirm: ['Enter', 'Space', 'KeyZ'],
  cancel: ['Escape', 'Backspace', 'KeyX'],
  up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
  rock: ['Digit1', 'KeyQ'], scissors: ['Digit2', 'KeyE'], paper: ['Digit3', 'KeyR'],
};
const LONG_PRESS_MS = 450;

export function createInput(screen) {
  const held = new Set(), hit = new Set();
  const p = { x: -1, y: -1, down: false, pressed: false, released: false, tapped: false, long: false, startX: 0, startY: 0, t0: 0, moved: false, active: false, wheel: 0, dragDY: 0 };
  const listeners = [];

  addEventListener('keydown', e => {
    if (e.target.closest?.('#overlay')) return; // 저장 코드 창에서 글을 쓰는 중
    if (e.repeat && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) return;
    if (Object.values(KEYMAP).some(k => k.includes(e.code))) e.preventDefault();
    held.add(e.code); hit.add(e.code);
    listeners.forEach(f => f());
  });
  addEventListener('keyup', e => held.delete(e.code));
  addEventListener('blur', () => held.clear());

  const c = screen.canvas;
  const pos = e => { const g = screen.toGame(e.clientX, e.clientY); p.x = g.x; p.y = g.y; };
  c.addEventListener('pointerdown', e => {
    e.preventDefault(); c.setPointerCapture?.(e.pointerId);
    pos(e); p.down = p.pressed = true; p.active = true; p.startX = p.x; p.startY = p.y; p.t0 = performance.now(); p.moved = false; p.long = false;
    listeners.forEach(f => f());
  });
  c.addEventListener('pointermove', e => { const py = p.y; pos(e); if (p.down) p.dragDY += p.y - py; p.active = e.pointerType === 'mouse' || p.down; if (p.down && Math.hypot(p.x - p.startX, p.y - p.startY) > 6) p.moved = true; });
  const up = e => {
    if (!p.down) return;
    pos(e); p.down = false; p.released = true;
    if (!p.moved && !p.long) p.tapped = true;
    if (e.pointerType !== 'mouse') p.active = false;
  };
  c.addEventListener('pointerup', up);
  c.addEventListener('pointercancel', e => { p.down = false; p.active = false; });
  c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') p.active = false; });
  // 두 번 탭 확대, 길게 눌러 메뉴, 당겨서 새로고침 막기
  c.addEventListener('contextmenu', e => e.preventDefault());
  c.addEventListener('wheel', e => { e.preventDefault(); p.wheel += e.deltaY; }, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());

  return {
    pointer: p,
    pressed: action => (KEYMAP[action] || [action]).some(k => hit.has(k)),
    held: action => (KEYMAP[action] || [action]).some(k => held.has(k)),
    // 이번 프레임에 탭/클릭된 위치가 사각형 안인지
    tappedIn: (x, y, w, h) => p.tapped && p.x >= x && p.x < x + w && p.y >= y && p.y < y + h,
    over: (x, y, w, h) => p.active && p.x >= x && p.x < x + w && p.y >= y && p.y < y + h,
    onAnyInput: f => listeners.push(f),
    update() { if (p.down && !p.moved && !p.long && performance.now() - p.t0 > LONG_PRESS_MS) p.long = true; },
    endFrame() { hit.clear(); p.pressed = p.released = p.tapped = false; p.wheel = 0; p.dragDY = 0; },
  };
}
