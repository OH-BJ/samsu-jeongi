// 전투 화면: systems/battle/battle.js 의 진행을 그리고, 플레이어의 결정을 받는다.
import { W, H } from '../core/screen.js';
import { IMG, GRID, lookImage } from '../core/assets.js';
import { save } from '../core/save.js';
import { drawBackdrop } from '../ui/backdrops.js';
import { unitBuild } from '../systems/party.js';
import { rollRewards } from '../systems/economy.js';
import { MOUNTS } from '../../data/mounts.js';
import { RARITY } from '../../data/rarity.js';
import { panel, text, bar, sprite, shadow, measure, C } from '../core/render.js';
import { ease } from '../core/tween.js';
import { createRng } from '../core/rng.js';
import { sfx } from '../core/audio.js';
import { saveSettings } from '../core/save.js';
import { Button } from '../ui/button.js';
import { Menu } from '../ui/menu.js';
import { toast } from '../ui/toast.js';
import { tooltip } from '../ui/tooltip.js';
import { DialogScene } from '../ui/dialog.js';
import { Battle, makeHero, makeHeroFrom, makeEnemy } from '../systems/battle/battle.js';
import { HANDS, HAND_KO, BEATS } from '../systems/battle/rules.js';
import { phaseOf } from '../systems/battle/stance.js';
import { pickHand } from '../systems/battle/auto.js';
import { SKILLS, STATUS_KO, ITEMS } from '../../data/skills.js';
import { DEFAULT_PARTY } from '../../data/companions.js';
import { ENCOUNTERS } from '../../data/enemies.js';

// 아군 자리: 앞줄 2칸, 뒷줄 2칸 (그림 왼쪽 위)
const SLOTS = { front: [[290, 116], [364, 122]], back: [[328, 94], [402, 90]] };
const RESULT_KO = { win: '승리!', draw: '무승부', lose: '패배…' };
const RESULT_COLOR = { win: C.yellow, draw: C.pale, lose: C.red };
const PANEL_Y = 186;
// 아래 UI 영역
const ACT = { x: 4, y: PANEL_Y, w: 150, h: 80 };
const CTX = { x: 156, y: PANEL_Y, w: 234, h: 80 };
const PTY = { x: 392, y: PANEL_Y, w: 84, h: 80 };

// enc: 조우 키(전투 시험용) 또는 조우 객체(data/encounters.js 의 encounter())
// opts.onEnd(result): 이야기·지도 전투. 주면 끝난 뒤 「계속」 버튼으로 돌려준다 (HP는 저장 데이터에 이어진다)
// opts.retry: 지면 「다시 도전」만 보여 준다 (이야기 전투)
export class BattleScene {
  constructor(G, enc, { seed = (Math.random() * 2 ** 32) >>> 0, onEnd = null, retry = false, onSettle = null } = {}) {
    this.G = G; this.key = enc; this.enc = typeof enc === 'string' ? ENCOUNTERS[enc] : enc; this.seed = seed;
    this.onEnd = onEnd; this.retry = retry; this.persist = !!onEnd; this.onSettle = onSettle;
    this.t = 0; this.msg = null; this.floats = []; this.reveal = null; this.banner = null;
    this.mode = 'busy'; this.menu = null; this.focus = null; this.pending = null; this.extra = [];
    this.fateArmed = false; this.ended = null;
    // 저장된 파티(직업·돌파·장비 반영). 저장이 없으면 기본 이야기 파티
    const d = G.data;
    const members = d ? (this.enc.solo ? d.party.filter(p => p.id === 'iro') : d.party) : DEFAULT_PARTY;
    const party = d ? members.map(p => makeHeroFrom(unitBuild(d, p.id), p.row)) : members.map(p => makeHero(p.id, p.row));
    // 지도·이야기 전투는 이어지는 HP로 시작
    if (this.persist) for (const p of party) p.hp = Math.max(1, Math.min(p.maxHp, d.hp[p.id] ?? p.maxHp));
    const mt = d?.mount ? MOUNTS[d.mount].effect : {};
    const enemies = this.enc.enemies.map(([id, x, y]) => makeEnemy(id, x, y, this.enc.scale || 1));
    this.battle = new Battle({ party, enemies, rng: createRng(seed), canFlee: this.enc.canFlee, fleeChance: 0.5 + (mt.flee || 0),
      items: this.persist ? d.items : { potion: 3 }, endAtHp: this.enc.endAtHp || 0, fateStart: this.enc.fateStart || 0, firstStrike: mt.firstStrike || 0 });
    for (const u of this.battle.all) Object.assign(u, { ox: 0, oy: 0, alpha: 1, flash: 0, img: null });
    for (const e of enemies) { e.img = lookImage(e.def.look); e.dx = e.x; e.dy = e.y; }
    for (const p of party) p.img = lookImage(p.def.look);
    this.layoutParty(true);
    this.backBtn = new Button({ x: 2, y: 2, w: 30, h: 16, label: '✕', size: 10, onClick: () => this.quit() });
    this.speedBtn = new Button({ x: W - 34, y: 2, w: 32, h: 16, label: '', size: 10, onClick: () => { G.settings.battleSpeed = G.settings.battleSpeed === 2 ? 1 : 2; saveSettings(G.settings); } });
  }

