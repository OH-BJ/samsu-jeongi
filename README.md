# 삼수전기 (가제)

도트 · 노드형 지도 · 턴제 RPG · 가위바위보 판정 · 확률(뽑기) 중심 게임.

## 문서
기획은 `docs/` 폴더에 있다. 처음이라면 `docs/01-기획서.md`부터 읽는다.

## 실행 방법 (개발 중)
ES 모듈을 쓰기 때문에 파일을 더블클릭하면 실행되지 않는다. 로컬 서버로 연다.

```
cd C:\Users\User\Desktop\turn
python tools/serve.py
```
→ 브라우저에서 `http://localhost:8000` 접속 (게임), `http://localhost:8000/tools/gallery.html` (도트 검수 갤러리)

타이틀: 「새로 시작」 = 이야기(프롤로그 → 1장), 「검수용 거점 (M4)」 = 재화를 넉넉히 받고 뽑기·강화만 시험.

시뮬레이터: `node tools/sim/battle-sim.mjs` (전투), `gacha-sim.mjs` (뽑기·강화), `chapter-sim.mjs` (1장 전체).

조작: 마우스·터치로 누르기 / 키보드 방향키 이동, Enter·Space·Z 확인, Esc·X 취소, 전투에서 1·2·3 = 바위·가위·보. 휴대폰은 길게 누르면 설명이 뜬다.

휴대폰: PC와 같은 와이파이에서 `http://<PC의 IP 주소>:8000` 으로 접속한다 (배포 후에는 웹 주소로 바로 접속).

## 폴더
| 폴더 | 내용 |
|---|---|
| `docs/` | 기획 문서 |
| `src/` | 게임 코드 (core 엔진 / ui / scenes 화면 / systems 규칙) |
| `data/` | 수치·대사 데이터 |
| `art/` | 도트 원본 (글자 격자 데이터) |
| `assets/` | 내보낸 PNG, 오디오 |
| `tools/` | 도트 검수 갤러리, 시뮬레이터, 내보내기 도구 |
| `archive/` | 이전 프로토타입 (`proto-1-battle.html`, `proto-2-rps-cards.html`, 파일만 열어도 실행됨) |
