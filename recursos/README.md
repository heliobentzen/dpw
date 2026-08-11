# Recursos de apoio

| Pasta | Conteúdo |
|---|---|
| [`codigo/`](codigo/) | Código de apoio usado nos roteiros práticos |
| [`checklists/`](checklists/) | Listas de verificação imprimíveis |

## Código

| Arquivo | Módulo | Para quê |
|---|---|---|
| [`servidor_minimo.py`](codigo/servidor_minimo.py) | M01 | Servidor HTTP sem framework: mostra o que o Django faz por você |
| [`vulneravel.py`](codigo/vulneravel.py) | M13 | 🔵 Laboratório com 10 vulnerabilidades de backend |
| [`vulneravel.tsx`](codigo/vulneravel.tsx) | M13 | 🟣 Laboratório com 8 vulnerabilidades de frontend |
| [`verifica_ambiente.py`](codigo/verifica_ambiente.py) | M00 | Valida as duas camadas antes da primeira aula |
| [`popular.py`](codigo/popular.py) | M06 | Comando de gestão que gera dados de volume |
| [`settings_producao.py`](codigo/settings_producao.py) | M13, M16 | Referência de configuração segura para produção |

> ⚠️ `vulneravel.py` e `vulneravel.tsx` são **deliberadamente inseguros** e servem apenas
> para estudo. Nunca use nada deles em produção.

## Nivelamento

| Arquivo | Quando usar |
|---|---|
| [`js-para-react.md`](js-para-react.md) | 4h de nivelamento de JavaScript antes da semana 8, para turmas sem base. Inclui o **diagnóstico de 20 minutos** a aplicar na semana 1. |

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
| Lint e formatação | 🔵 Ruff · 🟣 ESLint + Prettier | Padrão de código |
| Testes | 🔵 pytest, pytest-django, model-bakery · 🟣 Vitest, Testing Library, MSW | Testes automatizados |
| Depuração | 🔵 Django Debug Toolbar · 🟣 React DevTools, TanStack Query Devtools | Consultas, estado, cache |
| Tipos | openapi-typescript | Contrato garantido pelo compilador |
| Segurança | pip-audit, detect-secrets, axe DevTools | Dependências, segredos, acessibilidade |
| Diagramas | Mermaid, dbdiagram.io, Excalidraw | ER, arquitetura, protótipo |
| Gestão | GitHub Projects, GitHub Issues | Backlog e sprints |
| Monitoramento | UptimeRobot, Sentry/GlitchTip | Disponibilidade e erros |
| API | httpie, curl, Bruno/Insomnia | Testar requisições |

## Links de referência rápida

**Documentação — backend**
- [Django (pt-br)](https://docs.djangoproject.com/pt-br/5.0/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Classy DRF](https://www.cdrf.co/) — o que cada classe do DRF faz
- [Django Packages](https://djangopackages.org/) — comparar bibliotecas

**Documentação — frontend**
- [React](https://react.dev/learn)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [MDN Web Docs (pt-br)](https://developer.mozilla.org/pt-BR/)

**Segurança**
- [OWASP Top 10 (pt-br)](https://owasp.org/Top10/pt_BR/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [securityheaders.com](https://securityheaders.com)

**Prática**
- [httpbin.org](https://httpbin.org) — eco de requisições HTTP
- [regex101.com](https://regex101.com) — testar expressões regulares
- [Learn Git Branching](https://learngitbranching.js.org/?locale=pt_BR)