  enter() { if (this.started) return; this.started = true; this.battle.run(this).catch(e => { console.error(e); toast('전투 오류: ' + e.message, { color: C.red, ms: 5000 }); }); }

  get speed() { return this.G.settings.battleSpeed || 1; }
  ms(n) { return n / this.speed; }
  wait(n) { return this.G.fx.wait(this.ms(n)); }
  tw(o, to, n, e) { return this.G.fx.tween(o, to, this.ms(n), e); }

  // 줄(앞/뒤)에 따라 아군 위치를 정한다
  layoutParty(instant = false) {
    const rows = { front: 0, back: 0 };
    const jobs = [];
    for (const p of this.battle.party) {
      const [x, y] = SLOTS[p.row][rows[p.row]++ % 2];
      if (instant) { p.dx = x; p.dy = y; } else jobs.push(this.tw(p, { dx: x, dy: y }, 300, ease.outQuad));
    }
    return Promise.all(jobs);
  }

  quit() {
    // 이야기·지도 전투에서는 나갈 수 없다 (도주 버튼을 쓴다)
    if (this.onEnd && !this.ended) { toast('이 전투에서는 나갈 수 없어요', { color: C.mist }); return; }
    this.G.scenes.pop();
  }

  say(s, color = C.white, ms = 1400) { this.msg = { s, color, t: 0, ms: this.ms(ms) }; }

  float(u, s, color, size = 14) {
    const c = this.center(u);
    const f = { s, x: c.x, y: c.y - 20, a: 1, color, size };
    this.floats.push(f);
    this.G.fx.tween(f, { y: f.y - 18 }, this.ms(700), ease.outQuad);
    this.G.fx.tween(f, { a: 0 }, this.ms(300), ease.linear, this.ms(600)).then(() => this.floats.splice(this.floats.indexOf(f), 1));
  }

  center(u) { const im = u.img; return { x: u.dx + (im ? im.width / 2 : 32), y: u.dy + (im ? im.height / 2 : 32) }; }

