# Rubrica — Etapa 3: Desenvolvimento do sistema

> **Peso:** 30% da nota final · **Entrega:** semana 18 · **Eliminatória**
> Escala: 4 Excelente · 3 Adequado · 2 Em desenvolvimento · 0–1 Insuficiente

**Equipe:** `<...>` · **Avaliador:** `<...>` · **Data:** `<...>`

---

## Bloco A — Modelagem de dados (peso 3)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **A1. Modelo de domínio** | 5+ models, com abstrações que expressam bem o domínio; separações não óbvias e corretas | 5+ models corretos, com 1-N e N-N | 3–4 models; alguma confusão de responsabilidade | Menos de 3 models ou modelagem que não sustenta as regras | |
| **A2. Relações e `on_delete`** | Toda política justificada e coerente com o negócio; nenhum histórico em risco | Políticas adequadas, com justificativa | Alguns `CASCADE` por inércia | `CASCADE` em tudo; risco de perda de dados | |
| **A3. Restrições de integridade** | 3+ constraints expressando regras reais; testadas | 2 constraints funcionando | 1 constraint | Nenhuma; integridade só na validação de formulário | |
| **A4. Migrações** | Histórico limpo, nomeado, sem conflitos; migração de dados quando necessária | Migrações versionadas e aplicadas | Migrações confusas ou refeitas | Migrações fora do Git ou inconsistentes | |

## Bloco B — Funcionalidades (peso 4)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **B1. MVP entregue** | Todas as funcionalidades *Must*, mais alguma *Should* | Todas as *Must* funcionando | Faltou uma *Must* | Faltou mais de uma *Must* | |
| **B2. CRUD** | CRUD completo em 3+ entidades, com validação robusta | CRUD completo em 2 entidades | CRUD parcial (falta editar ou excluir) | CRUD não funciona | |
| **B3. Consultas** | Busca com múltiplos filtros, ordenação, paginação; sem N+1 | Busca com filtros e paginação | Busca simples | Sem busca ou quebrada | |
| **B4. Regras de negócio** | Regras não triviais, no model/service, bem testadas | Regras implementadas no lugar certo | Regras espalhadas nas views | Regras ausentes ou incorretas | |
| **B5. Relatório** | Relatório com agregações, filtros por período e exportação | Ao menos 1 relatório com agregação | Listagem chamada de relatório | Ausente | |

