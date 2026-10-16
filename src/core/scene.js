// 장면 스택. 맨 위 장면만 입력·갱신을 받고, 그리기는 불투명한 장면부터 위로 쌓는다.
// 장면: { enter?(), exit?(), update(dt), draw(ctx), opaque = true }
export function createScenes() {
  const stack = [];
  const s = {
    get top() { return stack[stack.length - 1]; },
    get list() { return [...stack]; }, // 확인용 (바꾸지 않는다)
    push(scene) { stack.push(scene); scene.enter?.(); },
    pop() { const sc = stack.pop(); sc?.exit?.(); return sc; },
    replace(scene) { while (stack.length) s.pop(); s.push(scene); },
    update(dt) { s.top?.update(dt); },
    draw(ctx) {
      let i = stack.length - 1;
      while (i > 0 && stack[i].opaque === false) i--;
      for (; i < stack.length; i++) stack[i].draw(ctx);
    },
  };
  return s;
}