  // ───────────── 조종기: 연출 ─────────────
  async event(e) {
    const fx = this.G.fx, b = this.battle;
    switch (e.type) {
      case 'start':
        this.banner = { s: this.enc.name, sub: this.enc.desc, a: 1 };
        await this.wait(900);
        await this.tw(this.banner, { a: 0 }, 300);
        this.banner = null;
        break;
      case 'turn': this.focus = e.unit; break;
      case 'skill': {
        const sk = SKILLS[e.skill];
        this.say(`${e.unit.name} — ${sk.name}`, e.unit.side === 'party' ? C.gold : C.pink);
        await this.wait(250);
        break;
      }
      case 'clash': {
        // 지역 변수로 들고 있어서, 연출이 겹쳐도 다른 연출의 손 공개를 지우지 않는다
        const rv = { mine: e.hand, theirs: e.enemyHand, result: e.result, k: 0, side: e.side };
        this.reveal = rv;
        sfx('confirm');
        await this.tw(rv, { k: 1 }, 260, ease.outBack);
        sfx(e.result === 'win' ? 'win' : e.result === 'lose' ? 'lose' : 'draw');
        if (e.result === 'win') fx.burst(W / 2, 112, { n: 16, colors: ['#fee761', '#feae34', '#fff'] });
        await this.wait(650);
        await this.tw(rv, { k: 0 }, 150);
        if (this.reveal === rv) this.reveal = null;
        break;
      }
      case 'damage': {
        const t = e.target, s = e.source;
        if (s && e.kind === 'hit') {
          const dir = s.side === 'party' ? -1 : 1;
          await this.tw(s, { ox: dir * 26 }, 120, ease.inQuad);
          this.tw(s, { ox: 0 }, 220, ease.outQuad);
        }
        t.flash = 1; this.tw(t, { flash: 0 }, 280, ease.linear);
        sfx('hit');
        fx.shake(e.crit ? 6 : t.side === 'party' ? 3 : 2, this.ms(200));
        const c = this.center(t);
        fx.burst(c.x, c.y, { n: e.crit ? 16 : 8, colors: e.kind === 'bleed' ? ['#e43b44', '#a22633'] : ['#fff', '#fee761', '#feae34'] });
        this.float(t, (e.crit ? '치명! ' : '') + e.amount, e.kind === 'bleed' ? C.red : t.side === 'party' ? C.red : e.crit ? C.orange : C.white, e.crit ? 16 : 14);
        await this.wait(260);
        break;
      }
      case 'miss': this.float(e.target, '빗나감', C.mist, 12); await this.wait(300); break;
      case 'heal': this.float(e.target, '+' + e.amount, C.green); fx.burst(this.center(e.target).x, this.center(e.target).y, { n: 12, colors: ['#63c74d', '#a7f070', '#fff'], gravity: -40 }); sfx('win'); await this.wait(400); break;
      case 'status': this.float(e.unit, STATUS_KO[e.status], C.cyan, 12); await this.wait(350); break;
      case 'status_end': break;
      case 'skip': this.say(`${e.unit.name}은(는) ${STATUS_KO[e.status]} 상태라 움직일 수 없다`, C.mist); await this.wait(700); break;
      case 'death':
        sfx('lose');
        await this.tw(e.unit, { alpha: 0.15 }, 400);
        break;
      case 'phase': {
        fx.flash('#d6004c', this.ms(300)); fx.shake(6, this.ms(400));
        await this.wait(300);
        const d = new DialogScene(this.G, [{ name: e.unit.name, text: e.line }]);
        this.G.scenes.push(d); await d.promise;
        if (e.fateDrain) this.say(`운명 게이지 -${e.fateDrain}`, C.pink);
        break;
      }
      case 'fate_use': fx.flash('#fee761', this.ms(250)); this.say('운명 개입! 이번 판은 반드시 이긴다', C.yellow); await this.wait(500); break;
      case 'reroll': fx.flash('#fee761', this.ms(250)); this.say('운명을 다시 굴린다!', C.yellow); await this.wait(500); break;
      case 'fate_drain': this.say(`운명 게이지 -${e.amount}`, C.pink); fx.shake(4, this.ms(300)); await this.wait(600); break;
      case 'gamble': this.say(`🎲 ${e.label}`, e.index >= 3 ? C.yellow : e.index === 0 ? C.mist : C.white); await this.wait(600); break;
      case 'foresight': this.say('예지 — 다음 한 판은 져도 무승부가 된다', C.cyan, 1800); await this.wait(700); break;
      case 'guard': this.float(e.unit, '방어', C.blue, 12); await this.wait(300); break;
      case 'swap': await this.layoutParty(); break;
      case 'flee': this.say(e.ok ? '무사히 도망쳤다!' : '도망치지 못했다!', e.ok ? C.green : C.red); await this.wait(700); break;
      case 'counter': this.say(`${e.unit.name}의 역습!`, e.unit.side === 'party' ? C.gold : C.pink); await this.wait(300); break;
      case 'fizzle': this.float(e.unit, '불발', C.mist, 12); await this.wait(400); break;
      case 'message': this.say(e.text, C.gold); await this.wait(400); break;
      case 'end': this.finish(e.result); break;
    }
  }

  // ───────────── 조종기: 결정 ─────────────
  ask(mode, setup) {
    return new Promise(res => { this.mode = mode; this.pending = res; setup?.(); });
  }
  answer(v) { const r = this.pending; this.pending = null; this.mode = 'busy'; this.menu = null; this.extra = []; r?.(v); }

  chooseAction(u) { return this.ask('action', () => this.openActions(u)); }

  openActions(u) {
    this.mode = 'action'; this.extra = [];
    const b = this.battle, basic = u.skills.find(id => SKILLS[id].mp === 0);
    const otherRow = b.alive('party').filter(p => p.row !== u.row);
    const items = [
      ['공격', () => this.pickTarget(u, basic), !b.canUse(u, basic), SKILLS[basic].name + (SKILLS[basic].melee ? ' (근접)' : '')],
      ['스킬', () => this.openSkills(u), false, '스킬 목록'],
      ['방어', () => this.answer({ type: 'guard' }), false, '이번 턴 받는 피해 -50%'],
      ['아이템', () => this.pickAlly(u, t => ({ type: 'item', item: 'potion', target: t })), !b.items.potion, `회복약 ${b.items.potion}개 — HP 35% 회복`],
      ['교대', () => this.pickAlly(u, t => ({ type: 'swap', with: t }), otherRow), !otherRow.length, '앞줄과 뒷줄을 바꾼다 (뒷줄: 받는 피해 -25%, 근접 불가)'],
      ['도주', () => this.answer({ type: 'flee' }), !b.canFlee, b.canFlee ? '50% 확률로 도망친다' : '보스에게서는 도망칠 수 없다'],
    ];
    const btns = items.map(([label, onClick, disabled, tip], i) => {
      const bt = new Button({ x: ACT.x + 6 + (i % 2) * 70, y: ACT.y + 8 + Math.floor(i / 2) * 24, w: 68, h: 22, label, onClick, disabled, size: 11 });
      bt.tip = tip; return bt;
    });
    this.menu = new Menu(btns, { columns: 2 });
  }

