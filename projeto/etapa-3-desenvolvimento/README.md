# P3 — Sistema final

> **Semanas:** 11–18 · **Entrega:** semana 18 · **Peso:** 40% · **Eliminatória** ·
> **Rubrica:** [`rubrica-etapa-3.md`](../../avaliacao/rubrica-etapa-3.md)

## Por que esta etapa existe

A P2 provou que o núcleo funciona **na máquina de vocês**. Quem for usar o sistema precisa
de outra coisa: uma API que esteja no ar, que não exponha os dados das pessoas e que não quebre quando
alguém mexer no código. É a maior entrega da disciplina porque é o produto que vai ser usado.

## Objetivo

Ao final, a API do projeto está **completa, segura, testada e no ar**, pronta para a
demonstração (P4) — e, para quem segue a trilha opcional, para a implantação numa
organização real.

## Como esta etapa é construída

| Semana | Módulo | O que fica pronto no projeto | Critério |
| ---: | --- | --- | --- |
| 9–10 | [M08](../../modulos/08-autenticacao-usuarios/) | Login, papéis e rotas protegidas | 3 |
| 11 | [M09](../../modulos/09-seguranca/) | Autorização por dono e correções de segurança | 3 |
| 12 | [M10](../../modulos/10-testes-e-qualidade/) | Testes das regras e da matriz de acesso, no CI | 4 |
| 13 | [M11](../../modulos/11-tipos-compartilhados/) | `openapi.json` versionado e conferido no CI | 2 |
| 13–14 | [M12](../../modulos/12-deploy/) | **API no ar** com HTTPS e banco gerenciado | 5 |
| 14 | [M13](../../modulos/13-observabilidade-e-manutencao/) | Logs, backup testado, plano de manutenção | 5 |
| 15–16 | — | Histórias *Must* restantes · **teste com usuário** | 2, 4 |
| 17–18 | — | Correções, documentação, entrega | todos |

> **Deploy na semana 14, não na véspera.** Quem descobre na semana 18 que a API não sobe em
> produção não entrega — e esta etapa é eliminatória.

## Como esta etapa é usada depois

O sistema entregue aqui é o que se demonstra ao vivo na P4 (e o que uma organização recebe,
na trilha opcional). Problema não corrigido aqui aparece na frente da banca.

---

## Condições eliminatórias

A entrega é considerada **não realizada** se qualquer uma ocorrer:

- A API não está no ar
- Não há autenticação, ou a API aceita operação sem a autorização adequada
- Uma vulnerabilidade crítica apontada não foi corrigida
- Não há nenhum teste automatizado
- O código não está em repositório acessível

---

## O que entregar, critério por critério

| Critério | Peso | Para chegar a "Adequado" | Por que importa para quem usa |
| --- | ---: | --- | --- |
| **1. Dados** | 1,5 | 5+ entidades; `onDelete` justificado; migrações versionadas; paginação | Histórico preservado; API rápida com dados reais |
| **2. API e contrato** | 2,5 | Todas as *Must*; DTOs de entrada e saída; `/api/docs` coerente | O sistema faz o que foi combinado na P1 |
| **3. Segurança** | 2,0 | Login com 2+ papéis; autorização por dono; Helmet e CORS | Os dados são de pessoas reais |
| **4. Testes e validação com usuário** | 1,5 | 15+ testes com a matriz de acesso; CI; 1 sessão de teste com usuário | Mudar sem quebrar; saber que alguém de fora consegue usar |
| **5. Implantação e operação** | 1,5 | No ar com HTTPS; banco gerenciado com backup; `/health`; deploy documentado | Funciona sem vocês por perto |
| **6. Processo de equipe** | 1,0 | Todos contribuíram via PR; quadro em uso | Qualquer um da equipe consegue manter |

> **Os critérios 2 e 3 pesam mais.** Uma API que faz o que prometeu e protege os dados vale
> mais que qualquer detalhe extra.

## Fluxo de trabalho

```text
história → branch → commits pequenos → PR → CI verde → revisão → merge → deploy
```

Todo PR descreve **o que muda**, **como testar** e quais **critérios de aceite** cobre. Na
revisão, confira:

- [ ] A regra está no *service* e tem teste que falharia se ela quebrasse?
- [ ] O service filtra pelo usuário da sessão (sem IDOR)?
- [ ] A resposta usa DTO de saída, sem campo sensível?
- [ ] Nenhum segredo ou dado pessoal real no diff?

Checklist completo em [`recursos/checklists/revisao-de-codigo.md`](../../recursos/checklists/revisao-de-codigo.md).

## Teste com usuário (critério 4)

**Para quê:** descobrir o que só quem vai usar consegue mostrar. É o teste mais valioso da
etapa.

1. Peça a **alguém de fora da equipe** — colega de outra equipe, familiar, alguém parecido
   com a persona (ou alguém da organização, na trilha opcional) — para fazer o cenário
   principal usando a API (pelo `/api/docs` ou por um cliente simples).
2. **Não ajude. Só observe e anote:** onde hesitou, onde errou, quanto tempo levou.
3. Corrija os 3 problemas mais graves.
4. Registre tudo em `docs/teste-usuario.md`.

Os demais testes vão no [plano de teste](../modelos-de-documentos/plano-de-teste.md).

## 📦 Entrega P3

Na semana 18, tudo isto precisa estar no lugar:

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
| Deploy deixado para o fim | Deploy na semana 14, junto com o M12 |
| Branches enormes que não se juntam | PRs pequenos, merge frequente |
| Uma pessoa faz tudo | Tarefas distribuídas e pareamento |
| Testar só no final | Teste junto com cada história |
| Escopo crescendo | Troca 1 por 1, registrada no quadro |
| Nunca mostrar a ninguém de fora | Revisão com o docente a cada sprint |
