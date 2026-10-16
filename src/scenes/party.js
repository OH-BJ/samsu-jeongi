// 파티 편성: 동료 교체 · 장비 · 직업(이로) · 탈것 · 앞줄/뒷줄
import { W, H } from '../core/screen.js';
import { panel, text, C } from '../core/render.js';
import { sfx } from '../core/audio.js';
import { save } from '../core/save.js';
import { Button } from '../ui/button.js';
import { toast } from '../ui/toast.js';
import { ListView } from '../ui/list.js';
import { drawResources } from '../ui/resources.js';
import { drawItemIcon, drawFace, rarityGlow, rarityBox } from '../ui/icons.js';
import { RARITY, rank } from '../../data/rarity.js';
import { ALL_UNITS, ROLE_KO } from '../../data/companions.js';
import { JOBS } from '../../data/jobs.js';
import { MOUNTS } from '../../data/mounts.js';
import { SLOTS, SLOT_KO } from '../../data/equipment.js';
import { optionText } from '../../data/options.js';
import { SKILLS } from '../../data/skills.js';
import { unitBuild, power, findItem, equippedBy, fixRows } from '../systems/party.js';

const HAND_KO = { rock: '바위', scissors: '가위', paper: '보', balanced: '균형' };
const TABS = [['equip', '장비'], ['member', '동료 교체'], ['job', '직업'], ['mount', '탈것']];

export class PartyScene {
  constructor(G) {
    this.G = G; this.sel = 0; this.tab = 'equip'; this.slot = null;
    this.tabBtns = TABS.map(([id, label], i) => new Button({ x: 162 + i * 79, y: 20, w: 76, h: 20, label, size: 10, onClick: () => this.setTab(id) }));
    this.rowBtn = new Button({ x: 6, y: 246, w: 74, h: 20, label: '줄 바꾸기', size: 10, onClick: () => this.toggleRow() });
    this.backBtn = new Button({ x: 82, y: 246, w: 74, h: 20, label: '돌아가기', size: 10, onClick: () => this.close() });
    this.members = new ListView({ x: 6, y: 20, w: 150, h: 148, rowH: 37, items: this.slots(), drawRow: (c, p, x, y, w, h, s) => this.drawMember(c, p, x, y, w, h, s), onSelect: (_, i) => { this.sel = i; this.refresh(); } });
    this.list = new ListView({ x: 162, y: 66, w: 312, h: 176, rowH: 22, drawRow: (c, it, x, y, w, h, s) => this.drawRow(c, it, x, y, w, h, s), onPick: it => this.pick(it) });
    this.focusList = false; // 키보드: 왼쪽 목록 ↔ 오른쪽 목록
    this.refresh();
  }
  get data() { return this.G.data; }
  // 파티 4칸 (빈칸 포함)
  slots() { const p = this.data.party; return [...p, ...Array.from({ length: Math.max(0, 4 - p.length) }, () => ({ empty: true }))]; }
  get member() { return this.members ? this.members.items[this.sel] : this.data.party[0]; }
  close() { save('auto', this.data); this.G.scenes.pop(); }
  setTab(id) {
    if (this.member.empty && id !== 'member' && id !== 'mount') { toast('빈자리예요. 「동료 교체」에서 동료를 넣어 주세요', { color: C.mist }); return; }
    if (id === 'job' && this.member.id !== 'iro') { toast('직업은 이로만 바꿀 수 있어요', { color: C.mist }); return; }
    if (id === 'member' && this.member.id === 'iro') { toast('이로는 빠질 수 없어요', { color: C.mist }); return; }
    this.tab = id; this.slot = null; this.refresh();
  }
  toggleRow() {
    // 앞줄 2명 · 뒷줄 2명을 유지한다: 반대 줄의 한 명과 자리를 바꾼다
    const p = this.member, other = this.data.party.find(q => q !== p && q.row !== p.row);
    if (p.empty || !other) return;
    [p.row, other.row] = [other.row, p.row];
    toast(`${ALL_UNITS[p.id].name} → ${p.row === 'front' ? '앞줄' : '뒷줄'}, ${ALL_UNITS[other.id].name} → ${other.row === 'front' ? '앞줄' : '뒷줄'}`, { color: C.pale });
  }

