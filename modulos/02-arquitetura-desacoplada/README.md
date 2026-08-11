# M02 — Arquitetura desacoplada e contrato de API

> **CH:** 2h (2h teóricas · 0h práticas) · **Semana 2** · **Pré-requisito:** M01
> **Ementa:** *Introdução a aplicações web: como funcionam.*

Módulo curto e inteiramente conceitual — e um dos mais importantes. Ele responde à
pergunta que o resto do curso executa: **onde o HTML é montado, e quem decide isso?**

## 🎯 Objetivos

1. Comparar renderização no servidor (SSR/MPA) e aplicação de página única (SPA).
2. Escolher entre as duas a partir de requisitos, não de preferência.
3. Explicar o que é o **contrato** entre cliente e servidor e por que ele vem primeiro.
4. Projetar os recursos e as rotas de uma API REST a partir de um domínio.

---

## 📖 Teoria (2h)

### 1. Duas formas de montar uma página (30 min)

#### Renderização no servidor (MPA — *multi-page application*)

```
navegador                          servidor
    │  GET /obras/42/                 │
    ├────────────────────────────────▶│  consulta o banco
    │                                 │  preenche o template
    │  200 OK, text/html              │
    │◀────────────────────────────────┤
    │  (o HTML já vem pronto)         │
```

Cada navegação é uma requisição nova, e o servidor devolve **HTML completo**. É como
funcionam Django com templates, Rails com ERB, Laravel com Blade e PHP puro.

#### Aplicação de página única (SPA)

```
navegador                          servidor
    │  GET /                           │
    ├─────────────────────────────────▶│
    │  200 OK, index.html + bundle.js  │   (uma vez só)
    │◀─────────────────────────────────┤
    │                                  │
    │  o JavaScript assume a tela      │
    │                                  │
    │  GET /api/obras/42/              │
    ├─────────────────────────────────▶│  consulta o banco
    │  200 OK, application/json        │  serializa
    │◀─────────────────────────────────┤
    │  o JS monta o HTML no cliente    │
```

O servidor entrega **dados**; o navegador monta a interface. Navegar entre telas não
recarrega a página — o roteamento acontece no cliente (M10).

#### Comparação honesta

| Critério | MPA (servidor) | SPA (cliente) |
|---|---|---|
| Primeiro carregamento | Rápido | Mais lento (baixa o *bundle*) |
| Navegação seguinte | Recarrega tudo | Instantânea (só dados) |
| Funciona sem JavaScript | ✅ Sim | ❌ Não |
| SEO | ✅ Nativo | Exige SSR ou pré-renderização |
| Complexidade | Baixa: um projeto | Alta: dois projetos, dois deploys |
| Estado da interface | No servidor (sessão) | No cliente (memória) |
| Serve app mobile | Não (precisa de API à parte) | ✅ A mesma API |
| Equipes separadas | Difícil | ✅ Fácil (contrato claro) |
| Interatividade rica | Trabalhosa | ✅ Natural |
| Custo de manutenção | Menor | Maior |

**Não existe opção certa em abstrato.** Existe a opção certa para um conjunto de
requisitos. Um blog institucional em SPA é má engenharia; um painel de operação em tempo
real com MPA também.

#### Como escolher

```
O conteúdo precisa ser indexado por buscadores?
├── SIM, e é o principal ────────────────────▶ MPA ou SSR (Next.js, Nuxt)
└── NÃO (sistema atrás de login)
     │
     ├── Existe (ou existirá) app mobile / outro consumidor? ──▶ SPA + API
     ├── A interface tem muita interação sem recarregar? ──────▶ SPA + API
     ├── Equipes de front e back separadas? ───────────────────▶ SPA + API
     └── Nada disso, e a equipe é pequena? ────────────────────▶ MPA (mais simples)
```