  openSkills(u) {
    this.mode = 'skill';
    const b = this.battle;
    const list = u.skills.filter(id => SKILLS[id].mp > 0);
    const btns = list.map((id, i) => {
      const sk = SKILLS[id], ok = b.canUse(u, id);
      const why = (sk.mp || 0) > u.mp ? ' · MP 부족' : sk.melee && u.row === 'back' ? ' · 뒷줄 근접 불가' : '';
      const bt = new Button({ x: CTX.x + 6, y: CTX.y + 6 + i * 18, w: CTX.w - 12, h: 17, label: `${sk.name}   MP ${sk.mp}${why}`, size: 10, disabled: !ok,
        onClick: () => sk.target === 'ally' ? this.pickAlly(u, t => ({ type: 'skill', skill: id, target: t }))
          : sk.target === 'self' ? this.answer({ type: 'skill', skill: id }) : this.pickTarget(u, id) });
      bt.h = 17; bt.tip = sk.desc; return bt;
    });
    this.menu = new Menu(btns, { onCancel: () => this.openActions(u) });
    this.menu.keyboard = true;
    // 마우스·터치로도 돌아갈 수 있게 (쓸 수 있는 스킬이 없어도 갇히지 않는다)
    this.extra = [new Button({ x: ACT.x + 8, y: ACT.y + 50, w: 70, h: 24, label: '← 뒤로', size: 11, onClick: () => this.openActions(u) })];
  }

  pickTarget(u, skillId) {
    const alive = this.battle.alive('enemy');
    if (alive.length === 1) { this.answer({ type: 'skill', skill: skillId, target: alive[0] }); return; }
    this.mode = 'target'; this.menu = null; this.extra = [];
    this.targeting = { list: alive, i: Math.max(0, alive.indexOf(this.lastTarget)), done: t => { this.lastTarget = t; this.answer({ type: 'skill', skill: skillId, target: t }); }, back: () => this.openActions(u), side: 'enemy' };
  }

  pickAlly(u, make, list = null) {
    this.mode = 'target'; this.menu = null; this.extra = [];
    const alive = list || this.battle.alive('party');
    this.targeting = { list: alive, i: Math.max(0, alive.indexOf(u)), done: t => this.answer(make(t)), back: () => this.openActions(u), side: 'party' };
  }

  chooseHand(info) {
    return this.ask('hand', () => { this.handInfo = { ...info, attack: true }; this.focus = info.target; this.openHands(info, true); });
  }

  chooseDefense(info) {
    if (this.G.settings.autoDefense && !this.battle.fateReady) {
      return this.wait(250).then(() => ({ hand: pickHand(null, info.said), fate: false }));
    }
    return this.ask('hand', () => { this.handInfo = { ...info, attack: false }; this.focus = info.enemy; this.openHands(info, false); });
  }

  openHands(info, attack) {
    this.fateArmed = false;
    if (this.enc.tutorial && !this.tutShown) { this.tutShown = true; this.say('바위·가위·보 중 하나를 눌러요. 무엇이 나올지는 운!', C.yellow, 3500); }
    const icons = GRID.hands || [];
    const btns = HANDS.map((h, i) => {
      const bt = new Button({ x: CTX.x + 6 + i * 76, y: CTX.y + 6, w: 72, h: 52, label: '', size: 11,
        disabled: !!info.fixed && info.fixed !== h, onClick: () => this.answer({ hand: h, fate: this.fateArmed }) });
      bt.hand = h; bt.iconImg = icons[i]; return bt;
    });
    this.menu = new Menu(btns, { layout: 'horizontal', index: info.fixed ? HANDS.indexOf(info.fixed) : 0 });
    this.extra = [];
    if (this.battle.fateReady) this.extra.push(new Button({ x: CTX.x + 6, y: CTX.y + 60, w: 110, h: 16, size: 10, label: '운명 개입: 꺼짐', onClick: bt => { this.fateArmed = !this.fateArmed; bt.label = '운명 개입: ' + (this.fateArmed ? '켜짐' : '꺼짐'); } }));
    if (!attack) this.extra.push(new Button({ x: CTX.x + CTX.w - 112, y: CTX.y + 60, w: 106, h: 16, size: 10, label: '자동 방어: ' + (this.G.settings.autoDefense ? '켜짐' : '꺼짐'),
      onClick: bt => { const s = this.G.settings; s.autoDefense = !s.autoDefense; saveSettings(s); bt.label = '자동 방어: ' + (s.autoDefense ? '켜짐' : '꺼짐'); } }));
  }

