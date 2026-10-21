# Rubrica — Etapa 3: Sistema final

> **Peso:** 20% da nota final · **Entrega:** semana 18 · **Eliminatória**
> Consolida e aprofunda o que foi verificado na Etapa 2 (sistema preliminar): modelagem e API
> são reavaliadas aqui no estado final, junto com segurança, qualidade e implantação.
> 🔵 backend · ⚪ transversal
> Escala: 4 Excelente · 3 Adequado · 2 Em desenvolvimento · 0–1 Insuficiente

**Equipe:** `<...>` · **Avaliador:** `<...>` · **Data:** `<...>`

---

## Bloco A — Modelagem de dados (peso 3) 🔵

| Critério | 4 | 3 | 2 | 0–1 | Nota |
| --- | --- | --- | --- | --- | :---: |
| **A1. Modelo de domínio** | 5+ entidades, com abstrações que expressam bem o domínio; separações não óbvias e corretas | 5+ entidades corretas, com 1-N e N-N | 3–4 entidades; alguma confusão de responsabilidade | Menos de 3 entidades ou modelagem que não sustenta as regras | |
| **A2. Relações e `onDelete`** | Toda política justificada e coerente com o negócio; nenhum histórico em risco | Políticas adequadas, com justificativa | Alguns `CASCADE` por inércia | `CASCADE` em tudo; risco de perda de dados | |
| **A3. Restrições de integridade** | 3+ constraints expressando regras reais; testadas | 2 constraints funcionando | 1 constraint | Nenhuma; integridade só na validação de entrada | |
| **A4. Migrações** | Histórico limpo, nomeado, sem conflitos; migração de dados quando necessária | Migrações versionadas e aplicadas | Migrações confusas ou refeitas | Migrações fora do Git ou inconsistentes | |

## Bloco B — API (peso 4) 🔵

| Critério | 4 | 3 | 2 | 0–1 | Nota |
| --- | --- | --- | --- | --- | :---: |
| **B1. MVP entregue** | Todas as *Must*, mais alguma *Should* | Todas as *Must* funcionando | Faltou uma *Must* | Faltou mais de uma | |
| **B2. CRUD** | 3+ recursos completos, com DTOs de entrada e de saída separados | CRUD completo em 2 recursos | CRUD parcial | Não funciona | |
| **B3. Validação** | Validação por campo e entre campos, com mensagens úteis; erros no formato do contrato | Validação de servidor cobrindo as regras | Validação incompleta | Sem validação de servidor | |
| **B4. Consultas** | Filtros, busca, ordenação declarada e paginação; nenhum N+1 (medido) | Filtros e paginação funcionando | Consulta simples | Sem paginação; N+1 evidente | |
| **B5. Regras de negócio** | No *service*, chamadas pelo controller; bem testadas | Implementadas no lugar certo | Espalhadas nos controllers | Ausentes ou incorretas | |
| **B6. Swagger e documentação** | `/api/docs` navegável, com descrições, exemplos, respostas de erro e schema OpenAPI versionado; contrato confrontado com a implementação | `/api/docs` coerente e schema versionado | Gerada mas não revisada ou incompleta | Ausente | |

## Bloco C — Contrato e integração (peso 4) 🔵

| Critério | 4 | 3 | 2 | 0–1 | Nota |
| --- | --- | --- | --- | --- | :---: |
| **C1. Contrato de API** | Schema claro, consistente e revisado; todas as respostas e erros documentados | Contrato estável e coerente | Alguns campos pouco claros | Contrato inconsistente ou ausente | |
| **C2. Consumo externo** | Cliente externo consegue consumir a API sem adivinhar o formato | Integração funciona com poucas adaptações | Integração parcial | Não é consumível sem conhecimento interno | |
| **C3. Status e erros** | Métodos e códigos de erro padronizados, sem ambiguidade | Erros consistentes e compreensíveis | Algum erro genérico | Sem padrão de resposta | |
| **C4. Versionamento e evolução** | Mudanças de contrato controladas e compatíveis com clientes atuais; CI detecta divergência | Evolução organizada | Ajustes sem documentar | Evolução caótica | |

## Bloco D — Segurança e acesso (peso 4) ⚪

