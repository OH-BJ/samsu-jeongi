// 전투 진행 (화면과 분리). 화면/시뮬레이터는 ctrl(조종기)로 결정과 연출을 맡는다.
//
// ctrl.event(e)               → Promise   연출 (시뮬레이터는 바로 끝냄)
// ctrl.chooseAction(u, b)     → { type: 'skill', skill, target } | { type: 'guard' } | { type: 'item', item, target }
//                               | { type: 'swap', with } | { type: 'flee' }
// ctrl.chooseHand(info)       → { hand, fate }   공격 합: 내 손 (fate=true면 운명 개입 사용)
// ctrl.chooseDefense(info)    → { hand, fate }   방어 합: 막을 손
// ctrl.offerReroll(info)      → boolean          진 판을 운명 게이지로 다시 굴릴지
import { SKILLS, GAMBLE_TABLE, STATUS_TURNS, ITEMS } from '../../../data/skills.js';
import { ALL_UNITS } from '../../../data/companions.js';
import { ENEMIES } from '../../../data/enemies.js';
import {
  judge, BEATS, BEATEN_BY, ATTACK_MULT, DEFENSE_MULT, COUNTER_CHANCE, STREAK_MAX, STREAK_STEP,
  FATE_GAIN, FATE_MAX, BACK_ROW_TAKEN, GUARD_TAKEN, affinityBonus, baseDamage,
} from './rules.js';
import { currentStance, displayStance, afterClash, decideEnemyHand, rollNoise, phaseOf, randomStance } from './stance.js';

let uid = 0;
// 정의 그대로의 아군 (시뮬레이터 기본값)
export function makeHero(id, row) {
  const d = ALL_UNITS[id];
  return makeHeroFrom({ id, def: d, name: d.name, stats: { hp: d.hp, mp: d.mp, atk: d.atk, def: d.def, spd: d.spd, crit: d.crit, eva: d.eva, luck: 0 }, hand: d.hand, skills: d.skills, opts: {} }, row);
}
// systems/party.js 의 unitBuild 결과로 만든 아군 (직업·돌파·장비 반영)
export function makeHeroFrom(b, row) {
  const s = b.stats;
  return { uid: ++uid, id: b.id, side: 'party', name: b.name, def: b.def, row, hp: s.hp, maxHp: s.hp, mp: s.mp, maxMp: s.mp,
    atk: s.atk, defense: s.def, spd: s.spd, crit: s.crit, eva: s.eva, luck: s.luck || 0, hand: b.hand, skills: b.skills, opts: b.opts || {}, status: {}, guard: false };
}
const opt = (u, k) => (u.opts?.[k] || 0) / 100;
// scale: 구역·장마다 같은 적을 더 강하게/약하게 쓸 때 (HP와 공격력에 곱한다)
export function makeEnemy(id, x = 0, y = 0, scale = 1) {
  const d = ENEMIES[id], hp = Math.round(d.hp * scale);
  return { uid: ++uid, id, side: 'enemy', name: d.name, def: d, x, y, hp, maxHp: hp, atk: Math.round(d.atk * scale), defense: d.def, spd: d.spd,
    crit: d.crit, eva: d.eva, hand: null, status: {}, mods: [], phase: 0, revealed: false, noise: null, confuseStance: null, guard: false };
}

export class Battle {
  // items: 저장 데이터의 아이템을 그대로 넘기면 전투에서 쓴 만큼 줄어든다
  // endAtHp: 보스 HP가 이 비율 이하가 되면 승리 (이야기 전투), firstStrike: 첫 라운드에 아군이 먼저 움직일 확률
  constructor({ party, enemies, rng, canFlee = true, fleeChance = 0.5, items = { potion: 3 }, endAtHp = 0, fateStart = 0, firstStrike = 0 }) {
    this.party = party; this.enemies = enemies; this.rng = rng; this.canFlee = canFlee; this.fleeChance = fleeChance;
    this.items = items; this.endAtHp = endAtHp; this.firstStrike = firstStrike;
    this.streak = 0; this.fate = fateStart; this.round = 0; this.result = null; this.foresight = false;
    this.lastPlayerHand = null;
    this.stats = { clashes: 0, wins: 0, draws: 0, losses: 0, fateUsed: 0 };
  }
  get all() { return [...this.party, ...this.enemies]; }
  alive(side) { return (side === 'party' ? this.party : this.enemies).filter(u => u.hp > 0); }
  get fateReady() { return this.fate >= FATE_MAX; }