  // 오른쪽 목록 채우기
  refresh() {
    const d = this.data, m = this.member;
    if (m.empty) this.tab = this.tab === 'mount' ? 'mount' : 'member';
    if (this.tab === 'job' && m.id !== 'iro') this.tab = 'equip';
    if (this.tab === 'member' && m.id === 'iro') this.tab = 'equip';
    let items = [];
    if (this.tab === 'equip') {
      if (!this.slot) items = SLOTS.map(s => ({ type: 'slot', slot: s }));
      else items = [{ type: 'back' }, { type: 'unequip' }, ...d.inventory.filter(i => i.slot === this.slot).sort((a, b) => rank(b.rarity) - rank(a.rarity) || b.plus - a.plus).map(i => ({ type: 'item', item: i }))];
    } else if (this.tab === 'member') {
      const inParty = d.party.map(p => p.id);
      items = Object.keys(d.companions).filter(id => !inParty.includes(id)).sort((a, b) => rank(ALL_UNITS[b].rarity) - rank(ALL_UNITS[a].rarity)).map(id => ({ type: 'unit', id }));
      if (!items.length) items = [{ type: 'empty', text: '넣을 수 있는 동료가 없어요. 동료 우물에서 뽑아 보세요.' }];
      if (!m.empty) items.unshift({ type: 'remove' });
    } else if (this.tab === 'job') {
      items = Object.keys(d.jobs).sort((a, b) => rank(JOBS[b].rarity) - rank(JOBS[a].rarity)).map(id => ({ type: 'job', id }));
    } else if (this.tab === 'mount') {
      items = [{ type: 'nomount' }, ...Object.keys(d.mounts).sort((a, b) => rank(MOUNTS[b].rarity) - rank(MOUNTS[a].rarity)).map(id => ({ type: 'mount', id }))];
    }
    this.list.setItems(items);
    this.list.selected = Math.min(this.list.selected, items.length - 1);
  }

  pick(it) {
    const d = this.data, m = this.member;
    if (!it) return;
    if (it.type === 'slot') { this.slot = it.slot; this.list.selected = 0; this.list.scroll = 0; this.refresh(); return; }
    if (it.type === 'back') { this.slot = null; this.list.selected = 0; this.refresh(); return; }
    if (it.type === 'unequip') { if (d.equip[m.id]) delete d.equip[m.id][this.slot]; sfx('cancel'); this.slot = null; this.refresh(); return; }
    if (it.type === 'item') {
      const owner = equippedBy(d, it.item.uid);
      if (owner && owner !== m.id) delete d.equip[owner][it.item.slot];
      (d.equip[m.id] ||= {})[it.item.slot] = it.item.uid;
      sfx('confirm'); toast(`${it.item.name} 장착`, { color: C.green });
      this.slot = null; this.list.selected = 0; this.refresh(); return;
    }
    if (it.type === 'unit') {
      if (m.empty) { d.party.push({ id: it.id, row: 'back' }); fixRows(d); } else m.id = it.id;
      sfx('confirm'); toast(`${ALL_UNITS[it.id].name} 합류`, { color: C.green }); this.resetMembers(); return;
    }
    if (it.type === 'remove') { d.party.splice(d.party.indexOf(m), 1); fixRows(d); sfx('cancel'); toast(`${ALL_UNITS[m.id].name}이(가) 파티에서 빠졌다`, { color: C.mist }); this.resetMembers(); return; }
    if (it.type === 'job') { d.job = it.id; sfx('confirm'); toast(`이로의 직업: ${JOBS[it.id].name}`, { color: C.pink }); return; }
    if (it.type === 'nomount') { d.mount = null; return; }
    if (it.type === 'mount') { d.mount = it.id; sfx('confirm'); toast(`탈것: ${MOUNTS[it.id].name}`, { color: C.green }); }
  }

  resetMembers() { this.members.setItems(this.slots()); this.sel = Math.min(this.sel, 3); this.members.selected = this.sel; this.refresh(); }

  update(dt) {
    const G = this.G, input = G.input;
    this.tabBtns.forEach(b => b.update(G, dt));
    this.rowBtn.update(G, dt); this.backBtn.update(G, dt);
    if (input.pressed('left')) this.focusList = false;
    if (input.pressed('right')) this.focusList = true;
    if (input.pressed('cancel')) { if (this.slot) { this.slot = null; this.refresh(); } else this.close(); return; }
    this.members.update(G, dt, { keys: !this.focusList });
    this.list.update(G, dt, { keys: this.focusList });
  }

