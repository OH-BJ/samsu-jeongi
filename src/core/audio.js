// 효과음: WebAudio로 칩튠 소리를 바로 만든다 (파일 없음). 첫 탭에서 잠금 해제.
let ac = null, master = null;
export const audio = { volume: 0.6 };

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.connect(ac.destination);
  } catch (e) { ac = null; }
}

function tone(freq, ms, { type = 'square', vol = 0.15, slide = 0, delay = 0 } = {}) {
  if (!ac || audio.volume <= 0) return;
  const t = ac.currentTime + delay / 1000;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + ms / 1000);
  g.gain.setValueAtTime(vol * audio.volume, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + ms / 1000 + 0.02);
}

function noise(ms, vol = 0.2) {
  if (!ac || audio.volume <= 0) return;
  const len = Math.floor(ac.sampleRate * ms / 1000);
  const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(), g = ac.createGain();
  src.buffer = buf; g.gain.value = vol * audio.volume;
  src.connect(g); g.connect(master); src.start();
}

const SFX = {
  move: () => tone(660, 40, { vol: 0.06 }),
  confirm: () => { tone(880, 60, { vol: 0.1 }); tone(1320, 80, { vol: 0.08, delay: 50 }); },
  cancel: () => tone(440, 90, { vol: 0.1, slide: -200 }),
  hit: () => { noise(120, 0.25); tone(160, 120, { type: 'triangle', vol: 0.2, slide: -80 }); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 120, { vol: 0.1, delay: i * 70 })),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 160, { type: 'triangle', vol: 0.12, delay: i * 110 })),
  draw: () => tone(523, 120, { type: 'triangle', vol: 0.1 }),
  type: () => tone(1200 + Math.random() * 200, 18, { vol: 0.03 }),
};

export const sfx = name => SFX[name]?.();
