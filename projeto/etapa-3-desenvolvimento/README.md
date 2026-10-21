# Etapa 3 — Sistema final

> **Entrega:** P3 · **Semana:** 18 · **Peso:** 20% · **Eliminatória** ·
> **Rubrica:** [`rubrica-etapa-3.md`](../../avaliacao/rubrica-etapa-3.md)

## 🎯 O que esta etapa produz

A API **completa, segura, testada e no ar** — a maior entrega da disciplina. Parte do núcleo
aprovado na [Etapa 2](../etapa-2-sistema-preliminar/) e acrescenta segurança, testes e
implantação.

---

## Condições eliminatórias

A etapa é considerada **não entregue** se qualquer uma ocorrer:

- O backend não está no ar
- Não há autenticação, ou a API aceita operação sem a autorização adequada
- Uma vulnerabilidade crítica apontada não foi corrigida
- Não há nenhum teste automatizado
- O código não está em repositório acessível

---

## O que entregar, bloco por bloco

A rubrica tem sete blocos. A nota de cada bloco é a média dos seus critérios.

| Bloco | Peso | Para chegar a "Adequado" | Módulo |
| --- | ---: | --- | --- |
| **A. Modelagem** | 3 | 5+ entidades com 1-N e N-N; `onDelete` justificado; 2+ constraints; migrações versionadas | M04, M05 |
| **B. API** | 4 | Todas as histórias *Must*; CRUD em 2+ recursos; validação; filtros e paginação; regra no *service*; `/api/docs` com schema versionado | M06, M07 |
| **C. Contrato e integração** | 4 | Contrato estável; um cliente externo consome sem adivinhar o formato; um único padrão de erro | M02, M07, M11 |
| **D. Segurança** | 4 | Login com 2+ papéis; autorização por papel **e** por dono; segredos fora do código; mapa de dados pessoais | M08, M09 |
| **E. Qualidade** | 3 | 15+ testes, incluindo a matriz de acesso; CI bloqueante; 1 teste com usuário real; lint limpo | M10 |
| **F. Implantação** | 3 | API no ar com HTTPS; PostgreSQL gerenciado com backup; deploy documentado | M12, M13 |
| **G. Processo** | 2 | Todos contribuíram; PRs revisados; quadro em uso | — |

> **Os blocos mais pesados são B, C e D.** Uma API completa, com contrato claro e acesso bem
> controlado, vale mais que qualquer detalhe extra.

---

## Ritmo de trabalho

| Sprint | Semanas | Foco |
| --- | --- | --- |
| S2 | 13–14 | Histórias *Must* restantes, autenticação e papéis |
| S3 | 15–16 | Autorização por dono, segurança (M09), testes e **deploy** |
| S4 | 17–18 | Teste com usuário real, correções, documentação |

**Deploy na semana 16**, não na véspera. Quem descobre na semana 18 que a API não sobe em
produção não entrega.

Rituais curtos: planejamento no início da sprint (30 min), acompanhamento 2×/semana
(10 min), revisão e retrospectiva no fim (50 min).

## Fluxo de trabalho

```text
história → branch → commits pequenos → PR → CI verde → revisão → merge → deploy
```

Todo PR descreve **o que muda**, **como testar** e quais **critérios de aceite** cobre. Na
revisão, confira:

- [ ] A regra está no *service* e tem teste que falharia se ela quebrasse?
- [ ] O service filtra pelo usuário da sessão (sem IDOR)?
- [ ] Sem N+1 nas listagens?
- [ ] A resposta usa DTO de saída, sem campo sensível?
- [ ] Nenhum segredo ou dado pessoal real no diff?

Checklist completo em [`recursos/checklists/revisao-de-codigo.md`](../../recursos/checklists/revisao-de-codigo.md).

## Teste com usuário real (critério E4)

O teste mais valioso da etapa:

1. Peça a alguém da organização para fazer uma tarefa real usando a API (pelo `/api/docs`
   ou por um cliente simples).
2. **Não ajude. Só observe e anote:** onde hesitou, onde errou, quanto tempo levou.
3. Corrija os 3 problemas mais graves.
4. Registre tudo em `docs/teste-usuario.md`.

Os demais testes vão no [plano de teste](../modelos-de-documentos/plano-de-teste.md).

## 📦 Entrega P3

**Semana 18**

| Item | Onde |
| --- | --- |
| Código completo | Repositório da equipe |
| API no ar | URL pública com HTTPS e `/health` |
| Contrato | `/api/docs` e `openapi.json` versionado |
| Testes verdes | CI com badge no README |
| Teste com usuário | `docs/teste-usuario.md` |
| Como rodar e implantar | `README.md` e `docs/deploy.md` |
| Histórico de trabalho | Commits, PRs e quadro do projeto |

## ⚠️ Erros que derrubam esta etapa

| Erro | Prevenção |
| --- | --- |
| Deploy deixado para o fim | Deploy na semana 16 |
| Branches enormes que não se juntam | PRs pequenos, merge frequente |
| Uma pessoa faz tudo | Tarefas distribuídas e pareamento |
| Testar só no final | Teste junto com cada história |
| Escopo crescendo | Troca 1 por 1, registrada no quadro |
| Nunca mostrar à organização | Demonstração a cada sprint |
