// 노드 지도 생성: 구역마다 왼쪽→오른쪽으로 열(column)이 이어지고, 열마다 1~3개 노드가 갈림길로 연결된다.
// 같은 시드면 같은 지도가 나온다 (저장에는 시드와 진행 상태만 남긴다).
import { createRng } from '../core/rng.js';

export const NODE_KO = { battle: '전투', elite: '강적', event: '사건', treasure: '보물', rest: '휴식', shop: '상점', boss: '보스', start: '출발' };

// zone: { cols, types: [[종류, 가중치], ...], boss?: true }
export function generateZone(zone, seed) {
  const rng = createRng(seed);
  const cols = [];
  cols.push([{ type: 'start' }]);
  for (let c = 1; c < zone.cols - 1; c++) {
    const n = c === 1 ? 2 : rng.weighted([[1, 1], [2, 4], [3, 3]]);
    const col = [];
    for (let i = 0; i < n; i++) col.push({ type: rng.weighted(zone.types) });
    cols.push(col);
  }
  // 마지막 열: 보스 구역이면 보스, 아니면 다음 구역으로 가는 문(휴식)
  cols.push([{ type: zone.boss ? 'boss' : 'rest', exit: true }]);
  // 같은 열에 휴식·상점이 겹치지 않게, 강적은 너무 앞에 나오지 않게
  cols.forEach((col, c) => col.forEach((nd, i) => {
    if (c < 2 && nd.type === 'elite') nd.type = 'battle';
    if (i > 0 && ['rest', 'shop'].includes(nd.type) && col.slice(0, i).some(o => o.type === nd.type)) nd.type = 'battle';
  }));
  // 연결: 각 노드는 다음 열의 가까운 노드 1~2개와 이어진다. 다음 열의 모든 노드는 최소 하나와 이어진다.
  const nodes = [];
  cols.forEach((col, c) => col.forEach((nd, i) => { nd.id = nodes.length; nd.col = c; nd.row = i; nd.n = col.length; nd.next = []; nodes.push(nd); }));
  for (let c = 0; c < cols.length - 1; c++) {
    const a = cols[c], b = cols[c + 1];
    const pos = (i, n) => (n === 1 ? 0.5 : i / (n - 1));
    a.forEach((nd, i) => {
      const p = pos(i, a.length);
      const sorted = [...b].sort((x, y) => Math.abs(pos(x.row, b.length) - p) - Math.abs(pos(y.row, b.length) - p));
      nd.next.push(sorted[0].id);
      if (sorted[1] && rng.chance(0.45)) nd.next.push(sorted[1].id);
    });
    b.forEach(nd => {
      if (!a.some(o => o.next.includes(nd.id))) {
        const p = pos(nd.row, b.length);
        const near = [...a].sort((x, y) => Math.abs(pos(x.row, a.length) - p) - Math.abs(pos(y.row, a.length) - p))[0];
        near.next.push(nd.id);
      }
    });
  }
  return { nodes, cols: cols.length };
}

// 노드 종류를 볼 수 있는지: 지금 위치에서 reveal 열 앞까지 (탈것으로 늘어난다), 지도 전체 공개면 모두
export function isRevealed(node, curCol, { reveal = 1, mapAll = false } = {}) {
  return mapAll || node.col <= curCol + reveal || node.type === 'boss' || node.type === 'start';
}
