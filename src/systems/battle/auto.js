// 자동 판단 (시뮬레이터와 자동 방어에서 쓴다)
// 손은 완전히 운이다: 적의 자세를 보여 주지 않으므로 사람도 아무 손이나 내는 것과 같다.
import { SKILLS } from '../../../data/skills.js';
import { HANDS } from './rules.js';
import { BEATEN_BY } from './rules.js';

export const randomHand = rng => HANDS[Math.floor((rng ? rng.next() : Math.random()) * 3)];

// 보스의 「예고」는 믿는다 (진실 70%)
export const pickHand = (rng, said = null) => (said ? BEATEN_BY[said] : randomHand(rng));

// 행동 고르기 (보통 플레이어)
export function autoAction(u, b) {
  const party = b.alive('party'), enemies = b.alive('enemy');
  const weakest = enemies.reduce((a, e) => (e.hp < a.hp ? e : a), enemies[0]);
  const boss = enemies.find(e => e.def.tier !== 'normal');
  const target = boss && enemies.length <= 2 ? boss : weakest;
  const can = id => u.skills.includes(id) && b.canUse(u, id);
  const hurt = party.filter(p => p.hp / p.maxHp < 0.45).sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
  if (hurt && can('heal')) return { type: 'skill', skill: 'heal', target: hurt };
  if (hurt && hurt === u && hurt.hp / hurt.maxHp < 0.25 && b.items.potion > 0) return { type: 'item', item: 'potion', target: u };
  if (can('paper_storm') && enemies.length >= 3) return { type: 'skill', skill: 'paper_storm', target };
  if (can('foresight') && !b.foresight && target.def.tier !== 'normal') return { type: 'skill', skill: 'foresight' };
  if (can('cheonbung') && b.fateReady) return { type: 'skill', skill: 'cheonbung', target };
  if (can('iron_fist')) return { type: 'skill', skill: 'iron_fist', target };
  if (can('twin_slash')) return { type: 'skill', skill: 'twin_slash', target };
  if (can('fate_fist')) return { type: 'skill', skill: 'fate_fist', target };
  if (can('shield_bash')) return { type: 'skill', skill: 'shield_bash', target };
  if (can('dice') && u.mp >= 16) return { type: 'skill', skill: 'dice', target };
  const basic = u.skills.find(id => SKILLS[id].mp === 0 && b.canUse(u, id));
  if (basic) return { type: 'skill', skill: basic, target };
  return { type: 'guard' };
}

// 시뮬레이터용 조종기
export function autoController(rng, { useFate = true } = {}) {
  return {
    event: () => Promise.resolve(),
    chooseAction: (u, b) => Promise.resolve(autoAction(u, b)),
    chooseHand: info => Promise.resolve({ hand: info.fixed || pickHand(rng, info.said), fate: useFate && info.skill === 'cheonbung' }),
    chooseDefense: info => Promise.resolve({ hand: pickHand(rng, info.said), fate: false }),
    offerReroll: () => Promise.resolve(useFate),
  };
}