  drawMember(ctx, p, x, y, w, h, s) {
    if (p.empty) { text(ctx, '— 빈자리 —', x + w / 2, y + 12, { size: 10, align: 'center', color: s ? C.gold : C.slate }); return; }
    const d = ALL_UNITS[p.id], b = unitBuild(this.data, p.id);
    drawFace(ctx, p.id, x + 4, y + 2);
    text(ctx, d.name, x + 40, y + 4, { size: 11, color: s ? C.gold : C.white });
    text(ctx, `${RARITY[d.rarity].name} · ${HAND_KO[b.hand]} · ${p.row === 'front' ? '앞' : '뒤'}`, x + 40, y + 18, { size: 10, color: rarityGlow(d.rarity) });
    text(ctx, String(power(b)), x + w - 6, y + 4, { size: 10, align: 'right', color: C.yellow });
  }

  drawRow(ctx, it, x, y, w, h, s) {
    const d = this.data, m = this.member;
    const col = s ? C.gold : C.white;
    if (it.type === 'slot') {
      const item = findItem(d, d.equip[m.id]?.[it.slot]);
      text(ctx, SLOT_KO[it.slot], x + 6, y + 5, { size: 10, color: C.mist });
      if (item) { drawItemIcon(ctx, item, x + 46, y - 1); text(ctx, `${item.name}${item.plus ? ' +' + item.plus : ''}`, x + 74, y + 5, { size: 11, color: rarityGlow(item.rarity) }); }
      else text(ctx, '— 비어 있음 —', x + 74, y + 5, { size: 10, color: C.slate });
      return;
    }
    if (it.type === 'back') { text(ctx, '← 부위 목록으로', x + 6, y + 5, { size: 10, color: C.mist }); return; }
    if (it.type === 'unequip') { text(ctx, `${SLOT_KO[this.slot]} 해제`, x + 6, y + 5, { size: 10, color: C.pink }); return; }
    if (it.type === 'empty') { text(ctx, it.text, x + 6, y + 5, { size: 10, color: C.mist }); return; }
    if (it.type === 'remove') { text(ctx, `${ALL_UNITS[m.id].name} 파티에서 빼기`, x + 6, y + 5, { size: 10, color: C.pink }); return; }
    if (it.type === 'item') {
      const i = it.item, owner = equippedBy(d, i.uid);
      drawItemIcon(ctx, i, x + 4, y - 1);
      text(ctx, `${i.name}${i.plus ? ' +' + i.plus : ''}`, x + 32, y + 5, { size: 11, color: rarityGlow(i.rarity) });
      const st = Object.entries(i.base).map(([k, v]) => `${{ atk: '공', def: '방', hp: 'HP', spd: '속', crit: '치', luck: '운' }[k]}${k === 'crit' ? Math.round(v * 100) + '%' : v}`).join(' ');
      text(ctx, `${st} · 옵션 ${i.opts.length + (i.uniques?.length || 0)}`, x + w - 8, y + 5, { size: 10, align: 'right', color: C.mist });
      if (owner) text(ctx, ALL_UNITS[owner].name, x + 200, y + 5, { size: 10, color: owner === m.id ? C.green : C.slate, align: 'right' });
      return;
    }
    if (it.type === 'unit') {
      const u = ALL_UNITS[it.id], b = unitBuild(d, it.id);
      drawFace(ctx, it.id, x + 2, y - 6, 22);
      text(ctx, u.name, x + 30, y + 5, { size: 11, color: rarityGlow(u.rarity) });
      const br = u.gacha ? `돌파 ${d.companions[it.id]}` : '이야기';
      text(ctx, `${RARITY[u.rarity].name} · ${HAND_KO[u.hand]} · ${u.role ? ROLE_KO[u.role] : '동료'} · ${br}`, x + 150, y + 5, { size: 10, color: C.mist });
      text(ctx, String(power(b)), x + w - 8, y + 5, { size: 10, align: 'right', color: C.yellow });
      return;
    }
    if (it.type === 'job') {
      const j = JOBS[it.id], on = d.job === it.id;
      rarityBox(ctx, x + 4, y + 4, 12, 12, j.rarity);
      text(ctx, j.name + (on ? '  (지금)' : ''), x + 22, y + 5, { size: 11, color: on ? C.green : rarityGlow(j.rarity) });
      text(ctx, `${HAND_KO[j.hand]} · ${SKILLS[j.skill].name}`, x + w - 8, y + 5, { size: 10, align: 'right', color: C.mist });
      return;
    }
    if (it.type === 'nomount') { text(ctx, '타지 않음' + (d.mount ? '' : '  (지금)'), x + 6, y + 5, { size: 10, color: d.mount ? C.mist : C.green }); return; }
    if (it.type === 'mount') {
      const mt = MOUNTS[it.id], on = d.mount === it.id;
      rarityBox(ctx, x + 4, y + 4, 12, 12, mt.rarity);
      text(ctx, mt.name + (on ? '  (지금)' : ''), x + 22, y + 5, { size: 11, color: on ? C.green : rarityGlow(mt.rarity) });
      text(ctx, mt.desc, x + w - 8, y + 5, { size: 10, align: 'right', color: C.mist });
    }
  }