## Bloco C — Interface (peso 3)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **C1. Estrutura de templates** | Herança bem usada, componentes reaproveitados, zero duplicação | Layout base e parciais | Alguma duplicação | Templates soltos, HTML repetido | |
| **C2. Responsividade** | Funciona bem de 360px a desktop, com adaptações pensadas | Usável em 360px sem rolagem horizontal | Quebra em telas pequenas | Só funciona em desktop | |
| **C3. Acessibilidade** | Sem problemas *critical*/*serious* no axe; navegável só por teclado; contraste ok | Labels, foco visível, `alt`, contraste adequado | Alguns problemas | Inacessível | |
| **C4. Feedback e estados** | Os 4 estados (carregando, vazio, conteúdo, erro) tratados em todas as telas | Estados vazios e mensagens em todas as ações | Tratamento parcial | Sem feedback; erro mostra traceback | |

## Bloco D — Segurança e acesso (peso 4)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **D1. Autenticação** | Fluxo completo, incluindo recuperação de senha e política de senha forte | Login, logout e 2+ papéis funcionando | Autenticação frágil ou papel único | Ausente | |
| **D2. Autorização** | Permissões + autorização por objeto; recurso alheio devolve 404 | Permissões por papel e filtro de queryset | Só `login_required` | Sem controle; IDOR presente | |
| **D3. Configuração** | `check --deploy` limpo, cabeçalhos de segurança nota A | `check --deploy` sem avisos | Alguns avisos | `DEBUG=True` ou segredo no repositório | |
| **D4. Entrada e saída** | Nenhum `|safe` indevido, SQL parametrizado, upload validado, `fields` explícito | Sem vulnerabilidades identificadas nas verificações do M11 | 1 problema médio | Vulnerabilidade explorável | |
| **D5. Dados pessoais** | Mapa de dados, minimização aplicada (campos removidos), aviso publicado | Mapa preenchido e aviso escrito | Mapa incompleto | Ausente; coleta sem finalidade | |

## Bloco E — Qualidade e testes (peso 3)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **E1. Testes automatizados** | 30+ testes; regras de negócio ≥ 90%; testes que falham sob mutação | 20+ testes cobrindo model, view, form e permissões | Menos de 20; cobertura irregular | Sem testes ou testes que não testam nada | |
| **E2. Matriz de acesso testada** | Todas as combinações papel × rota × método automatizadas | Principais combinações testadas | Poucos testes de permissão | Ausente | |
| **E3. CI** | Pipeline com lint, migrações, `check --deploy`, testes e cobertura; `main` protegida | CI rodando testes e bloqueando merge vermelho | CI configurado mas ignorado | Sem CI | |
| **E4. Teste com usuário real** | 2+ sessões observadas, com correções documentadas e efeito medido | 1 sessão realizada, com correções aplicadas | Realizado sem registro estruturado | Não realizado | |
| **E5. Legibilidade** | Código claro, `ruff` limpo, nomes precisos, regra no lugar certo | `ruff` limpo, código compreensível | Alguns problemas de organização | Código ilegível ou duplicado | |

## Bloco F — Implantação e operação (peso 3)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **F1. Sistema no ar** | URL pública, HTTPS, estável, com dados reais em uso | URL pública funcionando com HTTPS | No ar com falhas | Não implantado | |
| **F2. Infraestrutura** | PostgreSQL gerenciado, mídia externa, backup e healthcheck | PostgreSQL gerenciado e backup | SQLite em produção | Sem persistência confiável | |
| **F3. Deploy** | Automatizado a partir da `main`, com CI como pré-condição e rollback testado | Deploy documentado e reproduzível | Deploy manual não documentado | Ninguém sabe reproduzir | |
| **F4. Documentação** | README que sobe o projeto em ≤ 5 comandos + `docs/` completa | README funcional e `docs/deploy.md` | Documentação incompleta | Ausente | |

## Bloco G — Processo de equipe (peso 2)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **G1. Distribuição do trabalho** | Contribuição equilibrada; todos em áreas diferentes ao longo do projeto | Todos contribuíram tecnicamente | Concentração em 1–2 pessoas | Uma pessoa fez o projeto | |
| **G2. Fluxo Git** | PRs pequenos, bem descritos, revisados com comentários substantivos | Branches, PRs e revisões acontecendo | Commits direto na `main` | Histórico caótico ou inexistente | |
| **G3. Gestão do backlog** | Quadro atualizado, escopo controlado com trocas registradas | Quadro em uso | Quadro abandonado após a Etapa 2 | Sem gestão | |

---

## Cálculo

| Bloco | Peso | Nota (0–4) | Ponderado |
|---|---:|---:|---:|
| A. Modelagem | 3 | | |
| B. Funcionalidades | 4 | | |
| C. Interface | 3 | | |
| D. Segurança | 4 | | |
| E. Qualidade | 3 | | |
| F. Implantação | 3 | | |
| G. Processo | 2 | | |
| **Total** | **22** | | |

**Nota da etapa** = (soma ponderada ÷ 88) × 10
**Nota individual** = nota da etapa × fator de participação (0,7–1,1)

---

## Condições eliminatórias

A etapa é considerada **não entregue** se qualquer uma ocorrer:

- [ ] Sistema não está no ar
- [ ] Não há autenticação
- [ ] Vulnerabilidade crítica não corrigida após apontamento
- [ ] Nenhum teste automatizado
- [ ] Código não está em repositório acessível

## Devolutiva

**Pontos fortes:**

**Prioridade de melhoria para a Etapa 4:**

**Observações sobre participação individual:**