  offerReroll(info) {
    return this.ask('reroll', () => {
      this.say('졌다… 운명 게이지로 다시 굴릴까?', C.yellow, 99999);
      this.menu = new Menu([
        new Button({ x: CTX.x + 10, y: CTX.y + 16, w: 104, h: 30, label: '다시 굴리기', sub: '운명 100 사용', onClick: () => { this.msg = null; this.answer(true); } }),
        new Button({ x: CTX.x + 120, y: CTX.y + 16, w: 104, h: 30, label: '그대로', onClick: () => { this.msg = null; this.answer(false); } }),
      ], { layout: 'horizontal' });
      this.menu.keyboard = true;
    });
  }

  finish(result) {
    this.ended = result; this.mode = 'end';
    const b = this.battle, d = this.G.data;
    const label = { win: '승리!', lose: '전멸…', fled: '도망쳤다' }[result];
    this.banner = { s: label, sub: `${b.round}라운드 · 합 ${b.stats.clashes}번 중 ${b.stats.wins}번 승리`, a: 1, color: result === 'win' ? C.gold : result === 'lose' ? C.red : C.pale };
    sfx(result === 'win' ? 'win' : 'lose');
    // HP를 저장 데이터로 (쓰러진 동료는 HP 1로 일어난다)
    if (this.persist && result !== 'lose') for (const p of b.party) d.hp[p.id] = Math.max(1, p.hp);
    // 보상 (이겼을 때만, 튜토리얼 제외)
    if (result === 'win' && d && !this.enc.tutorial) {
      const luck = Math.round(b.party.reduce((a, p) => a + (p.luck || 0), 0) / b.party.length);
      const rw = rollRewards(b.enemies, createRng(this.seed ^ 0xabc), { luck, firstKill: d.progress.firstKill });
      d.gold += rw.gold; d.enhance += rw.enhance; d.stones += rw.stones; d.inventory.push(...rw.items);
      save('auto', d);
      this.rewards = rw;
    }
    this.onSettle?.(result);
    const btns = [];
    if (this.onEnd) {
      if (result === 'lose' && this.retry) btns.push(new Button({ x: W / 2 - 60, y: 150, w: 120, h: 26, label: '다시 도전', onClick: () => { this.G.scenes.pop(); this.G.scenes.push(new BattleScene(this.G, this.key, { onEnd: this.onEnd, retry: true })); } }));
      else btns.push(new Button({ x: W / 2 - 60, y: 150, w: 120, h: 26, label: '계속', onClick: () => { this.G.scenes.pop(); this.onEnd(result); } }));
    } else {
      btns.push(new Button({ x: W / 2 - 110, y: 150, w: 104, h: 26, label: '다시 싸우기', onClick: () => { this.G.scenes.pop(); this.G.scenes.push(new BattleScene(this.G, this.key)); } }));
      btns.push(new Button({ x: W / 2 + 6, y: 150, w: 104, h: 26, label: '나가기', onClick: () => this.G.scenes.pop() }));
    }
    this.menu = new Menu(btns, { layout: 'horizontal' });
    this.menu.keyboard = true;
  }

  // ───────────── 갱신 ─────────────
  update(dt) {
    const G = this.G, input = G.input;
    this.t += dt;
    if (this.msg) { this.msg.t += dt * 1000; if (this.msg.t > this.msg.ms) this.msg = null; }
    tooltip.begin(); tooltip.update(dt);
    this.backBtn.update(G, dt);
    this.speedBtn.label = '×' + this.speed; this.speedBtn.update(G, dt);
    // 적 툴팁: 이름, 패턴
    for (const e of this.battle.alive('enemy')) {
      const im = e.img;
      if (im) tooltip.check(G, e.dx, e.dy, im.width, im.height, `${e.name} (${{ normal: '일반', elite: '강적', boss: '보스' }[e.def.tier]}) HP ${e.hp}/${e.maxHp}.${Object.keys(e.status).length ? ' 상태: ' + Object.keys(e.status).map(s => STATUS_KO[s]).join(', ') : ''}`);
    }
    if (this.mode === 'target') { this.updateTarget(input); return; }
    const m = this.menu;
    if (m) {
      m.update(G, dt);
      // 버튼을 누른 결과로 메뉴가 바뀌었을 수 있다 → 원래 메뉴(m)일 때만 이어서 처리
      if (this.menu === m && this.mode === 'hand') HANDS.forEach((h, i) => { if (input.pressed(h) && !m.buttons[i].disabled) m.buttons[i].click(); });
      if (this.menu === m) m.buttons.forEach(b => b.tip && tooltip.check(G, b.x, b.y, b.w, b.h, b.tip));
    }
    for (const b of this.extra) b.update(G, dt);
  }

