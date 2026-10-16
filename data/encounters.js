// 조우 만들기: 적 목록만 주면 화면 위치를 자동으로 정한다
// opts: canFlee, solo(이로 혼자), endAtHp(보스 HP가 이 비율 아래면 승리), fateStart(시작 운명 게이지), tutorial, desc
import { ENEMIES } from './enemies.js';

// 적 수에 따른 자리 (64×64 그림 왼쪽 위)
const SPOTS = {
  1: [[80, 100]],
  2: [[36, 104], [140, 110]],
  3: [[20, 108], [98, 92], [172, 112]],
};
// 큰 그림(128px: 반석왕, 2배 크기 적)이 있을 때: 큰 적은 가운데 뒤, 나머지는 양옆
const BIG_SPOT = [46, 46], SIDE_SPOTS = [[4, 112], [170, 114]];
const isBig = id => ENEMIES[id].look?.sprite === 'boss_urs' || ENEMIES[id].look?.scale === 2;

export function encounter(name, ids, opts = {}) {
  let enemies;
  const big = ids.findIndex(isBig);
  if (big >= 0) {
    let k = 0;
    enemies = ids.map((id, i) => [id, ...(i === big ? BIG_SPOT : SIDE_SPOTS[k++])]);
  } else enemies = ids.map((id, i) => [id, ...SPOTS[ids.length][i]]);
  return { name, enemies, canFlee: true, desc: '', ...opts };
}