  stanceInfo(e) { const s = currentStance(e); return { stance: s, display: displayStance(e, s) }; }

  // 스킬을 지금 쓸 수 있는지 (MP, 뒷줄 근접 제한)
  canUse(u, skillId) {
    const sk = SKILLS[skillId];
    if (!sk) return false;
    if ((sk.mp || 0) > u.mp) return false;
    if (sk.melee && u.row === 'back') return false;
    return true;
  }

  async run(ctrl) {
    this.ctrl = ctrl;
    await ctrl.event({ type: 'start' });
    while (!this.result) {
      this.round++;
      // 선공: 첫 라운드에 아군 전원이 적보다 먼저
      const first = this.round === 1 && this.firstStrike && this.rng.chance(this.firstStrike);
      const order = this.all.filter(u => u.hp > 0)
        .map(u => ({ u, k: u.spd * (1 + this.rng.next() * 0.2) + (first && u.side === 'party' ? 1000 : 0) }))
        .sort((a, b) => b.k - a.k).map(o => o.u);
      if (first) await ctrl.event({ type: 'message', text: '선공! 아군이 먼저 움직인다' });
      this.order = order;
      await ctrl.event({ type: 'round', round: this.round, order });
      for (const u of order) {
        if (this.result) break;
        if (u.hp <= 0) continue;
        this.current = u;
        await this.turn(u);
        this.checkEnd();
      }
    }
    await ctrl.event({ type: 'end', result: this.result });
    return this.result;
  }

  checkEnd() {
    if (this.result) return;
    if (!this.alive('enemy').length) this.result = 'win';
    else if (this.endAtHp && this.enemies.some(e => e.def.tier === 'boss' && e.hp > 0 && e.hp <= e.maxHp * this.endAtHp)) this.result = 'win';
    else if (!this.alive('party').length) this.result = 'lose';
  }

  async turn(u) {
    const ctrl = this.ctrl;
    u.guard = false;
    // 턴 시작: 상태이상
    if (u.status.bleed) {
      const d = Math.max(1, Math.round(u.maxHp * 0.06));
      await this.damage(null, u, d, { kind: 'bleed' });
      if (this.tickStatus(u, 'bleed')) await ctrl.event({ type: 'status_end', unit: u, status: 'bleed' });
      if (u.hp <= 0) return;
    }
    for (const st of ['petrify', 'stun']) {
      if (u.status[st]) {
        this.tickStatus(u, st);
        await ctrl.event({ type: 'skip', unit: u, status: st });
        return;
      }
    }
    if (u.status.confuse && this.tickStatus(u, 'confuse')) { u.confuseStance = null; await ctrl.event({ type: 'status_end', unit: u, status: 'confuse' }); }
    await ctrl.event({ type: 'turn', unit: u });
    if (u.side === 'party') { if (u.mp < u.maxMp) u.mp = Math.min(u.maxMp, u.mp + 3); await this.partyTurn(u); }
    else await this.enemyTurn(u);
  }

  // 남은 턴을 줄이고, 끝났으면 true
  tickStatus(u, st) { if (--u.status[st] <= 0) { delete u.status[st]; return true; } return false; }

