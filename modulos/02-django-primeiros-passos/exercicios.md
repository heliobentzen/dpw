# M02 — Exercícios

## E02.1 — Mapear o ciclo no seu código (individual)

Desenhe (à mão ou em ferramenta digital) o ciclo de uma requisição a
`/saudacao/joao/` no **seu** BiblioCom, indicando, para cada etapa, o **arquivo e a
linha** do seu repositório:

1. Onde a URL é reconhecida
2. Onde o parâmetro `nome` é extraído
3. Onde a função é chamada
4. Onde o contexto é montado
5. Onde o HTML é gerado
6. Onde a resposta é devolvida

**Entrega:** imagem + a lista `arquivo:linha`.

---

## E02.2 — Três rotas novas (individual)

Implemente no app `acervo`:

| Rota | Comportamento |
|---|---|
| `/sobre/` | Página estática com a descrição do sistema e os integrantes da equipe |
| `/contato/` | Exibe telefone/e-mail fictícios da biblioteca |
| `/calcular/<int:a>/<int:b>/` | Mostra soma, subtração, produto e divisão de `a` e `b` |

Requisitos:
- Todas usando `render()` e template próprio.
- Todas com `name=` e acessadas entre si com `{% url %}` (nunca URL escrita à mão).
- Em `/calcular/`, tratar divisão por zero **sem** deixar o erro 500 aparecer.

---

## E02.3 — Converters de URL (individual)

Crie uma rota para cada converter e descubra na prática o que cada um aceita:

```python
path("teste/int/<int:valor>/", ...)
path("teste/str/<str:valor>/", ...)
path("teste/slug/<slug:valor>/", ...)
path("teste/uuid/<uuid:valor>/", ...)
path("teste/path/<path:valor>/", ...)
```

Preencha a tabela testando cada URL:

| URL testada | int | str | slug | uuid | path |
|---|:---:|:---:|:---:|:---:|:---:|
| `/teste/X/42/` | | | | | |
| `/teste/X/abc/` | | | | | |
| `/teste/X/meu-titulo-legal/` | | | | | |
| `/teste/X/a/b/c/` | | | | | |
| `/teste/X/550e8400-e29b-41d4-a716-446655440000/` | | | | | |

Marque ✅ (casou) ou ❌ (404). Responda: **qual a diferença prática entre `str` e `path`?**
E por que isso é relevante para segurança?

---

## E02.4 — Query string na view (individual)

Crie `/eco/` que exiba, em uma tabela HTML:

- todos os pares chave/valor da query string (`request.GET`);
- o método;
- o `User-Agent`;
- o `Content-Type` da requisição.

Teste com `/eco/?nome=ana&curso=ads&curso=si`. Responda: **por que `curso` aparece duas
vezes e como você obteria os dois valores?** (dica: `request.GET.getlist`)

---

## E02.5 — Segundo app (individual) ⭐

Crie o app `emprestimos` com:

- `startapp emprestimos` + registro no `INSTALLED_APPS`
- `emprestimos/urls.py` com `app_name = "emprestimos"`
- inclusão em `config/urls.py` sob o prefixo `/emprestimos/`
- uma rota `/emprestimos/` que lista empréstimos fictícios (lista Python, ainda sem banco)
- link recíproco entre a home do `acervo` e a lista de `emprestimos`, usando `{% url %}`

Responda em 3 linhas: **quando vale a pena criar um novo app em vez de crescer o existente?**

---

## E02.6 — Quebre de propósito (individual)

Provoque cada erro, capture a mensagem e explique a causa em uma linha:

| # | Como provocar | Erro esperado |
|---|---|---|
| 1 | Remover `acervo` do `INSTALLED_APPS` e acessar a home | |
| 2 | Renomear `home.html` e acessar a home | |
| 3 | Esquecer o `return` na view | |
| 4 | Usar `{% url 'home' %}` sem namespace | |
| 5 | Apagar `SECRET_KEY` do `.env` | |
| 6 | Colocar `DEBUG=False` sem `ALLOWED_HOSTS` | |

Ler mensagens de erro com calma é a habilidade técnica de maior retorno da disciplina.

---

## Critérios de verificação

| Exercício | Evidência |
|---|---|
| E02.1 | Diagrama + lista `arquivo:linha` |
| E02.2 | 3 rotas funcionando + prints |
| E02.3 | Tabela preenchida + resposta escrita |
| E02.4 | Print de `/eco/?nome=ana&curso=ads&curso=si` |
| E02.5 | Commit criando o app + navegação entre apps |
| E02.6 | 6 mensagens de erro + explicações |
