// 1장 「굳어가는 반석」 (반석국)
import { encounter } from '../encounters.js';

export const CHAPTER = { id: 1, name: '1장 · 굳어가는 반석', town: '반석국 성하 마을', bg: 'rock' };

// 지도: 구역 3개. types = 노드 종류 가중치, normal/elite = 그 구역에서 나오는 적 무리, scale = 적 HP·공격력 배율
// (배율은 tools/sim/chapter-sim.mjs 로 맞춘다)
export const ZONES = [
  {
    name: '산길 입구', cols: 6, scale: 1.1,
    types: [['battle', 5], ['event', 3], ['treasure', 2], ['rest', 1], ['shop', 1]],
    normal: [['rubble_golem', 'rubble_golem'], ['stone_golem'], ['rubble_golem', 'stone_golem']],
    elite: [['warden']],
    intro: 'zone1_intro',
  },
  {
    name: '굳은 마을길', cols: 7, scale: 0.9,
    types: [['battle', 5], ['elite', 1], ['event', 3], ['treasure', 2], ['rest', 1], ['shop', 1]],
    normal: [['stone_golem', 'moss_golem'], ['rubble_golem', 'stone_golem', 'rubble_golem'], ['moss_golem', 'moss_golem']],
    elite: [['warden']],
    intro: 'zone2_intro',
  },
  {
    name: '왕성 앞', cols: 6, boss: true, scale: 0.7,
    types: [['battle', 5], ['elite', 2], ['event', 2], ['treasure', 1], ['rest', 2]],
    normal: [['stone_golem', 'moss_golem', 'stone_golem'], ['stone_golem', 'stone_golem'], ['moss_golem', 'rubble_golem', 'moss_golem']],
    elite: [['warden', 'rubble_golem']],
    boss: ['rubble_golem', 'urs_king', 'rubble_golem'],
    intro: 'zone3_intro',
  },
];

export const BOSS = encounter('반석왕 우르', ZONES[2].boss, { canFlee: false, desc: '1장 보스', scale: 0.69 });

// 사건 노드 (구역 상관없이 무작위로 하나). 대본은 SCRIPTS에 있다
export const EVENTS = ['ev_smith', 'ev_child', 'ev_merchant', 'ev_spring', 'ev_small_well', 'ev_dice'];

