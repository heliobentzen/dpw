# Rubrica — P3: Sistema final

> **Peso:** 40% · **Entrega:** semana 18 · **Eliminatória** · Orientações em
> [`projeto/etapa-3-desenvolvimento/`](../projeto/etapa-3-desenvolvimento/)
> Escala por critério: 4 Excelente · 3 Adequado · 2 Em desenvolvimento · 0–1 Insuficiente

**Equipe:** `<...>` · **Avaliador:** `<...>` · **Data:** `<...>`

**O que esta rubrica verifica:** se a API está pronta para ser usada — completa,
segura, testada e no ar. Cada critério corresponde a um bloco de módulos; a coluna
**Módulo** diz onde está o conteúdo.

## Condições eliminatórias

A entrega é considerada **não realizada** se qualquer uma ocorrer:

- [ ] A API não está no ar
- [ ] Não há autenticação, ou a API aceita operação sem a autorização adequada
- [ ] Vulnerabilidade crítica apontada e não corrigida
- [ ] Nenhum teste automatizado
- [ ] Código fora de repositório acessível

## Critérios

| Critério | Peso | Módulo | 4 — Excelente | 3 — Adequado | 2 — Em desenvolvimento | 0–1 — Insuficiente | Nível |
| --- | ---: | --- | --- | --- | --- | --- | :---: |
| **1. Dados** | 1,5 | M04–M06 | Modelo expressa bem o domínio; 3+ restrições testadas; migrações limpas; consultas sem N+1 | 5+ entidades, `onDelete` justificado, migrações versionadas, paginação | Alguns `CASCADE` por inércia ou migrações confusas | Modelo não sustenta as regras; banco criado à mão | |
| **2. API e contrato** | 2,5 | M07, M11 | Todas as *Must* e alguma *Should*; erros num formato único; `openapi.json` versionado e conferido no CI | Todas as *Must*; DTOs de entrada e saída; `/api/docs` coerente com o código | Faltou uma *Must* ou documentação incompleta | Faltou mais de uma *Must*; contrato ausente | |
| **3. Segurança** | 2,0 | M08, M09 | Autorização por papel **e** por dono, testada; *rate limit* no login; segredos fora do código; dados pessoais minimizados na resposta | Login com 2+ papéis; autorização por dono; Helmet e CORS configurados | Só exige estar logado; alguns problemas | IDOR presente; segredo no repositório | |
| **4. Testes e validação com usuário** | 1,5 | M10 | 25+ testes, incluindo todas as combinações papel × rota; CI bloqueia o merge; 2+ sessões de teste com usuário, com correções medidas | 15+ testes, incluindo a matriz de acesso principal; CI rodando; 1 sessão de teste com usuário (alguém de fora da equipe) e correções | Poucos testes ou teste com usuário sem registro | Sem testes úteis | |
| **5. Implantação e operação** | 1,5 | M12, M13 | Deploy automático a partir da `main`; backup **restaurado** com sucesso; logs sem dado pessoal | API no ar com HTTPS; banco gerenciado com backup; `/health`; `docs/deploy.md` reproduzível | No ar com falhas, ou sem backup | Ninguém sabe reproduzir o deploy | |
| **6. Processo de equipe** | 1,0 | M00 | PRs pequenos com revisão substantiva; quadro atualizado; escopo controlado | Todos contribuíram via PR; quadro em uso | Concentração em 1–2 pessoas; commits direto na `main` | Uma pessoa fez o projeto | |
| **Total** | **10** | | | | | | |

**Nota da etapa** = Σ (nível × peso) ÷ 4
**Nota individual** = nota da etapa × fator de participação (0,7–1,1)

> Os critérios 2 e 3 pesam mais porque são o que quem usa sente: uma API que faz o que
> prometeu e não expõe os dados de ninguém.

---

## Devolutiva

**Pontos fortes:**

**O que melhorar antes da P4:**

**Observações sobre participação individual:**
