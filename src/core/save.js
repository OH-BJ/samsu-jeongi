// 저장: 슬롯 3개 + 자동 저장 1개, 버전 이전, 저장 코드(다른 기기로 옮기기)
export const SAVE_VERSION = 3;
const KEY = 'samsu-save-';
export const SLOTS = ['auto', '1', '2', '3'];

// 구조가 바뀌면 여기에 이전 함수를 추가한다: MIGRATE[이전버전] = data => 다음버전 data
const MIGRATE = {
  // 1 → 2: M4에서 파티·재화·장비 구조가 생겼다. 개발 중 저장이라 새 구조로 채운다.
  1: d => ({ ...newGameData(d.seed, { test: true }), playMs: d.playMs || 0, version: 1 }),
  // 2 → 3: M5에서 이야기·지도·HP가 생겼다. M4 저장은 검수용 저장으로 이어 간다.
  2: d => ({ ...d, hp: {}, items: { potion: 3 }, test: true, progress: { ...d.progress, flags: { ...d.progress.flags, prologue_done: true }, map: null } }),
};

function migrate(data) {
  while (data.version < SAVE_VERSION) {
    const f = MIGRATE[data.version];
    if (!f) throw new Error('이전할 수 없는 저장 버전: ' + data.version);
    data = f(data); data.version++;
  }
  return data;
}

const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del: k => { try { localStorage.removeItem(k); } catch (e) {} },
};

// 새 게임. test: true면 M4 검수용 (재화 넉넉히, 이야기 동료 3명 합류, 이야기 건너뜀)
export function newGameData(seed = (Math.random() * 2 ** 32) >>> 0, { test = false } = {}) {
  const d = {
    version: SAVE_VERSION,
    seed,
    rng: {},              // 스트림별 난수 상태
    playMs: 0,
    progress: { chapter: 0, flags: {}, firstKill: {}, map: null },
    // 파티: 이로 + 동료 최대 3명, 앞줄 2 · 뒷줄 2
    party: [{ id: 'iro', row: 'front' }],
    hp: {},               // 노드 지도에서 이어지는 현재 HP { 동료id: hp } (없으면 가득)
    items: { potion: 3 }, // 전투용 아이템
    gold: 300, stones: 0, jobTicket: 0, enhance: 5, rerollStone: 0, protect: 0, shards: 0,
    pity: {},             // 우물별 천장 카운트
    inventory: [],        // 장비
    equip: {},            // { 동료id: { weapon, armor, accessory } } (장비 uid)
    companions: {},       // 가진 동료와 돌파 단계 (이야기 동료는 돌파 없음)
    jobs: { apprentice: 0 }, job: 'apprentice',
    mounts: {}, mount: null,
    codex: {},
    savedAt: 0,
  };
  if (test) {
    Object.assign(d, { gold: 5000, stones: 300, jobTicket: 10, enhance: 30, rerollStone: 10, protect: 3, test: true });
    d.companions = { museoe: 0, serin: 0, haram: 0 };
    d.party = [{ id: 'museoe', row: 'front' }, { id: 'iro', row: 'front' }, { id: 'serin', row: 'back' }, { id: 'haram', row: 'back' }];
    d.progress.flags.prologue_done = true;
  }
  return d;
}

export function save(slot, data) {
  data.savedAt = Date.now();
  return store.set(KEY + slot, JSON.stringify(data));
}

export function load(slot) {
  const raw = store.get(KEY + slot);
  if (!raw) return null;
  try { return migrate(JSON.parse(raw)); } catch (e) { console.warn('저장 불러오기 실패', slot, e); return null; }
}

export const remove = slot => store.del(KEY + slot);

// 슬롯 목록 (빈 칸은 null)
export const listSlots = () => SLOTS.map(slot => ({ slot, data: load(slot) }));

// 저장 코드: JSON → UTF-8 → base64, 끝에 검사값을 붙여서 잘못 복사한 코드를 걸러낸다
function checksum(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

export function exportCode(data) {
  const json = JSON.stringify(data);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return 'SAMSU1.' + b64 + '.' + checksum(b64);
}

export function importCode(code) {
  const [tag, b64, sum] = code.trim().split('.');
  if (tag !== 'SAMSU1' || !b64 || checksum(b64) !== sum) throw new Error('저장 코드가 올바르지 않아요');
  const json = new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
  return migrate(JSON.parse(json));
}

// 설정은 저장 슬롯과 따로 둔다
export function loadSettings() {
  const d = { sfx: 0.6, bgm: 0.5, textSpeed: 2, battleSpeed: 1, autoDefense: false };
  try { return { ...d, ...JSON.parse(store.get('samsu-settings') || '{}') }; } catch (e) { return d; }
}
export const saveSettings = s => store.set('samsu-settings', JSON.stringify(s));
