# P2 — Sistema preliminar

> **Semanas:** 5–10 · **Entrega:** semana 10 · **Peso:** 25% · **Tem recuperação** ·
> **Rubrica:** [`rubrica-etapa-2.md`](../../avaliacao/rubrica-etapa-2.md)

## Por que esta etapa existe

Na semana 10 ainda há oito semanas pela frente. Se o modelo de dados estiver errado ou o
CRUD não funcionar, há tempo de corrigir. Na semana 18, não. A P2 é o **ponto de controle**
do semestre: ela pega problemas cedo, quando são baratos.

Por isso a nota tem recuperação: o objetivo é corrigir o rumo, não eliminar quem atrasou.

## Objetivo

Ao final, o **núcleo da API** funciona: o banco do domínio de vocês existe, criado por
migrações, e o **cenário principal da P1** pode ser executado de ponta a ponta pela API.

Segurança, testes e deploy ficam para a [P3](../etapa-3-desenvolvimento/).

## Como esta etapa é construída

Cada peça vem de um módulo. Ao fim de cada aula, a equipe aplica o módulo no projeto:

| Semana | Módulo | O que fica pronto no projeto |
| ---: | --- | --- |
| 5–6 | [M04](../../modulos/04-entidades-typeorm/) | As entidades da P1 viram classes e tabelas |
| 6 | [M05](../../modulos/05-migracoes/) | O banco passa a nascer só de migrações |
| 6–7 | [M06](../../modulos/06-orm-consultas-crud/) | As consultas do cenário principal, paginadas |
| 8–9 | [M07](../../modulos/07-api-controllers-dtos/) | CRUD validado, com DTOs e status corretos |
| 10 | — | Ajustes, dados de exemplo e demonstração |

> **Comece pelo recurso do cenário principal.** É ele que mostra se o projeto está no rumo.

## Como esta etapa é usada depois

A devolutiva da P2 vira a lista de correções da primeira sprint da P3. Modelo e CRUD são
reavaliados na P3, no estado final — então o que for corrigido conta.

---

## Pré-requisitos

Sem estes três itens, a entrega volta sem nota.

- [ ] Repositório da equipe acessível ao docente
- [ ] Migrações aplicam sem erro num banco vazio (`npm run migration:run`)
- [ ] O cenário principal da P1 funciona de ponta a ponta: requisição → banco → resposta

---

## O que entregar, critério por critério

### 1. Modelo de dados · peso 3,0

**Para quê:** o banco é a parte mais difícil de mudar depois. Um erro de modelagem
descoberto na semana 16 obriga a migrar dados reais.

- [ ] **5+ entidades** do domínio, com relações 1-N e N-N (M04)
- [ ] `onDelete` de cada chave estrangeira **justificado** por regra de negócio (M04)
- [ ] `unique` e `nullable` decididos coluna a coluna (M04)
- [ ] Banco criado só por **migrações** (M05)

### 2. API e CRUD · peso 3,0

**Para quê:** é o que quem usa o sistema faz no dia a dia.

- [ ] CRUD completo em **2 recursos** (3+ para nota máxima) (M06, M07)
- [ ] **DTO de entrada e DTO de saída** separados — a entidade não sai na resposta (M07)
- [ ] Status corretos: 201 ao criar, 204 ao remover, 404 quando não existe (M07)

### 3. Validação e consultas · peso 2,0

**Para quê:** dado inválido que entra no banco não sai mais; listagem sem limite derruba a
API quando os dados crescem.

- [ ] `ValidationPipe` com `whitelist` e regras nos DTOs (M07)
- [ ] Paginação com teto na listagem principal; filtros onde o cenário pede (M06, M07)
- [ ] Listagens sem N+1 (M06)

### 4. Organização e trabalho em equipe · peso 2,0

**Para quê:** da P3 em diante, quatro pessoas mexem no mesmo código. Sem organização, cada
merge vira conflito.

- [ ] Regra de negócio no *service*, nunca no controller (M03)
- [ ] Lint limpo
- [ ] Todos commitaram, por PR revisado (M00)

---

## 📦 Entrega P2

**Semana 10 · link do repositório** e uma demonstração de 5 minutos em aula:

1. Banco vazio → `migration:run` → dados de exemplo
2. O cenário principal da P1, pelo `/api/docs` ou por `curl`
3. Uma entrada inválida respondendo 400

A devolutiva diz se a equipe **segue**, **segue com ajustes** ou entra em **recuperação**
(reapresenta em até 2 semanas, valendo no máximo 7,5).
