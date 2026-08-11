# Recursos de apoio

| Pasta | Conteúdo |
|---|---|
| [`codigo/`](codigo/) | Código de apoio usado nos roteiros práticos |
| [`checklists/`](checklists/) | Listas de verificação imprimíveis |

## Código

| Arquivo | Módulo | Para quê |
|---|---|---|
| [`servidor_minimo.py`](codigo/servidor_minimo.py) | M01 | Servidor HTTP sem framework: mostra o que o Django faz por você |
| [`vulneravel.py`](codigo/vulneravel.py) | M11 | Laboratório com 10 vulnerabilidades para identificar e corrigir |
| [`verifica_ambiente.py`](codigo/verifica_ambiente.py) | M00 | Valida o ambiente antes da primeira aula |
| [`popular.py`](codigo/popular.py) | M05 | Comando de gestão que gera dados de volume |
| [`settings_producao.py`](codigo/settings_producao.py) | M11, M14 | Referência de configuração segura para produção |

> ⚠️ `vulneravel.py` é **deliberadamente inseguro** e serve apenas para estudo. Nunca use
> nada dele em produção.

## Checklists

| Arquivo | Quando usar |
|---|---|
| [`seguranca.md`](checklists/seguranca.md) | Antes de colocar no ar e a cada revisão de segurança |
| [`deploy.md`](checklists/deploy.md) | Antes e depois de cada implantação |
| [`revisao-de-codigo.md`](checklists/revisao-de-codigo.md) | Ao revisar um Pull Request |
| [`entrega-de-etapa.md`](checklists/entrega-de-etapa.md) | Antes de cada entrega do projeto |

## Ferramentas recomendadas

| Categoria | Ferramenta | Para quê |
|---|---|---|
| Editor | VS Code / PyCharm | Desenvolvimento |
| Lint e formatação | Ruff | Padrão de código |
| Testes | pytest, pytest-django, model-bakery, freezegun | Testes automatizados |
| Depuração | Django Debug Toolbar | Consultas, tempo, contexto |
| Segurança | pip-audit, detect-secrets, axe DevTools | Dependências, segredos, acessibilidade |
| Diagramas | Mermaid, dbdiagram.io, Excalidraw | ER, arquitetura, protótipo |
| Gestão | GitHub Projects, GitHub Issues | Backlog e sprints |
| Monitoramento | UptimeRobot, Sentry/GlitchTip | Disponibilidade e erros |
| API | httpie, curl, Bruno/Insomnia | Testar requisições |

## Links de referência rápida

**Documentação**
- [Django (pt-br)](https://docs.djangoproject.com/pt-br/5.0/)
- [Classy Class-Based Views](https://ccbv.co.uk/)
- [Django Packages](https://djangopackages.org/) — comparar bibliotecas
- [MDN Web Docs (pt-br)](https://developer.mozilla.org/pt-BR/)

**Segurança**
- [OWASP Top 10 (pt-br)](https://owasp.org/Top10/pt_BR/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [securityheaders.com](https://securityheaders.com)

**Prática**
- [httpbin.org](https://httpbin.org) — eco de requisições HTTP
- [regex101.com](https://regex101.com) — testar expressões regulares
- [Learn Git Branching](https://learngitbranching.js.org/?locale=pt_BR)
