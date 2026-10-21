# Etapa 2 — Sistema preliminar

> **Entrega:** P2 · **Semana:** 12 · **Peso:** 10% ·
> **Rubrica:** [`rubrica-etapa-2.md`](../../avaliacao/rubrica-etapa-2.md)

## 🎯 O que esta etapa produz

O **núcleo da API** funcionando: banco modelado e CRUD respondendo. É um checkpoint, não a
entrega final — serve para corrigir o rumo cedo, enquanto ainda há tempo.

> Nota mais branda e com recuperação: quem não for aprovado corrige e reenvia. Segurança,
> testes e deploy ficam para a [Etapa 3](../etapa-3-desenvolvimento/).

---

## Pré-requisitos

Sem estes três itens, a entrega volta sem nota.

- [ ] Repositório acessível, com o código do backend
- [ ] Migrações aplicadas sem erro (`npm run migration:run` num banco vazio)
- [ ] Ao menos um endpoint funcionando de ponta a ponta: banco → resposta

---

## O que entregar, critério por critério

### 1. Modelo de dados · peso 3,0

- [ ] **5+ entidades** do modelo da Etapa 1, com relações 1-N e N-N (M04)
- [ ] `onDelete` de cada chave estrangeira **justificado** por regra de negócio
- [ ] Restrições no banco: `unique`, `nullable` decidido coluna a coluna
- [ ] Banco criado só por **migrações** (M05)

### 2. API e CRUD · peso 4,0

- [ ] CRUD completo em **2 recursos** (3+ para nota máxima) (M06)
- [ ] **DTO de entrada e DTO de saída** separados — a entidade não sai na resposta (M07)
- [ ] Status corretos: 201 ao criar, 204 ao remover, 404 quando não existe

### 3. Validação e consultas · peso 2,0

- [ ] `ValidationPipe` com `whitelist` e regras nos DTOs (M07)
- [ ] Filtros ou paginação na listagem principal, com teto de tamanho (M06, M07)

### 4. Organização do código · peso 1,0

- [ ] Lint limpo
- [ ] Regra de negócio no *service*, nunca no controller (M03)

---

## Como chegar lá: sprint 1 (semanas 11–12)

| Ordem | Tarefa |
| --- | --- |
| 1 | Entidades e migração inicial |
| 2 | Contrato de API revisado (a partir do rascunho da Etapa 1) |
| 3 | CRUD do recurso principal, com DTOs |
| 4 | Segundo recurso, validação e paginação |
| 5 | Dados de exemplo (*seed*) para demonstrar |

Comece pelo recurso do **cenário principal** da Etapa 1: é ele que mostra se o projeto está
no rumo certo.

## 📦 Entrega P2

**Semana 12 · link do repositório**, com uma demonstração rápida no início da aula:

1. Banco vazio → `migration:run` → *seed*
2. Criar, listar, alterar e remover pelo `/api/docs` ou por `curl`
3. Uma entrada inválida respondendo 400

A devolutiva diz se a equipe segue, segue com ajustes ou corrige e reenvia.
