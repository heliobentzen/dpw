# Rubrica — Portfólio de atividades práticas (E0–E8)

> **Peso:** 20% da nota final · **Individual** · Entrega contínua, semanas 2 a 16
> 🔵 backend · 🟣 frontend · ⚪ transversal

## O que compõe o portfólio

| Código | Entrega | Módulo | Camada | Semana |
|---|---|---|:---:|---:|
| **E0** | Relatório de inspeção HTTP | M01 | ⚪ | 2 |
| **E1** | Modelo de dados do BiblioCom | M04 | 🔵 | 4 |
| **E2** | Caderno de 20 consultas ORM + otimização N+1 | M06 | 🔵 | 6 |
| **E3** | API documentada (CRUD, validação, filtros, OpenAPI) | M07 | 🔵 | 7 |
| **E4** | SPA consumindo a API (listagem, detalhe, formulários) | M11 | 🟣 | 11 |
| **E5** | Autenticação ponta a ponta com matriz de acesso | M12 | ⚪ | 12 |
| **E6** | Relatório de segurança (18 casos + hardening) | M13 | ⚪ | 13 |
| **E7** | Suíte de testes verde nas duas camadas | M14 | ⚪ | 14 |
| **E8** | BiblioCom implantado: API e SPA no ar | M16 | ⚪ | 16 |

Todas as entregas são **individuais**, no repositório pessoal do BiblioCom criado no M00.
Isso garante que cada estudante percorra o caminho técnico completo — **das duas camadas**
—, independentemente da divisão de tarefas na equipe.

> Esse ponto ficou mais importante com a arquitetura desacoplada: sem o portfólio
> individual, é comum a equipe se dividir em "quem faz backend" e "quem faz frontend", e
> metade da turma sair sem ter escrito um DTO ou um componente.

## Como cada entrega é avaliada

| Nível | Pontos | Critério |
|---|---:|---|
| **Excelente** | 4 | Completa, correta, com os itens opcionais e reflexão própria |
| **Adequado** | 3 | Completa e correta, cumprindo todos os requisitos |
| **Em desenvolvimento** | 2 | Parcial: falta parte dos requisitos ou há erros conceituais |
| **Insuficiente** | 1 | Muito incompleta ou não demonstra compreensão |
| **Não entregue** | 0 | — |

**Nota do portfólio** = (soma das 9 entregas ÷ 36) × 10

## Correção

1. **Verificação binária** (entregue/não entregue) em todas, com base no checklist de saída
   do módulo.
2. **Correção detalhada por amostragem** de 30% das entregas, sorteadas, com feedback
   escrito. Quem for sorteado numa rodada não é sorteado na seguinte.
3. **Correção detalhada integral** de E6 (segurança) e E8 (deploy) — as de maior risco de
   erro silencioso.
4. **Verificação automatizada** onde possível: E7 e E8 são conferidos pelo CI e pela URL.

## Checklist por entrega

### E0 — Inspeção HTTP ⚪
- [ ] Tabela do DevTools preenchida, com prints
- [ ] 5+ comandos `curl` com saída comentada
- [ ] 6 experimentos do servidor mínimo respondidos
- [ ] Código do servidor mínimo no repositório
- [ ] Parágrafo sobre a característica do HTTP que mais influencia o design de aplicações

### E1 — Modelo de dados 🔵
- [ ] Diagrama ER
- [ ] `models.py` migrado, com 7 models
- [ ] Tabela justificando cada `on_delete`
- [ ] `sqlmigrate` com as 4 perguntas respondidas
- [ ] Fixture com 5 obras, 10 exemplares e 5 associados

### E2 — Consultas ORM 🔵
- [ ] 20 consultas com código, SQL gerado e nº de resultados
- [ ] Comentário de negócio em cada uma
- [ ] Tabela de otimização N+1 (antes → depois, com medição)

### E3 — API documentada 🔵
- [ ] CRUD completo em 2+ recursos, via ViewSet
- [ ] DTOs separados para entrada e saída, com os campos declarados explicitamente
- [ ] Validação de servidor testada com `curl` (3+ `validate_<campo>`, 1 `validate()`)
- [ ] Filtros, busca, ordenação declarada e paginação
- [ ] 2+ ações customizadas
- [ ] `/api/docs/` navegável
- [ ] Contrato do M02 confrontado com a implementação, divergências resolvidas

### E4 — SPA consumindo a API 🟣
- [ ] Listagem com busca e paginação, estado **na URL**
- [ ] Detalhe com parâmetro de rota
- [ ] Formulários de criação e edição com Zod + React Hook Form
- [ ] Erros 400 do DRF mapeados campo a campo
- [ ] Os quatro estados em todas as telas, **cada um demonstrado**
- [ ] TanStack Query com `queryKey` correta e `invalidateQueries`
- [ ] Tipos gerados do OpenAPI
- [ ] 6+ componentes base próprios, acessíveis

### E5 — Autenticação ponta a ponta ⚪
- [ ] `AUTH_USER_MODEL` customizado
- [ ] Login, logout e `eu` funcionando, testados com `curl`
- [ ] CSRF funcionando na SPA
- [ ] 3 grupos criados por comando versionado
- [ ] `AuthProvider` e `RotaProtegida` no cliente
- [ ] Matriz de acesso verificada nas duas camadas
- [ ] **Evidência de que a API recusa o que a interface esconde**

### E6 — Segurança ⚪
- [ ] 18 casos do laboratório (10 backend + 8 frontend) explorados e corrigidos
- [ ] `check --deploy` antes e depois
- [ ] Cabeçalhos e CSP configurados e justificados
- [ ] Evidência do experimento do segredo no bundle
- [ ] CORS com lista explícita (ou dispensado por *same-site*)
- [ ] Mapa de dados pessoais
- [ ] Aviso de privacidade

### E7 — Testes ⚪
- [ ] 15+ testes no backend (regra, acesso, validação)
- [ ] 6+ testes no frontend, incluindo erro do servidor no formulário
- [ ] Matriz de acesso automatizada
- [ ] Cobertura ≥ 60% no backend
- [ ] **Teste de contrato no CI** (tipos sincronizados)
- [ ] CI verde nos dois jobs, com badge no README

### E8 — Deploy ⚪
- [ ] API e SPA no ar, sob o mesmo site, com HTTPS
- [ ] **F5 numa rota interna funciona**
- [ ] Nota A em securityheaders.com
- [ ] Migrações aplicadas em produção
- [ ] Deploy automático a partir da `main`
- [ ] `docs/deploy.md` reproduzível por outra pessoa

## Reentrega

Entregas com nota 0, 1 ou 2 podem ser refeitas até a **semana 19**, com nota máxima 7,0. O
objetivo do portfólio é garantir que todos percorram o caminho técnico completo — não
penalizar quem levou mais tempo.
