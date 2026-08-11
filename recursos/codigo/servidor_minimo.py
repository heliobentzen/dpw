"""
Servidor HTTP mínimo — material de apoio do M01 (Fundamentos da web e HTTP).

Faz "na mão" o que um framework web faz por você: roteamento, leitura de query
string, leitura do corpo de um POST, montagem da resposta e redirecionamento.

Uso:
    python servidor_minimo.py
    # acesse http://localhost:8000

Experimentos sugeridos estão em modulos/01-fundamentos-web-http/README.md.
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

RECADOS: list[str] = []


class Handler(BaseHTTPRequestHandler):
    server_version = "ServidorMinimoDPW/1.0"

    def _responder(self, status: int, corpo: str, content_type: str = "text/html; charset=utf-8"):
        dados = corpo.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)

    def _redirecionar(self, destino: str):
        """Post/Redirect/Get: responde 302 para que o F5 não reenvie o POST."""
        self.send_response(302)
        self.send_header("Location", destino)
        self.end_headers()

    # -- GET ---------------------------------------------------------------
    def do_GET(self):
        url = urlparse(self.path)          # roteamento na unha
        params = parse_qs(url.query)       # query string -> dict[str, list[str]]

        if url.path == "/":
            self._responder(200, self._pagina_inicial(params))
        else:
            self._responder(404, "<h1>404 — não encontrado</h1>")

    # -- POST --------------------------------------------------------------
    def do_POST(self):
        if self.path == "/recado":
            tamanho = int(self.headers.get("Content-Length", 0))
            corpo = self.rfile.read(tamanho).decode("utf-8")
            dados = parse_qs(corpo)
            texto = dados.get("texto", [""])[0].strip()
            if texto:
                RECADOS.append(texto)
            self._redirecionar("/")
        else:
            self._responder(405, "<h1>405 — método não permitido</h1>")

    # -- HTML --------------------------------------------------------------
    @staticmethod
    def _pagina_inicial(params) -> str:
        nome = params.get("nome", ["visitante"])[0]
        itens = "".join(f"<li>{r}</li>" for r in RECADOS) or "<li><i>nenhum recado</i></li>"
        return f"""<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="utf-8"><title>Mural — servidor mínimo</title></head>
<body style="font-family: system-ui; max-width: 40rem; margin: 2rem auto;">
  <h1>Mural — olá, {nome}</h1>
  <ul>{itens}</ul>

  <h2>Enviar recado (POST)</h2>
  <form method="post" action="/recado">
    <input name="texto" required style="width: 20rem">
    <button>Enviar</button>
  </form>

  <h2>Saudar (GET)</h2>
  <form method="get" action="/">
    <input name="nome" placeholder="seu nome">
    <button>Saudar</button>
  </form>

  <p><small>Observe a URL depois de cada envio. Dê F5 e compare os dois casos.</small></p>
</body>
</html>"""


if __name__ == "__main__":
    print("Servindo em http://localhost:8000 (Ctrl+C para parar)")
    try:
        HTTPServer(("", 8000), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrado.")
