"""
=========================================================================
  ⚠️  CÓDIGO DELIBERADAMENTE VULNERÁVEL — MATERIAL DIDÁTICO (M11)  ⚠️
=========================================================================

NÃO USE NADA DESTE ARQUIVO EM PRODUÇÃO.

Cada view abaixo contém pelo menos uma vulnerabilidade das classes do
OWASP Top 10:2021. O exercício do M11 é, em duplas:

  1. identificar a vulnerabilidade (e nomeá-la);
  2. demonstrar a exploração com um payload/URL concreto, no seu próprio
     ambiente local;
  3. corrigir;
  4. explicar por que a correção funciona.

O gabarito está no fim do arquivo, comentado. Não leia antes de tentar.

Regra da disciplina: exploração apenas contra o SEU ambiente local ou
contra sistemas para os quais você tem autorização explícita por escrito.
"""

import os
import subprocess

from django import forms
from django.contrib.auth import get_user_model
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.csrf import csrf_exempt

from acervo.models import Emprestimo, Obra

Usuario = get_user_model()


# --------------------------------------------------------------------- 1
def busca(request):
    termo = request.GET.get("q", "")
    obras = Obra.objects.raw(
        f"SELECT * FROM acervo_obra WHERE titulo LIKE '%{termo}%'"
    )
    return render(request, "busca.html", {"obras": obras})


# --------------------------------------------------------------------- 2
def emprestimo_detail(request, pk):
    emprestimo = get_object_or_404(Emprestimo, pk=pk)
    return render(request, "emprestimo_detail.html", {"emprestimo": emprestimo})


# --------------------------------------------------------------------- 3
@csrf_exempt
def excluir_obra(request, pk):
    Obra.objects.filter(pk=pk).delete()
    return redirect("acervo:obra_list")


# --------------------------------------------------------------------- 4
#   template obra_detail.html:
#       <div class="sinopse">{{ obra.sinopse|safe }}</div>
#       <a href="{{ obra.link_externo }}">Saiba mais</a>


# --------------------------------------------------------------------- 5
def download(request):
    nome = request.GET["arquivo"]
    return FileResponse(open(os.path.join("/var/media/", nome), "rb"))


# --------------------------------------------------------------------- 6
def login_view(request):
    if request.method != "POST":
        return render(request, "login.html")
    u = Usuario.objects.filter(username=request.POST["usuario"]).first()
    if not u:
        return render(request, "login.html", {"erro": "Usuário não encontrado"})
    if u.password != request.POST["senha"]:
        return render(request, "login.html", {"erro": "Senha incorreta"})
    request.session["user_id"] = u.id
    return redirect("acervo:home")


# --------------------------------------------------------------------- 7
class ObraForm(forms.ModelForm):
    class Meta:
        model = Obra
        fields = "__all__"


# --------------------------------------------------------------------- 8
def relatorio(request):
    if request.GET.get("admin") == "1":
        return render(request, "relatorio_completo.html", {"dados": "..."})
    return render(request, "relatorio_basico.html")


# --------------------------------------------------------------------- 9
def gerar_miniatura(request):
    arquivo = request.GET["arquivo"]
    os.system(f"convert {arquivo} -resize 200x200 /tmp/thumb.png")
    return FileResponse(open("/tmp/thumb.png", "rb"))


# -------------------------------------------------------------------- 10
def exportar_csv(request):
    linhas = ["id,titulo,associado,email,cpf,telefone"]
    for e in Emprestimo.objects.select_related("associado"):
        a = e.associado
        linhas.append(f"{e.pk},{e.exemplar.obra.titulo},{a.nome},{a.email},{a.cpf},{a.telefone}")
    return HttpResponse("\n".join(linhas), content_type="text/csv")


# =====================================================================
# GABARITO — não leia antes de tentar.
# =====================================================================
#
#  1. A03 Injeção de SQL. Payload: ?q=' OR '1'='1' --
#     Correção: Obra.objects.filter(titulo__icontains=termo)
#     Ou, se raw for indispensável:
#         Obra.objects.raw("SELECT * FROM acervo_obra WHERE titulo LIKE %s",
#                          [f"%{termo}%"])
#
#  2. A01 IDOR + falta de autenticação. Qualquer pessoa acessa
#     /emprestimos/<qualquer-id>/. Correção: exigir login e filtrar o
#     queryset pelo usuário; devolver 404 (não 403) para o que não é seu.
#
#  3. CSRF (A01) + método errado + sem autorização. Exclusão por GET,
#     sem token e sem checagem de permissão. Correção: @require_POST,
#     remover @csrf_exempt, @permission_required, e tela de confirmação.
#
#  4. A03 XSS armazenado. |safe em texto do usuário executa
#     <script>. E href com valor do usuário permite javascript:.
#     Correção: remover |safe (ou sanitizar na escrita com nh3/bleach) e
#     validar o esquema da URL no servidor (apenas http/https).
#
#  5. A01 Path traversal. Payload: ?arquivo=../../etc/passwd
#     Correção: django.utils._os.safe_join, validar o nome contra uma
#     lista/padrão, e servir apenas arquivos referenciados por um model
#     ao qual o usuário tem acesso.
#
#  6. A07 Várias: (a) enumeração de usuários por mensagens distintas;
#     (b) senha comparada em texto puro; (c) comparação não é em tempo
#     constante; (d) sessão manipulada na mão, sem rotação de chave.
#     Correção: authenticate() + login() do Django, mensagem única.
#
#  7. A01 Mass assignment. fields="__all__" expõe qualquer campo que
#     venha a ser adicionado ao model. Correção: lista explícita.
#
#  8. A01 Autorização por parâmetro do cliente. ?admin=1 dá acesso.
#     Correção: decidir pelo request.user e por permissão.
#
#  9. A03 Injeção de comando. Payload: ?arquivo=x.jpg; rm -rf /
#     Correção: subprocess.run([...], check=True) sem shell, com o nome
#     validado; melhor ainda, usar Pillow em vez de shell.
#
# 10. A01/A02 + LGPD. Endpoint sem autenticação expondo dados pessoais
#     (e-mail, CPF, telefone) de todos os associados; CSV sem escape
#     (injeção de fórmula em planilha: campo iniciado por "=" ou "+").
#     Correção: exigir permissão, minimizar colunas, escapar o CSV com o
#     módulo csv, e questionar se o CPF precisa existir no sistema.