  updateTarget(input) {
    const T = this.targeting;
    T.list = T.list.filter(u => u.hp > 0);
    if (!T.list.length) { T.back(); return; }
    T.i = Math.min(T.i, T.list.length - 1);
    if (input.pressed('left') || input.pressed('up')) { T.i = (T.i + T.list.length - 1) % T.list.length; sfx('move'); }
    if (input.pressed('right') || input.pressed('down')) { T.i = (T.i + 1) % T.list.length; sfx('move'); }
    if (input.pressed('confirm')) { sfx('confirm'); T.done(T.list[T.i]); return; }
    if (input.pressed('cancel')) { sfx('cancel'); T.back(); return; }
    if (input.pointer.tapped) {
      const p = input.pointer;
      // 아래 UI를 누르면 뒤로
      if (p.y >= PANEL_Y) { sfx('cancel'); T.back(); return; }
      const hit = T.list.find(u => u.img && p.x >= u.dx && p.x < u.dx + u.img.width && p.y >= u.dy + 8 && p.y < u.dy + u.img.height);
      if (hit) { sfx('confirm'); T.done(hit); }
    } else if (input.pointer.active) {
      const p = input.pointer;
      const k = T.list.findIndex(u => u.img && p.x >= u.dx && p.x < u.dx + u.img.width && p.y >= u.dy + 8 && p.y < u.dy + u.img.height);
      if (k >= 0) T.i = k;
    }
    this.focus = T.list[T.i];
  }

  // ───────────── 그리기 ─────────────
  drawUnit(ctx, u, k) {
    const im = u.img;
    if (!im) return;
    const bob = u.hp > 0 && !u.status.petrify ? Math.floor((this.t * 1000 + k * 170) / 430) % 2 : 0;
    const x = Math.round(u.dx + u.ox), y = Math.round(u.dy + u.oy + bob);
    shadow(ctx, u.dx + im.width / 2, u.dy + im.height - 2, Math.round(im.width * 0.45));
    ctx.globalAlpha = u.alpha;
    if (u.status.petrify) ctx.filter = 'grayscale(1)';
    ctx.drawImage(im, x, y);
    ctx.filter = 'none';
    if (u.flash > 0.4) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(im, x, y); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = 1;
  }

  // 보스의 「예고」 말풍선 (진실일 수도, 거짓일 수도)
  drawSaid(ctx, e) {
    const said = this.handInfo?.said;
    if (!e || !said || e.hp <= 0 || !e.img) return;
    const t = `「다음은 ${HAND_KO[said]}다!」`, w = Math.ceil(measure(ctx, t, 10)) + 12;
    const x = Math.max(2, Math.min(W - w - 2, e.dx + e.img.width / 2 - w / 2)), y = Math.max(32, e.dy - 4);
    panel(ctx, x, y, w, 16, { fill: C.ink, border: C.pink, accent: C.pink });
    text(ctx, t, x + 6, y + 3, { size: 10, color: C.pink });
  }