> **O BiblioCom cabe nos dois modelos.** Adotamos SPA + API por decisão pedagógica e de
> mercado, registrada em [ADR-01](../../docs/decisoes-tecnicas.md#adr-01--arquitetura-desacoplada-api-rest--spa) —
> e com o custo declarado no [ADR-09](../../docs/decisoes-tecnicas.md#adr-09--o-custo-em-carga-horária).
> Reconhecer que a alternativa era viável é parte de decidir bem.

💼 **No mercado:** essa é uma pergunta real de entrevista e de reunião de arquitetura.
Responder "SPA, porque é moderno" desqualifica; responder com os requisitos qualifica.

### 2. O que muda quando se desacopla (30 min)

Separar cliente e servidor não elimina trabalho — **desloca** trabalho. O que antes era
uma chamada de função vira uma requisição de rede, com tudo que isso implica.

| Preocupação | MPA | SPA + API |
|---|---|---|
| Roteamento | Só no servidor | Servidor **e** cliente (dois mapas de rotas) |
| Validação | Uma vez (form do servidor) | Duas vezes (UX no cliente, **segurança** no servidor) |
| Autenticação | Sessão + cookie, direto | Sessão + CORS, ou token (M12) |
| Estado da tela | Não existe (a página recarrega) | Existe e precisa ser gerenciado (M11) |
| Erros | Página de erro | Cada requisição pode falhar; a tela precisa reagir |
| Carregamento | Não existe (o HTML já vem) | Todo dado tem "carregando" e "erro" |
| Deploy | Um artefato | Dois artefatos e um contrato entre eles |
| Tipos | Um só ecossistema | Duas linguagens; o contrato precisa ser garantido |

Três consequências que a turma vai sentir na pele:

1. **Toda tela tem quatro estados**: carregando, vazio, com conteúdo, erro. Em MPA você
   só precisava pensar no terceiro. Cobrado na rubrica da Etapa 3.
2. **Validar no cliente não é validar.** O `curl` do M01 já provou que dá para pular a
   interface. A validação do cliente existe para a experiência; a do servidor, para a
   integridade. Ambas são obrigatórias (M07 e M11).
3. **O contrato pode quebrar em silêncio.** O backend renomeia `titulo` para `nome`, o
   frontend continua compilando e a tela mostra `undefined`. As defesas: OpenAPI + tipos
   gerados (M07) e testes de contrato (M14).

### 3. O contrato de API (40 min) ⭐

O contrato é o acordo sobre **quais recursos existem, em quais URLs, com quais métodos, em
que formato e com quais erros**. Ele vem **antes** do código dos dois lados — é o que
permite backend e frontend avançarem em paralelo.

#### Recursos, não ações

A URL nomeia **coisas** (substantivos); o método diz o que se faz com elas (verbos). Isso
é o M01 aplicado.

| ❌ Verbo na URL | ✅ Recurso + método |
|---|---|
| `GET /criarObra` | `POST /api/obras/` |
| `POST /atualizarObra?id=42` | `PATCH /api/obras/42/` |
| `GET /deletarObra/42` | `DELETE /api/obras/42/` |
| `GET /listarObrasDoAutor/7` | `GET /api/obras/?autor=7` |
| `POST /devolverEmprestimo/15` | `POST /api/emprestimos/15/devolver/` ✅ |

A última linha mostra a exceção legítima: quando a operação **não** é um CRUD sobre o
recurso, uma sub-rota de ação é aceitável e mais clara que forçar um `PATCH`.

#### O contrato do BiblioCom

| Recurso | Método | Rota | O que faz | Sucesso |
|---|---|---|---|---|
| Obras | GET | `/api/obras/` | Lista, com filtros e paginação | 200 |
| | POST | `/api/obras/` | Cria | 201 |
| | GET | `/api/obras/{id}/` | Detalha | 200 |
| | PATCH | `/api/obras/{id}/` | Atualiza parcialmente | 200 |
| | DELETE | `/api/obras/{id}/` | Remove | 204 |
| Exemplares | GET | `/api/obras/{id}/exemplares/` | Exemplares da obra | 200 |
| Empréstimos | GET | `/api/emprestimos/` | Lista (filtrada pelo usuário) | 200 |
| | POST | `/api/emprestimos/` | Registra empréstimo | 201 |
| | POST | `/api/emprestimos/{id}/devolver/` | Registra devolução | 200 |
| Sessão | POST | `/api/auth/login/` | Autentica | 200 |
| | POST | `/api/auth/logout/` | Encerra sessão | 204 |
| | GET | `/api/auth/eu/` | Usuário atual | 200 / 401 |

#### Formato das respostas

**Lista paginada** (formato padrão do DRF):

```json
{
  "count": 128,
  "next": "https://bibliocom.org/api/obras/?page=3",
  "previous": "https://bibliocom.org/api/obras/?page=1",
  "results": [
    {
      "id": 42,
      "titulo": "Dom Casmurro",
      "autor": { "id": 7, "nome": "Machado de Assis" },
      "ano_publicacao": 1899,
      "exemplares_total": 3,
      "exemplares_disponiveis": 1
    }
  ]
}
```

**Erro de validação** (422 ou 400, campo a campo):

```json
{
  "titulo": ["Este campo é obrigatório."],
  "isbn": ["O ISBN deve ter 10 ou 13 dígitos."],
  "non_field_errors": ["Já existe uma obra com este ISBN."]
}
```

O formato de erro **é parte do contrato**. Se cada endpoint errar de um jeito, o frontend
precisa de um tratamento por endpoint — e não terá.

#### Decisões que o contrato precisa fixar

- [ ] Prefixo e versão (`/api/` ou `/api/v1/`)
- [ ] Barra final nas rotas — sim ou não, **consistentemente** (o Django usa; mantenha)
- [ ] Convenção de nomes dos campos (`snake_case`, como o Python)
- [ ] Formato de datas (**sempre** ISO 8601: `2026-08-11T14:32:07-03:00`)
- [ ] Formato de valores monetários (string decimal `"12.50"`, nunca `float`)
- [ ] Paginação: estilo e tamanho padrão
- [ ] Como se filtra, ordena e busca (`?q=`, `?ordering=`, `?autor=`)
- [ ] Formato do erro de validação e do erro de permissão
- [ ] Relações: id (`"autor": 7`) ou objeto aninhado (`"autor": {...}`)?

> A última decisão é a que mais gera retrabalho. Regra prática do material: **aninhe na
> leitura, use id na escrita.** A tela quer o nome do autor sem uma segunda requisição; o
> formulário só precisa mandar o id. O DRF faz isso com serializers diferentes para
> leitura e escrita (M07).

### 4. Documentação como fonte de verdade (20 min)

O contrato só funciona se estiver escrito num lugar que **não pode divergir do código**.
A solução padrão é **OpenAPI** gerado a partir do próprio código:

```
código do DRF  ──drf-spectacular──▶  schema.yml (OpenAPI)
                                          │
                          ┌───────────────┼────────────────┐
                          ▼               ▼                ▼
                    Swagger UI     openapi-typescript   testes de
                  (documentação)    (tipos do front)     contrato
```

Com isso, renomear um campo no serializer muda o schema, que muda os tipos do frontend,
que faz o TypeScript acusar erro **na compilação** — antes de chegar ao usuário. É a
defesa concreta contra o problema descrito na seção 2. Implementado no M07.

---

## 🛠️ Atividade dirigida (dentro das 2h teóricas)

### Escrever o contrato do BiblioCom (40 min, em duplas)

1. Liste os recursos do domínio (use os models que você projetará no M04).
2. Para cada um, defina as rotas, os métodos e os status de sucesso.
3. Escreva o JSON de exemplo de uma listagem e de um detalhe.
4. Defina as 9 decisões do checklist da seção 3.3.
5. Escreva 3 exemplos de erro: validação, não autenticado, sem permissão.

Guarde em `docs/contrato-api.md` no repositório. Este documento será confrontado com a
implementação real no M07 — e a diferença entre o que vocês projetaram e o que
implementaram é, ela mesma, o aprendizado.

---

## ⚠️ Erros comuns

| Erro | Por que é problema |
|---|---|
| Escolher SPA por moda | Complexidade sem contrapartida; o ADR existe para evitar isso |
| Verbo na URL (`/criarObra`) | Ignora a semântica do HTTP (M01) |
| Contrato só na cabeça de alguém | Frontend e backend divergem e ninguém percebe |
| Formato de erro diferente por endpoint | O cliente precisa de tratamento caso a caso |
| Data como `"11/08/2026"` | Ambíguo entre locales; use ISO 8601 |
| Dinheiro como `float` | Erro de ponto flutuante; use string decimal |
| "Validamos no React, então está validado" | Não está. `curl` ignora seu React |
| Começar o frontend antes da API existir | Trabalha-se contra dados falsos e retrabalha-se depois |

## ✅ Checklist de saída

- [ ] Sei explicar MPA × SPA sem usar a palavra "moderno"
- [ ] Sei escolher entre as duas a partir de requisitos
- [ ] Sei listar o que a arquitetura desacoplada **adiciona** de trabalho
- [ ] Sei por que toda tela passa a ter quatro estados
- [ ] Escrevi o contrato de API do BiblioCom, com as 9 decisões fixadas
- [ ] Sei o que é OpenAPI e por que gerá-lo do código importa

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [MDN — SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA)
- [Roy Fielding — capítulo 5 da tese que definiu REST](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
- [Microsoft — API design best practices](https://learn.microsoft.com/pt-br/azure/architecture/best-practices/api-design)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Nolan Lawson — The Balance has shifted away from SPAs](https://nolanlawson.com/2022/05/21/the-balance-has-shifted-away-from-spas/) (contraponto útil)