  draw(ctx) {
    const d = this.data, m = this.member;
    // 빈자리를 고른 동안에는 이로 정보로 대신 채운다 (제목만 다르게)
    const b = unitBuild(d, m.empty ? 'iro' : m.id);
    ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
    panel(ctx, 4, 18, 154, 152);
    this.members.draw(ctx);
    // 능력치
    panel(ctx, 4, 172, 154, 72);
    const s = b.stats;
    const rows = [[`HP ${s.hp}`, `MP ${s.mp}`], [`공격 ${s.atk}`, `방어 ${s.def}`], [`속도 ${s.spd}`, `치명 ${Math.round(s.crit * 100)}%`], [`회피 ${Math.round(s.eva * 100)}%`, `행운 ${s.luck}`]];
    if (m.empty) text(ctx, '빈자리', 81, 200, { size: 11, align: 'center', color: C.slate });
    else rows.forEach(([a, c], i) => { text(ctx, a, 12, 178 + i * 15, { size: 10 }); text(ctx, c, 84, 178 + i * 15, { size: 10 }); });
    this.rowBtn.draw(ctx); this.backBtn.draw(ctx);
    // 오른쪽
    this.tabBtns.forEach((bt, i) => { bt.focus = TABS[i][0] === this.tab; bt.disabled = (TABS[i][0] === 'job' && m.id !== 'iro') || (TABS[i][0] === 'member' && m.id === 'iro') || (m.empty && ['equip', 'job'].includes(TABS[i][0])); bt.draw(ctx); });
    panel(ctx, 160, 42, 316, 226);
    const title = { equip: this.slot ? `${b.name}의 ${SLOT_KO[this.slot]} 고르기` : `${b.name}의 장비`, member: m.empty ? '빈자리에 넣을 동료' : `${b.name} 대신 넣을 동료`, job: '이로의 직업 (전직은 자유)', mount: '탈것 (파티 공용)' }[this.tab];
    text(ctx, title, 170, 49, { size: 11, color: C.gold });
    this.list.draw(ctx);
    // 장비 부위 목록일 때: 옵션 요약
    if (this.tab === 'equip' && !this.slot) {
      const opts = Object.entries(b.opts).filter(([k]) => !['atk_pct', 'hp_pct', 'def_pct', 'crit', 'eva', 'spd', 'luck'].includes(k));
      text(ctx, '장비 효과', 170, 140, { size: 10, color: C.mist });
      if (!opts.length) text(ctx, '없음', 170, 154, { size: 10, color: C.slate });
      opts.slice(0, 6).forEach(([id, v], i) => text(ctx, optionText({ id, v }), 170 + (i % 2) * 152, 154 + Math.floor(i / 2) * 14, { size: 10, color: C.cyan }));
      text(ctx, `스킬: ${b.skills.map(k => SKILLS[k].name).join(' · ')}`, 170, 206, { size: 10, color: C.pale });
      if (b.job) text(ctx, `직업 ${b.job.name}: ${b.job.desc}`, 170, 222, { size: 10, color: C.pink });
      if (b.breakthrough) text(ctx, `돌파 ${b.breakthrough}단계 (능력치 +${b.breakthrough * 4 + (b.breakthrough >= 5 ? 5 : 0)}%)`, 170, 238, { size: 10, color: C.cyan });
    }
    drawResources(ctx, d, ['stones', 'gold']);
    text(ctx, '파티 편성 — 왼쪽: 동료 고르기 · 오른쪽: 바꾸기 (←→ 이동)', 6, 3, { size: 10, color: C.gold });
  }
}