| Critério | 4 | 3 | 2 | 0–1 | Nota |
| --- | --- | --- | --- | --- | :---: |
| **D1. Autenticação** | Fluxo completo, com expiração de sessão/token, política de senha forte e *rate limit* no login | Login, logout e 2+ papéis funcionando | Autenticação frágil ou papel único | Ausente | |
| **D2. Autorização** | Permissão por papel **e** por dono do recurso; recurso alheio devolve 403/404 | Permissões por papel e filtro na consulta | Só exige autenticação | Sem controle; IDOR presente | |
| **D3. Configuração** | Helmet, CORS explícito, segredos só em variáveis de ambiente, erros sem detalhe interno em produção | Configuração segura nas verificações do M09 | Alguns problemas | Segredo no repositório ou *stack trace* exposto | |
| **D4. Entrada e saída** | SQL sempre parametrizado, upload validado por conteúdo, `whitelist` ativo, DTO de saída explícito | Sem vulnerabilidades nas verificações do M09 | 1 problema médio | Vulnerabilidade explorável | |
| **D5. Dados pessoais** | Mapa de dados, minimização aplicada **no DTO de saída**, aviso de privacidade publicado | Mapa preenchido e aviso escrito | Mapa incompleto | Ausente; coleta sem finalidade | |

## Bloco E — Qualidade e testes (peso 3) ⚪

| Critério | 4 | 3 | 2 | 0–1 | Nota |
| --- | --- | --- | --- | --- | :---: |
| **E1. Testes automatizados** | 25+ testes; testes que falham quando a regra é quebrada | 15+ testes | Menos de 15 ou testes frágeis | Sem testes ou testes que não testam nada | |
| **E2. Matriz de acesso testada** | Todas as combinações papel × rota × método automatizadas | Principais combinações testadas | Poucos testes de permissão | Ausente | |
| **E3. CI** | Lint, build, migrações, testes e verificação do contrato; `main` protegida | CI funcional e bloqueante | CI incompleta | Sem CI | |
| **E4. Teste com usuário real** | 2+ sessões observadas, com correções documentadas e efeito medido | 1 sessão realizada, com correções aplicadas | Realizado sem registro estruturado | Não realizado | |
| **E5. Legibilidade** | Código claro, lint limpo, nomes precisos, regra no lugar certo | Lint limpo, código compreensível | Alguns problemas de organização | Código ilegível ou duplicado | |

## Bloco F — Implantação e operação (peso 3) ⚪

| Critério | 4 | 3 | 2 | 0–1 | Nota |
| --- | --- | --- | --- | --- | :---: |
| **F1. Sistema no ar** | API em produção, HTTPS, estável e com dados reais em uso | API no ar com HTTPS | No ar com falhas ou instabilidade | Não implantado | |
| **F2. Infraestrutura** | PostgreSQL gerenciado, arquivos fora do contêiner, backup e `/health` verificando o banco | PostgreSQL gerenciado e backup | Banco sem backup | Sem persistência confiável | |
| **F3. Deploy** | Automatizado a partir da `main`, com CI como pré-condição e rollback testado | Deploy documentado e reproduzível | Deploy manual não documentado | Ninguém sabe reproduzir | |
| **F4. Documentação** | README que sobe o backend em ≤ 8 comandos + `docs/` completa (contrato, deploy, ADRs) | README funcional e `docs/deploy.md` | Documentação incompleta | Ausente | |

## Bloco G — Processo de equipe (peso 2) ⚪

| Critério | 4 | 3 | 2 | 0–1 | Nota |
| --- | --- | --- | --- | --- | :---: |
| **G1. Distribuição do trabalho** | Contribuição equilibrada; todos em áreas diferentes ao longo do projeto | Todos contribuíram tecnicamente | Concentração em 1–2 pessoas | Uma pessoa fez o projeto | |
| **G2. Fluxo Git** | PRs pequenos, bem descritos, revisados com comentários substantivos | Branches, PRs e revisões acontecendo | Commits direto na `main` | Histórico caótico ou inexistente | |
| **G3. Gestão do backlog** | Quadro atualizado, escopo controlado com trocas registradas | Quadro em uso | Quadro abandonado após a Etapa 2 | Sem gestão | |

---

## Cálculo

A nota de cada bloco é a média dos seus critérios (0–4).

| Bloco | Peso | Nota (0–4) | Ponderado |
| --- | ---: | ---: | ---: |
| A. Modelagem 🔵 | 3 | | |
| B. API 🔵 | 4 | | |
| C. Contrato e integração 🔵 | 4 | | |
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

- [ ] O backend não está no ar
- [ ] Não há autenticação
- [ ] A API aceita operação sem autorização adequada
- [ ] Vulnerabilidade crítica não corrigida após apontamento
- [ ] Nenhum teste automatizado
- [ ] Código não está em repositório acessível

## Devolutiva

**Pontos fortes:**

**Prioridade de melhoria para a Etapa 4:**

**Observações sobre participação individual:**
