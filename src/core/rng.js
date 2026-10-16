// 시드 난수. 용도별 스트림(전투/뽑기/드롭)을 분리해서 같은 상황을 재현할 수 있게 한다.
// 상태(state)를 저장해 두면 새로고침으로 결과를 다시 굴릴 수 없다.
export function createRng(seed = (Math.random() * 2 ** 32) >>> 0) {
  let s = seed >>> 0;
  const next = () => { // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),   // min~max 포함
    chance: p => next() < p,                                           // p: 0~1
    pick: arr => arr[Math.floor(next() * arr.length)],
    // [[값, 가중치], ...] 에서 하나. 가중치는 소수(0.01 등)도 된다
    weighted: list => {
      const total = list.reduce((a, [, w]) => a + w, 0);
      let x = next() * total;
      for (const [v, w] of list) { if (x < w) return v; x -= w; }
      return list[list.length - 1][0];
    },
    shuffle: arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    get state() { return s; },
    set state(v) { s = v >>> 0; },
  };
  return r;
}

export const STREAMS = ['battle', 'gacha', 'drop', 'map'];

// 하나의 마스터 시드에서 스트림별 난수를 만든다
export function createStreams(master) {
  const m = createRng(master);
  return Object.fromEntries(STREAMS.map(n => [n, createRng((m.next() * 2 ** 32) >>> 0)]));
}