  // ───────────── 아군 차례 ─────────────
  async partyTurn(u) {
    const ctrl = this.ctrl;
    const act = await ctrl.chooseAction(u, this);
    if (act.type === 'guard') { u.guard = true; await ctrl.event({ type: 'guard', unit: u }); return; }
    if (act.type === 'item') {
      if (!this.items[act.item]) return;
      this.items[act.item]--;
      const t = act.target || u, amt = Math.round(t.maxHp * ITEMS[act.item].heal);
      await this.heal(u, t, amt);
      return;
    }
    if (act.type === 'swap') {
      const other = act.with;
      [u.row, other.row] = [other.row, u.row];
      await ctrl.event({ type: 'swap', unit: u, with: other });
      return;
    }
    if (act.type === 'flee') {
      const ok = this.canFlee && this.rng.chance(this.fleeChance);
      await ctrl.event({ type: 'flee', ok });
      if (ok) this.result = 'fled';
      return;
    }
    // 스킬
    const sk = SKILLS[act.skill];
    u.mp -= sk.mp || 0;
    await ctrl.event({ type: 'skill', unit: u, skill: act.skill });
    if (sk.kind === 'heal') { await this.heal(u, act.target, Math.round(u.atk * sk.mult)); return; }
    if (sk.kind === 'fate_gain') {
      this.fate = Math.min(FATE_MAX, this.fate + sk.amount);
      await ctrl.event({ type: 'message', text: `운명 게이지 +${sk.amount}` });
      return;
    }
    if (sk.kind === 'manip') {
      this.foresight = true;
      await ctrl.event({ type: 'foresight', unit: u });
      return;
    }
    let target = act.target && act.target.hp > 0 ? act.target : this.alive('enemy')[0];
    if (!target) return;

    // 공격 합
    rollNoise(target, this.rng);
    const info = this.stanceInfo(target);
    let { hand: enemyHand, said } = decideEnemyHand(target, this.rng);
    const pick = await ctrl.chooseHand({ actor: u, target, skill: act.skill, fixed: sk.kind === 'fixed' ? sk.hand : null, said, ...info });
    let hand = sk.kind === 'fixed' ? sk.hand : pick.hand;
    if (pick.fate && this.fateReady) { this.fate = 0; this.stats.fateUsed++; enemyHand = BEATS[hand]; await ctrl.event({ type: 'fate_use', unit: u }); }
    let result = await this.applyLuck(u, await this.useForesight(judge(hand, enemyHand)));
    if (result === 'lose' && this.fateReady && await ctrl.offerReroll({ actor: u, target, hand, enemyHand })) {
      this.fate = 0; this.stats.fateUsed++;
      await ctrl.event({ type: 'reroll', unit: u });
      enemyHand = decideEnemyHand(target, this.rng).hand;
      result = judge(hand, enemyHand);
    }
    await this.settleClash(result, hand, enemyHand, target);
    await ctrl.event({ type: 'clash', side: 'attack', actor: u, target, hand, enemyHand, result, said });

    // 결과에 따른 발동
    let mult = ATTACK_MULT[result];
    let fires = result !== 'lose';
    if (sk.kind === 'finisher' && result !== 'win') fires = false;
    if (sk.kind === 'stable' && result === 'lose' && this.rng.chance(0.5)) { fires = true; mult = 1.0; await ctrl.event({ type: 'message', text: '안정기 — 기본 발동!' }); }
    if (!fires) {
      await ctrl.event({ type: 'fizzle', unit: u, skill: act.skill });
      if (result === 'lose' && target.hp > 0 && this.rng.chance(COUNTER_CHANCE.attackLose)) {
        await ctrl.event({ type: 'counter', unit: target, target: u });
        await this.hit(target, u, 1.0 * 0.5, { noClash: true });
      }
      return;
    }
    let skillMult = sk.mult, extraStatus = null;
    if (sk.kind === 'gamble') {
      const roll = () => this.rng.weighted(GAMBLE_TABLE.map((r, i) => [i, r[2]]));
      let i = roll();
      if (result === 'win') i = Math.max(i, roll());
      const [label, m, , st] = GAMBLE_TABLE[i];
      skillMult = m; extraStatus = st;
      await ctrl.event({ type: 'gamble', unit: u, label, index: i });
    }
    const targets = sk.target === 'all_enemies' ? this.alive('enemy') : [target];
    for (const t of targets) {
      if (t.hp <= 0) continue;
      await this.hit(u, t, skillMult * mult, { result, hand, sureHit: result === 'win' });
      if (t.hp > 0 && sk.status) await this.tryStatus(t, sk.status.type, result === 'win' ? 1 : sk.status.chance + opt(u, 'status'));
      if (t.hp > 0 && extraStatus) await this.tryStatus(t, extraStatus, 1);
    }
  }

