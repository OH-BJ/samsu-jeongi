// 진행 흐름: 저장 상태를 보고 다음에 보여 줄 것을 정한다 (프롤로그 → 1장 도착 → 1장 마을)
import { save } from '../core/save.js';
import * as PROLOGUE from '../../data/chapters/prologue.js';
import * as CH1 from '../../data/chapters/ch01.js';
import { runScript } from './story.js';
import { TownScene } from './town.js';

export async function continueStory(G) {
  const d = G.data;
  if (!d.progress.flags.prologue_done) {
    await runScript(G, PROLOGUE.SCRIPT, { encounters: PROLOGUE.ENCOUNTERS, bg: 'village' });
    d.progress.chapter = 1;
    save('auto', d);
  }
  if (!d.progress.flags.ch1_arrived) {
    d.progress.chapter = 1;
    await runScript(G, CH1.SCRIPTS.arrive, { bg: CH1.CHAPTER.bg });
    d.progress.flags.ch1_arrived = true;
    save('auto', d);
  }
  G.scenes.push(new TownScene(G, CH1));
}
