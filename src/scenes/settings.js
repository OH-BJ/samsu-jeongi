// 설정: 효과음 크기, 글자 속도, 전체화면, 저장 코드 내보내기/가져오기
import { W, H } from '../core/screen.js';
import { panel, text, C } from '../core/render.js';
import { audio, sfx } from '../core/audio.js';
import { saveSettings, exportCode, importCode, save, load } from '../core/save.js';
import { Button } from '../ui/button.js';
import { Menu } from '../ui/menu.js';
import { toast } from '../ui/toast.js';

const SPEED_NAMES = ['즉시', '느리게', '보통', '빠르게'];

export class SettingsScene {
  constructor(G) {
    this.G = G; this.opaque = false;
    const S = G.settings, x = 116, w = 170;
    const setVol = d => { S.sfx = Math.round(Math.min(1, Math.max(0, S.sfx + d)) * 10) / 10; audio.volume = S.sfx; saveSettings(S); sfx('confirm'); };
    const b = [
      new Button({ x, y: 62, w, label: '효과음 −', onClick: () => setVol(-0.1) }),
      new Button({ x, y: 90, w, label: '효과음 +', onClick: () => setVol(0.1) }),
      new Button({ x, y: 118, w, label: '글자 속도', onClick: () => { S.textSpeed = (S.textSpeed + 1) % 4; saveSettings(S); } }),
      new Button({ x, y: 146, w, label: '전체화면', onClick: () => G.screen.toggleFullscreen() }),
      new Button({ x, y: 174, w, label: '저장 코드 내보내기', onClick: () => this.exportSave() }),
      new Button({ x, y: 202, w, label: '저장 코드 가져오기', onClick: () => this.importSave() }),
      new Button({ x, y: 234, w, label: '닫기', onClick: () => G.scenes.pop() }),
    ];
    this.menu = new Menu(b, { onCancel: () => G.scenes.pop() });
  }
  exportSave() {
    const data = this.G.data || load('auto');
    if (!data) { toast('아직 저장된 게임이 없어요', { color: C.red }); return; }
    const code = exportCode(data);
    this.G.overlay(`<b>저장 코드</b><br>이 글을 복사해서 다른 기기의 「저장 코드 가져오기」에 붙여 넣으세요.<textarea readonly>${code}</textarea><button data-act="copy">복사</button><button data-act="close">닫기</button>`,
      async (act, box) => { if (act === 'copy') { try { await navigator.clipboard.writeText(code); toast('복사했어요', { color: C.green }); } catch (e) { box.querySelector('textarea').select(); } } return act === 'close' || act === 'copy'; });
  }
  importSave() {
    this.G.overlay(`<b>저장 코드 가져오기</b><br>다른 기기에서 복사한 코드를 붙여 넣으세요. 지금 자동 저장을 덮어씁니다.<textarea placeholder="SAMSU1...."></textarea><button data-act="ok">가져오기</button><button data-act="close">취소</button>`,
      (act, box) => {
        if (act !== 'ok') return true;
        try { const d = importCode(box.querySelector('textarea').value); save('auto', d); this.G.data = d; toast('불러왔어요', { color: C.green }); return true; }
        catch (e) { toast(e.message, { color: C.red }); return false; }
      });
  }
  update(dt) { this.menu.update(this.G, dt); }
  draw(ctx) {
    ctx.fillStyle = 'rgba(24,20,37,0.6)'; ctx.fillRect(0, 0, W, H);
    panel(ctx, 100, 24, 280, 238);
    text(ctx, '설정', W / 2, 36, { color: C.gold, align: 'center' });
    this.menu.draw(ctx);
    const S = this.G.settings;
    text(ctx, `효과음 ${Math.round(S.sfx * 100)}%`, 298, 80, { color: C.pale, size: 10 });
    text(ctx, SPEED_NAMES[S.textSpeed], 298, 124, { color: C.pale, size: 10 });
    text(ctx, this.G.screen.isFullscreen() ? '켜짐' : '꺼짐', 298, 152, { color: C.pale, size: 10 });
  }
}