  // 예지: 다음 한 판에서 지면 무승부로 (결과와 상관없이 한 판 쓰면 사라진다)
  async useForesight(result) {
    if (!this.foresight) return result;
    this.foresight = false;
    if (result !== 'lose') return result;
    await this.ctrl.event({ type: 'message', text: '예지 — 진 판을 무승부로 바꿨다!' });
    return 'draw';
  }

  // 장비 옵션: 비기면 n% 승리 처리, 지면 n% 무승부 처리
  async applyLuck(u, result) {
    if (result === 'draw' && this.rng.chance(opt(u, 'draw_to_win'))) { await this.ctrl.event({ type: 'message', text: '행운! 무승부가 승리로' }); return 'win'; }
    if (result === 'lose' && this.rng.chance(opt(u, 'lose_to_draw'))) { await this.ctrl.event({ type: 'message', text: '행운! 패배가 무승부로' }); return 'draw'; }
    return result;
  }

  // 연승·운명 게이지·패턴 갱신 (result는 아군 기준, u = 합을 겨룬 아군)
  async settleClash(result, playerHand, enemyHand, enemy, u = this.current) {
    this.stats.clashes++;
    this.stats[result === 'win' ? 'wins' : result === 'draw' ? 'draws' : 'losses']++;
    if (result === 'win') this.streak = Math.min(STREAK_MAX, this.streak + 1);
    else if (result === 'lose') {
      if (this.streak && this.rng.chance(opt(u, 'streak_keep'))) await this.ctrl.event({ type: 'message', text: '연승 유지!' });
      else this.streak = 0;
    }
    this.fate = Math.min(FATE_MAX, this.fate + Math.round(FATE_GAIN[result] * (1 + opt(u, 'fate_gain'))));
    const enemyResult = result === 'win' ? 'lose' : result === 'lose' ? 'win' : 'draw';
    afterClash(enemy, { enemyHand, playerHand, enemyResult }, this.rng);
    this.lastPlayerHand = playerHand;
  }

  // ───────────── 적 차례 ─────────────
  async enemyTurn(e) {
    const ctrl = this.ctrl, ph = phaseOf(e);
    const skillId = this.rng.weighted(ph.skills || e.def.skills);
    const sk = SKILLS[skillId];
    await ctrl.event({ type: 'skill', unit: e, skill: skillId });
    if (sk.kind === 'fate_drain') {
      this.fate = Math.max(0, this.fate - sk.amount);
      await ctrl.event({ type: 'fate_drain', unit: e, amount: sk.amount });
      return;
    }
    const alive = this.alive('party');
    if (!alive.length) return;
    const targets = sk.target === 'all_enemies' ? alive
      : [this.rng.weighted(alive.map(p => [p, p.row === 'front' ? 3 : 1]))];

    // 방어 합 (전체 공격도 한 번만 겨룬다)
    rollNoise(e, this.rng);
    const info = this.stanceInfo(e);
    let { hand: enemyHand, said } = decideEnemyHand(e, this.rng);
    const pick = await ctrl.chooseDefense({ enemy: e, targets, skill: skillId, said, ...info });
    const hand = pick.hand;
    if (pick.fate && this.fateReady) { this.fate = 0; this.stats.fateUsed++; enemyHand = BEATS[hand]; await ctrl.event({ type: 'fate_use', unit: targets[0] }); }
    const defender = targets[0];
    const result = await this.applyLuck(defender, await this.useForesight(judge(hand, enemyHand)));
    await this.settleClash(result, hand, enemyHand, e, defender);
    await ctrl.event({ type: 'clash', side: 'defense', actor: e, targets, hand, enemyHand, result, said });
    for (const t of targets) {
      if (t.hp <= 0) continue;
      await this.hit(e, t, sk.mult * DEFENSE_MULT[result], { defenseResult: result });
      if (t.hp > 0 && sk.status) {
        const ch = result === 'win' ? 0 : result === 'draw' ? sk.status.chance : Math.min(1, sk.status.chance * 2);
        await this.tryStatus(t, sk.status.type, ch);
      }
    }
    if (result === 'win' && e.hp > 0 && this.rng.chance(COUNTER_CHANCE.defenseWin)) {
      const c = targets.find(t => t.hp > 0);
      if (c) { await ctrl.event({ type: 'counter', unit: c, target: e }); await this.hit(c, e, 0.8, { noClash: true }); }
    }
  }

