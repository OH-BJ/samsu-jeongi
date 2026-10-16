// 등급 정의. 색은 art/palette.js 와 같다.
export { RARITY } from '../art/palette.js';
export const RARITY_ORDER = ['N', 'U', 'R', 'E', 'L', 'M', 'X'];
export const rank = r => RARITY_ORDER.indexOf(r);
export const atLeast = (r, min) => rank(r) >= rank(min);

// 등급별 능력치 배율 (장비 기본치, 동료·직업 능력치)
export const RARITY_MULT = { N: 0.78, U: 0.88, R: 1.0, E: 1.12, L: 1.3, M: 1.5, X: 1.75 };