  draw(ctx) {
    const b = this.battle;
    drawBackdrop(ctx, this.enc.bg || 'rock', this.t);
    ctx.fillStyle = C.ink; ctx.fillRect(0, PANEL_Y - 2, W, H - PANEL_Y + 2);
    b.enemies.forEach((e, i) => this.drawUnit(ctx, e, i));
    [...b.party].sort((a, c) => a.dy - c.dy).forEach((p, i) => this.drawUnit(ctx, p, i + 3));
    // 적 체력 막대
    for (const e of b.enemies) {
      if (e.hp <= 0 || !e.img) continue;
      const w = Math.min(60, e.img.width - 8), x = e.dx + (e.img.width - w) / 2, y = e.dy + e.img.height - 2;
      bar(ctx, x, y, w, 4, e.hp / e.maxHp, e.def.tier === 'boss' ? C.pink : C.red);
      const st = Object.keys(e.status).map(s => STATUS_KO[s]).join(' ');
      if (st) text(ctx, st, x + w / 2, y + 5, { size: 10, color: C.cyan, align: 'center' });
    }
    // 차례 표시
    const f = this.focus;
    if (f && f.hp > 0 && f.img && this.mode !== 'end') {
      const c = f.dx + f.img.width / 2;
      text(ctx, '▼', c, f.dy - 4 + Math.floor(this.t * 3) % 2 * 2, { color: this.mode === 'target' ? C.white : C.gold, align: 'center', size: 10 });
    }
    // 대상 고르기 중이면 자세 표시
    if (this.mode === 'hand') this.drawSaid(ctx, this.handInfo.attack ? this.handInfo.target : this.handInfo.enemy);
    if (this.mode === 'target') text(ctx, this.targeting.side === 'enemy' ? '대상을 고르세요 (누르거나 ←→, Enter)' : '아군을 고르세요', W / 2, PANEL_Y - 16, { align: 'center', size: 10, color: C.white });
    // 손 공개
    if (this.reveal) this.drawReveal(ctx);
    for (const fl of this.floats) text(ctx, fl.s, fl.x, fl.y, { color: fl.color, align: 'center', size: fl.size, alpha: fl.a });
    this.drawTop(ctx);
    this.drawBottom(ctx);
    if (this.msg) {
      const w = Math.ceil(measure(ctx, this.msg.s)) + 20;
      ctx.fillStyle = 'rgba(24,20,37,0.8)'; ctx.fillRect((W - w) / 2, 20, w, 17);
      text(ctx, this.msg.s, W / 2, 22, { color: this.msg.color, align: 'center' });
    }
    if (this.banner) {
      ctx.globalAlpha = this.banner.a;
      ctx.fillStyle = 'rgba(24,20,37,0.8)'; ctx.fillRect(0, 84, W, 56);
      text(ctx, this.banner.s, W / 2, 92, { color: this.banner.color || C.gold, align: 'center', size: 24, alpha: this.banner.a });
      text(ctx, this.banner.sub, W / 2, 122, { color: C.pale, align: 'center', size: 10, alpha: this.banner.a });
      if (this.rewards) {
        const r = this.rewards;
        ctx.fillStyle = 'rgba(24,20,37,0.95)'; ctx.fillRect(0, 180, W, H - 180);
        const parts = [`금화 +${r.gold}`, r.enhance && `강화석 +${r.enhance}`, r.stones && `운명석 +${r.stones} (첫 처치)`].filter(Boolean).join(' · ');
        text(ctx, parts, W / 2, 184, { color: C.yellow, align: 'center', size: 10 });
        r.items.slice(0, 3).forEach((it, i) => text(ctx, `${RARITY[it.rarity].name} ${it.name} 획득!`, W / 2, 198 + i * 12, { color: RARITY[it.rarity].glow, align: 'center', size: 10 }));
      }
      ctx.globalAlpha = 1;
    }
    if (this.mode === 'end') this.menu?.draw(ctx);
    tooltip.draw(ctx);
  }

  drawReveal(ctx) {
    const r = this.reveal, icons = GRID.hands || [], k = Math.min(1, r.k);
    const ei = icons[HANDS.indexOf(r.theirs)], mi = icons[HANDS.indexOf(r.mine)];
    const cy = 96;
    ctx.globalAlpha = k * 0.85; ctx.fillStyle = C.ink; ctx.fillRect(W / 2 - 80, cy - 6, 160, 48); ctx.globalAlpha = 1;
    if (ei) sprite(ctx, ei, W / 2 - 40 - 32 * k, cy, { alpha: k, flip: true });
    if (mi) sprite(ctx, mi, W / 2 + 40 + 32 * k - 32, cy, { alpha: k });
    text(ctx, r.side === 'attack' ? '공격 합' : '방어 합', W / 2, cy - 2, { size: 10, color: C.mist, align: 'center', alpha: k });
    text(ctx, RESULT_KO[r.result], W / 2, cy + 14, { size: 14, color: RESULT_COLOR[r.result], align: 'center', alpha: k });
  }

  drawTop(ctx) {
    const b = this.battle;
    ctx.fillStyle = 'rgba(24,20,37,0.75)'; ctx.fillRect(0, 0, W, 19);
    this.backBtn.draw(ctx);
    // 턴 순서
    let x = 38;
    const order = (b.order || []).filter(u => u.hp > 0);
    const curI = order.indexOf(b.current);
    order.forEach((u, i) => {
      const s = u.def.short || u.name;
      const w = Math.ceil(measure(ctx, s, 10)) + 8;
      if (x + w > 300) return;
      const done = i < curI, cur = i === curI;
      ctx.fillStyle = cur ? C.gold : u.side === 'party' ? '#1e3a5f' : '#5f1e2e';
      ctx.globalAlpha = done ? 0.4 : 1; ctx.fillRect(x, 3, w, 13); ctx.globalAlpha = 1;
      text(ctx, s, x + 4, 4, { size: 10, color: cur ? C.ink : C.white, shadow: !cur, alpha: done ? 0.5 : 1 });
      x += w + 2;
    });
    // 연승, 운명
    text(ctx, `연승 ★${b.streak}`, 306, 4, { size: 10, color: b.streak ? C.yellow : C.mist });
    text(ctx, '운명', 362, 4, { size: 10, color: b.fateReady ? C.yellow : C.pale });
    bar(ctx, 388, 6, 54, 8, b.fate / 100, b.fateReady ? C.yellow : C.orange);
    if (b.fateReady && Math.floor(this.t * 4) % 2) { ctx.strokeStyle = C.yellow; ctx.strokeRect(387.5, 5.5, 55, 9); }
    this.speedBtn.draw(ctx);
  }