  // ───────────── 피해·회복·상태 ─────────────
  async hit(src, t, mult, { result = null, hand = null, sureHit = false, defenseResult = null, noClash = false } = {}) {
    if (mult <= 0) return;
    const rng = this.rng;
    if (!sureHit && rng.chance(t.eva)) { await this.ctrl.event({ type: 'miss', source: src, target: t }); return; }
    let d = baseDamage(src.atk, mult, t.defense);
    if (src.side === 'party') {
      d *= affinityBonus(src.hand, hand, result);
      if (result === 'win' && hand) d *= 1 + opt(src, 'win_' + hand);
      if (!noClash) d *= 1 + STREAK_STEP * this.streak;
    }
    let critCh = src.crit + (defenseResult === 'lose' ? 0.2 : 0);
    const crit = rng.chance(critCh);
    if (crit) d *= 1.5;
    if (t.side === 'party' && t.row === 'back') d *= BACK_ROW_TAKEN;
    if (t.guard) d *= GUARD_TAKEN;
    if (t.side === 'party' && defenseResult === 'lose') d *= 1 - opt(t, 'lose_dmg');
    d *= 0.92 + rng.next() * 0.16;
    await this.damage(src, t, Math.max(1, Math.round(d)), { crit });
  }

  async damage(src, t, amount, { crit = false, kind = 'hit' } = {}) {
    t.hp = Math.max(0, t.hp - amount);
    await this.ctrl.event({ type: 'damage', source: src, target: t, amount, crit, kind });
    if (t.hp <= 0) { t.status = {}; await this.ctrl.event({ type: 'death', unit: t }); return; }
    // 보스 페이즈 전환
    if (t.def.phases) {
      const ratio = t.hp / t.maxHp;
      let p = t.phase;
      while (p + 1 < t.def.phases.length && ratio < t.def.phases[p + 1].hpBelow) p++;
      if (p !== t.phase) {
        t.phase = p; t.mods = []; t.revealed = false;
        const ph = t.def.phases[p];
        if (ph.fateDrain) this.fate = Math.max(0, this.fate - ph.fateDrain);
        await this.ctrl.event({ type: 'phase', unit: t, phase: p, line: ph.line, fateDrain: ph.fateDrain || 0 });
      }
    }
  }

  async heal(src, t, amount) {
    if (!t || t.hp <= 0) return;
    const before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + amount);
    await this.ctrl.event({ type: 'heal', source: src, target: t, amount: t.hp - before });
  }

  async tryStatus(t, type, chance) {
    const resist = t.def.resist?.[type] || 0;
    if (!this.rng.chance(chance * (1 - resist))) return;
    t.status[type] = STATUS_TURNS[type];
    if (type === 'confuse' && t.side === 'enemy') t.confuseStance = randomStance(this.rng);
    await this.ctrl.event({ type: 'status', unit: t, status: type });
  }
}
