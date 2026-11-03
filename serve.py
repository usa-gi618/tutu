# 개발용 서버
# - 캐시를 막아서 수정 사항이 폰/시뮬레이터에 바로 반영되게 한다.
# - 라이브 리로드: 파일이 저장되면 열려 있는 페이지가 자동으로 새로고침된다 (/__livereload).
# 실행: python3 serve.py  →  http://localhost:8000
import os
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
WATCH_EXT = {".html", ".css", ".js", ".json", ".svg", ".png", ".mp3"}


def snapshot():
    mtimes = {}
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for f in files:
            if os.path.splitext(f)[1] in WATCH_EXT:
                path = os.path.join(base, f)
                try:
                    mtimes[path] = os.stat(path).st_mtime
                except FileNotFoundError:
                    pass
    return mtimes


class DevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def do_GET(self):
        if self.path == "/__livereload":
            return self.livereload()
        return super().do_GET()

    def livereload(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        last = snapshot()
        try:
            while True:
                time.sleep(0.4)
                now = snapshot()
                if now != last:
                    self.wfile.write(b"data: reload\n\n")
                    self.wfile.flush()
                    return
                # 연결 유지용
                self.wfile.write(b": ping\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, *args):
        pass


ThreadingHTTPServer.daemon_threads = True
ThreadingHTTPServer(("0.0.0.0", 8000), DevHandler).serve_forever()
