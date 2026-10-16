# 개발용 서버: 캐시를 끈다 (파일을 고치면 새로고침만으로 바로 반영)
# 사용법: python tools/serve.py   → http://localhost:8000
# POST /upload?name=폴더/파일.png  → assets/pixellab/ 아래에 저장 (브라우저에서 만든 이미지 받아오기용, localhost 전용)
import http.server, functools, os, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(ROOT, 'assets', 'pixellab')

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        if u.path != '/upload':
            self.send_response(404); self.end_headers(); return
        name = urllib.parse.parse_qs(u.query).get('name', ['upload.png'])[0]
        dest = os.path.normpath(os.path.join(UPLOAD_DIR, name))
        if not dest.startswith(UPLOAD_DIR) or not dest.lower().endswith('.png'):
            self.send_response(400); self.end_headers(); return
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        with open(dest, 'wb') as f:
            f.write(data)
        self.send_response(200); self.end_headers()
        self.wfile.write(b'ok')

if __name__ == '__main__':
    handler = functools.partial(NoCache, directory=ROOT)
    http.server.ThreadingHTTPServer(('127.0.0.1', 8000), handler).serve_forever()
