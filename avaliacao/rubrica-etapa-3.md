# Rubrica — Etapa 3: Desenvolvimento do sistema

> **Peso:** 30% da nota final · **Entrega:** semana 18 · **Eliminatória**
> 🔵 backend · 🟣 frontend · ⚪ transversal
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

## Bloco B — API (peso 4) 🔵

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **B1. MVP entregue** | Todas as *Must*, mais alguma *Should* | Todas as *Must* funcionando | Faltou uma *Must* | Faltou mais de uma | |
| **B2. CRUD** | 3+ recursos completos, com serializers de leitura e escrita separados | CRUD completo em 2 recursos | CRUD parcial | Não funciona | |
| **B3. Validação** | Validação por campo e entre campos, com mensagens úteis; erros no formato do contrato | Validação de servidor cobrindo as regras | Validação incompleta | Sem validação de servidor | |
| **B4. Consultas** | Filtros, busca, ordenação declarada e paginação; nenhum N+1 (medido) | Filtros e paginação funcionando | Consulta simples | Sem paginação; N+1 evidente | |
| **B5. Regras de negócio** | No model/service, consultadas pelo serializer; bem testadas | Implementadas no lugar certo | Espalhadas nas views | Ausentes ou incorretas | |
| **B6. Documentação** | OpenAPI navegável, com descrições e exemplos; contrato confrontado com a implementação | `/api/docs/` coerente | Gerada mas não revisada | Ausente | |

## Bloco C — Frontend (peso 4) 🟣

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **C1. Componentização** | Design system coeso; zero duplicação; componentes com responsabilidade clara | 6+ componentes base reutilizados | Alguma duplicação | Tudo num arquivo; classes repetidas | |
| **C2. Estado e dados** | TanStack Query bem usado (chaves, invalidação, `keepPreviousData`); nenhum estado duplicado | Query para todo dado de servidor, com invalidação | Ainda usa `useEffect` para buscar | Estado inconsistente; tela desatualizada | |
| **C3. Rotas** | Todo o estado de busca na URL; link compartilhável; 404 diferenciado | Rotas, layout e 404 funcionando | Navegação básica | `<a href>` interno; F5 quebra | |
| **C4. Formulários** | Zod + RHF, erros do servidor mapeados campo a campo, PRG no cliente | Validação nos dois lados, erros exibidos | Só validação de cliente | Sem validação; erro genérico | |
| **C5. Os quatro estados** | Tratados em todas as telas, com mensagem e ação distintas por tipo de erro | Tratados nas telas principais | Tratamento parcial | Só o caminho feliz | |
| **C6. Responsividade** | Bem resolvida de 360px a desktop, com adaptações pensadas | Usável em 360px sem rolagem horizontal | Quebra em telas pequenas | Só desktop | |
| **C7. Acessibilidade** | Zero problemas *critical*/*serious*; navegável só por teclado; nada só por cor | Labels, foco visível, contraste adequados | Alguns problemas | Inacessível | |
| **C8. Tipos** | Gerados do OpenAPI, verificados no CI | Gerados do OpenAPI | Escritos à mão | `any` espalhado | |

## Bloco D — Segurança e acesso (peso 4)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **D1. Autenticação** | Fluxo completo, incluindo recuperação de senha e política de senha forte | Login, logout e 2+ papéis funcionando | Autenticação frágil ou papel único | Ausente | |
| **D2. Autorização** | Permissões + autorização por objeto; recurso alheio devolve 404 | Permissões por papel e filtro de queryset | Só `login_required` | Sem controle; IDOR presente | |
| **D3. Configuração** | `check --deploy` limpo, cabeçalhos de segurança nota A | `check --deploy` sem avisos | Alguns avisos | `DEBUG=True` ou segredo no repositório | |
| **D4. Entrada e saída** | Nenhum `|safe` indevido, SQL parametrizado, upload validado, `fields` explícito | Sem vulnerabilidades identificadas nas verificações do M13 | 1 problema médio | Vulnerabilidade explorável | |
| **D6. Dados pessoais** | Mapa de dados, minimização aplicada **no serializer** (a API não devolve o que a tela não usa), aviso publicado | Mapa preenchido e aviso escrito | Mapa incompleto | Ausente; coleta sem finalidade | |

## Bloco E — Qualidade e testes (peso 3)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **E1. Testes automatizados** | 25+ no backend e 10+ no frontend; testes que falham sob mutação | 15+ no backend e 6+ no frontend | Só uma das camadas | Sem testes ou testes que não testam nada | |
| **E2. Matriz de acesso testada** | Todas as combinações papel × rota × método automatizadas | Principais combinações testadas | Poucos testes de permissão | Ausente | |
| **E3. CI** | Dois jobs (backend e frontend) com lint, migrações, `check --deploy`, testes, cobertura e **teste de contrato**; `main` protegida | CI nas duas camadas, bloqueando merge vermelho | CI só numa camada | Sem CI | |
| **E4. Teste com usuário real** | 2+ sessões observadas, com correções documentadas e efeito medido | 1 sessão realizada, com correções aplicadas | Realizado sem registro estruturado | Não realizado | |
| **E5. Legibilidade** | Código claro, `ruff` limpo, nomes precisos, regra no lugar certo | `ruff` limpo, código compreensível | Alguns problemas de organização | Código ilegível ou duplicado | |

## Bloco F — Implantação e operação (peso 3)

| Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|:---:|
| **F1. Sistema no ar** | API e SPA sob o mesmo site, HTTPS, estável, com dados reais em uso; **F5 em rota interna funciona** | Os dois artefatos no ar com HTTPS | No ar com falhas (ex.: F5 quebra) | Não implantado | |
| **F2. Infraestrutura** | PostgreSQL gerenciado, mídia externa, backup e healthcheck | PostgreSQL gerenciado e backup | SQLite em produção | Sem persistência confiável | |
| **F3. Deploy** | Automatizado a partir da `main`, com CI como pré-condição e rollback testado | Deploy documentado e reproduzível | Deploy manual não documentado | Ninguém sabe reproduzir | |
| **F4. Documentação** | README que sobe os dois projetos em ≤ 8 comandos + `docs/` completa (contrato, deploy, ADRs) | README funcional e `docs/deploy.md` | Documentação incompleta | Ausente | |

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
| A. Modelagem 🔵 | 3 | | |
| B. API 🔵 | 4 | | |
| C. Frontend 🟣 | 4 | | |
| D. Segurança ⚪ | 4 | | |
| E. Qualidade ⚪ | 3 | | |
| F. Implantação ⚪ | 3 | | |
| G. Processo ⚪ | 2 | | |
| **Total** | **23** | | |

**Nota da etapa** = (soma ponderada ÷ 92) × 10
**Nota individual** = nota da etapa × fator de participação (0,7–1,1)

---

## Condições eliminatórias

A etapa é considerada **não entregue** se qualquer uma ocorrer:

- [ ] Um dos dois artefatos não está no ar
- [ ] Não há autenticação
- [ ] A API aceita operação que a interface esconde (autorização só no cliente)
- [ ] Vulnerabilidade crítica não corrigida após apontamento
- [ ] Nenhum teste automatizado
- [ ] Código não está em repositório acessível

## Devolutiva

**Pontos fortes:**

**Prioridade de melhoria para a Etapa 4:**

**Observações sobre participação individual:**