  drawBottom(ctx) {
    const b = this.battle;
    panel(ctx, ACT.x, ACT.y, ACT.w, ACT.h);
    panel(ctx, CTX.x, CTX.y, CTX.w, CTX.h, { accent: C.orange });
    panel(ctx, PTY.x, PTY.y, PTY.w, PTY.h, { accent: C.cyan });
    // 아군 상태
    b.party.forEach((p, i) => {
      const y = PTY.y + 6 + i * 18, cur = p === b.current;
      text(ctx, p.name, PTY.x + 6, y, { size: 10, color: p.hp <= 0 ? C.slate : cur ? C.gold : C.white });
      text(ctx, p.row === 'front' ? '앞' : '뒤', PTY.x + 74, y, { size: 10, color: C.mist, align: 'right' });
      bar(ctx, PTY.x + 6, y + 11, 70, 4, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? C.red : C.green);
      bar(ctx, PTY.x + 6, y + 15, 70, 2, p.mp / p.maxMp, C.blue);
    });
    const cur = b.current;
    // 왼쪽: 행동
    if (this.mode === 'action' || this.mode === 'skill' || (this.mode === 'target' && this.menu === null && this.targeting?.side)) {
      if (this.mode === 'action') this.menu.draw(ctx);
      else text(ctx, this.mode === 'skill' ? '스킬을 고르세요' : '대상 고르는 중', ACT.x + 10, ACT.y + 10, { size: 10, color: C.mist });
      if (this.mode === 'target') text(ctx, 'Esc/아래 화면: 뒤로', ACT.x + 10, ACT.y + 60, { size: 10, color: C.slate });
    } else if (this.mode === 'hand') {
      const hi = this.handInfo;
      text(ctx, hi.attack ? `${hi.actor.name} — ${SKILLS[hi.skill].name}` : `${hi.enemy.name}의 ${SKILLS[hi.skill].name}!`, ACT.x + 8, ACT.y + 8, { size: 10, color: hi.attack ? C.gold : C.pink });
      text(ctx, hi.attack ? '낼 손을 고르세요' : '막을 손을 고르세요', ACT.x + 8, ACT.y + 24, { size: 11 });
      const tip = hi.attack ? ['이기면 강하게, 비기면 보통', '지면 불발 (역습 주의)'] : ['이기면 거의 안 아프다', '비기면 덜 아프다'];
      tip.forEach((l, k) => text(ctx, l, ACT.x + 8, ACT.y + 38 + k * 11, { size: 10, color: C.mist }));
      if (hi.attack && SKILLS[hi.skill].kind === 'finisher') text(ctx, '필승기: 이겨야만 발동', ACT.x + 8, ACT.y + 64, { size: 10, color: C.orange });
      if (hi.fixed) text(ctx, `손 고정: ${HAND_KO[hi.fixed]}만`, ACT.x + 8, ACT.y + 64, { size: 10, color: C.orange });
    } else if (this.mode === 'busy' && cur) {
      text(ctx, `${cur.name}의 차례`, ACT.x + 10, ACT.y + 10, { size: 11, color: cur.side === 'party' ? C.gold : C.pink });
    }
    // 가운데
    if (this.mode === 'skill') this.menu.draw(ctx);
    if (this.mode === 'hand') this.drawHands(ctx);
    if (this.mode === 'reroll') this.menu.draw(ctx);
    if (this.mode === 'target' && this.focus) {
      const u = this.focus;
      text(ctx, u.name, CTX.x + 10, CTX.y + 8, { color: C.gold });
      text(ctx, `HP ${u.hp} / ${u.maxHp}`, CTX.x + 10, CTX.y + 26, { size: 10, color: C.pale });
      if (u.side === 'enemy') text(ctx, { normal: '일반', elite: '강적', boss: '보스' }[u.def.tier], CTX.x + 10, CTX.y + 42, { size: 10, color: C.pink });
    }
    for (const e of this.extra) e.draw(ctx);
  }

  drawHands(ctx) {
    this.menu.buttons.forEach(bt => {
      bt.sub = '';
      bt.draw(ctx);
      const h = bt.hand, dy = bt.pressT > 0 ? 1 : 0;
      // 손 그림과 이름만 (가운데)
      if (bt.iconImg) sprite(ctx, bt.iconImg, bt.x + (bt.w - 32) / 2, bt.y + 4 + dy, { alpha: bt.disabled ? 0.35 : 1 });
      text(ctx, HAND_KO[h], bt.x + bt.w / 2, bt.y + 38 + dy, { size: 11, align: 'center', color: bt.disabled ? C.slate : bt.focus || bt.hover ? C.gold : C.white });
    });
    if (this.fateArmed) text(ctx, '확정 승리!', CTX.x + 122, CTX.y + 62, { size: 10, color: C.yellow });
  }
}