export const SCRIPTS = {
  // ── 마을 도착
  arrive: [
    { bg: 'rock' },
    ['narr', '반석국. 회색 산맥 아래, 대장간의 불빛이 꺼지지 않는 나라.'],
    ['narr', '그런데 이상하다. 대장장이는 같은 칼을, 같은 박자로, 끝없이 두드리고 있다.'],
    ['iro', '저기요…? 아저씨?'],
    ['narr', '대답이 없다. 골목의 아이는 같은 노래의 같은 소절만 되풀이한다.'],
    ['iro', '여기도… 우리 마을이랑 똑같아.'],
    ['raun', '이로! 여기 우물은 아직 살아 있어! 동료를 불러 보자. 첫 열 번은 내가 쏠게!'],
    ['narr', '【동료 뽑기】 동료 우물 10회를 무료로 뽑는다. 10번째 칸은 희귀 이상 확정.'],
    { gacha: 'companion', count: 10, free: true },
    { autoParty: true },
    ['raun', '좋아! 동료는 마을의 「파티 편성」에서 바꿀 수 있어. 준비되면 「지도로 출발」!'],
  ],
  zone1_intro: [
    ['narr', '왕성으로 이어지는 산길. 굳어 버린 돌골렘들이 정해진 길을 끝없이 순찰한다.'],
    ['narr', '【노드 지도】 다음 노드를 골라 나아간다. 지나온 길은 되돌아갈 수 없다. HP는 전투가 끝나도 그대로 남으니 휴식 노드를 잘 고르자.'],
  ],
  zone2_intro: [
    ['museoe_l', '거기 멈춰라. 굳지 않은 자가 이곳에 무슨 일이지?'],
    ['iro', '가위바위보 한 판 하면 알려 줄게!'],
    ['museoe_l', '…장난할 기분 아니다.'],
    ['iro', '…굳은 사람들을 되돌릴 방법을 찾고 있어. 우리 할머니가 굳어 버렸거든.'],
    ['museoe_l', '나도 지키지 못했다. 폐하도, 이 나라도.'],
    ['museoe_l', '따라오겠다면 막지 않겠다. 다만 짐이 되면 두고 간다.'],
    { join: 'museoe' },
    ['narr', '반석국 근위대장 무쇠가 동행한다. (편성은 마을에서 바꿀 수 있다)'],
  ],
  zone3_intro: [
    ['narr', '왕성 앞 광장. 굳은 병사들이 같은 자세로 창을 들고 서 있다.'],
    ['museoe', '폐하는 저 안에 계신다. …아직, 계신다.'],
  ],
  boss_before: [
    { bg: 'rock' },
    ['urs', '…누구냐. 오늘은 늘 같은 오늘이어야 한다.'],
    ['museoe', '폐하! 저입니다, 무쇠입니다!'],
    ['urs', '무쇠…? 모른다. 정해지지 않은 것은… 모른다.'],
    ['iro', '이 사람은 당신을 지키려고 여기까지 왔어! 정신 차려!'],
    ['urs', '굳어 버린 손은 바뀌지 않는다. 나는 언제나 바위를 낸다.'],
  ],
  boss_after: [
    ['narr', '반석왕의 몸에서 검은 손자국이 흩어진다. 대장장이의 망치 소리가, 처음으로 박자를 놓쳤다.'],
    ['urs', '…무쇠…냐. 내가… 무슨 짓을…'],
    ['museoe', '폐하. 쉬십시오. 이제는 제가 길을 고르겠습니다.'],
    ['narr', '왕은 다시 깊은 잠에 빠졌다. 완전히 깨어나려면 흑수 자체를 부숴야 한다.'],
    ['museoe', '이로. 정해진 길이 사라졌다. …이젠 네 손에 걸겠다.'],
    ['iro', '좋아! 그럼 첫 번째 약속. 나중에 가위바위보 한 판 하는 거다!'],
    ['museoe', '……. 생각해 보지.'],
    ['narr', '무쇠가 정식으로 동료가 되었다.'],
    { give: { stones: 10, jobTicket: 1 } },
    { flag: 'ch1_done' },
    ['narr', '— 체험판은 여기까지입니다. 2장 「칼끝의 도박」에서 계속됩니다. —'],
  ],

  // ── 사건 노드
  ev_smith: [
    ['narr', '대장장이가 같은 칼을 두드리고 있다. 쾅, 쾅, 쾅. 언제나 같은 박자.'],
    { choice: [['「다른 칼도 만들어 보세요!」 말을 건다', 'talk'], ['조용히 지나간다', 'end']] },
    { label: 'talk' },
    { random: [[50, 'wake'], [50, 'no']] },
    { label: 'wake' },
    ['smith', '…어? 내가 뭘 하고 있었지? 꿈을 꾼 것 같은데… 고맙네, 이거라도 가져가게.'],
    { give: { enhance: 3 } },
    { goto: 'end' },
    { label: 'no' },
    ['narr', '쾅, 쾅, 쾅. 대답이 없다.'],
    { label: 'end' },
  ],
  ev_child: [
    ['narr', '골목의 아이가 같은 노래의 같은 소절만 부르고 있다.'],
    { choice: [['다른 노래를 같이 불러 준다', 'sing'], ['지나간다', 'end']] },
    { label: 'sing' },
    { random: [[50, 'wake'], [50, 'no']] },
    { label: 'wake' },
    ['child', '…그 노래 처음 들어! 형, 이거 주울래? 반짝반짝해!'],
    { give: { stones: 2 } },
    { goto: 'end' },
    { label: 'no' },
    ['narr', '아이는 고개를 갸웃하더니, 다시 같은 소절을 부르기 시작했다.'],
    { label: 'end' },
  ],
  ev_merchant: [
    ['narr', '굳어 버린 상인 앞에 뚜껑이 반쯤 열린 상자가 있다. 「한 번 100금화」라는 팻말.'],
    { choice: [['금화 100을 넣고 상자를 연다', 'pay'], ['그냥 간다', 'end']] },
    { label: 'pay' },
    { pay: { gold: 100 }, fail: 'poor' },
    { item: 'normal' },
    ['narr', '「{item}」을(를) 얻었다!'],
    { goto: 'end' },
    { label: 'poor' },
    ['narr', '금화가 모자란다.'],
    { label: 'end' },
  ],
  ev_spring: [
    ['narr', '바위 틈에서 맑은 물이 솟는다. 「운명의 샘」이라 새겨져 있다.'],
    { choice: [['물을 마신다', 'drink'], ['마시지 않는다', 'end']] },
    { label: 'drink' },
    { random: [[60, 'good'], [40, 'bad']] },
    { label: 'good' },
    ['narr', '몸이 가벼워졌다! 파티 전원의 HP가 회복되었다.'],
    { heal: 0.5 },
    { goto: 'end' },
    { label: 'bad' },
    ['narr', '…쓰다! 배가 아프다. 파티 전원이 HP를 조금 잃었다.'],
    { hurt: 0.15 },
    { label: 'end' },
  ],
  ev_small_well: [
    ['raun', '여기 작은 우물이 있네! 한 번 공짜로 뽑아 줄게!'],
    { gacha: 'equip', count: 1, free: true },
    ['raun', '「{item}」! 나쁘지 않지?'],
  ],
  ev_dice: [
    ['narr', '길가에 사람 키만 한 돌 주사위가 있다. 「굴려라」라고 새겨져 있다.'],
    { choice: [['굴린다', 'roll'], ['지나간다', 'end']] },
    { label: 'roll' },
    { random: [[2, 'none'], [3, 'gold'], [1, 'six']] },
    { label: 'none' },
    ['narr', '데굴데굴… 1이 나왔다. 아무 일도 일어나지 않았다.'],
    { goto: 'end' },
    { label: 'gold' },
    ['narr', '데굴데굴… 4가 나왔다! 주사위 밑에서 금화 120을 찾았다.'],
    { give: { gold: 120 } },
    { goto: 'end' },
    { label: 'six' },
    ['narr', '데굴데굴… 6! 주사위가 빛나며 운명석 3개를 토해 냈다!'],
    { give: { stones: 3 } },
    { label: 'end' },
  ],
};
