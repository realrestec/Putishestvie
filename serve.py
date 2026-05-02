import http.server
import socketserver
import webbrowser
import threading
import os

PORT = 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # тихий режим

def open_browser():
    webbrowser.open(f'http://localhost:{PORT}/index.html')

print(f'Запуск игры на http://localhost:{PORT}')
threading.Timer(0.5, open_browser).start()

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    httpd.serve_forever()
