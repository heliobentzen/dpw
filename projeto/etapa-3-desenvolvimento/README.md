# Etapa 3 — Desenvolvimento do sistema backend

> **CH:** 8h (0h teóricas · 8h práticas) · **Semanas 17 e 18** · **Entrega P3** (semana 18) · **Peso:** 30%

## Atividades previstas

- Criação dos módulos definidos no projeto
- Implementação da API e da regra de negócio
- Realização dos testes e deploy do backend

## 🎯 O que esta etapa produz

O backend funcionando, testado e **no ar** — a maior entrega da disciplina.

> As 8h em aula são de integração, revisão e resolução de bloqueios. O desenvolvimento
> acontece continuamente desde a semana 12, aproveitando as atividades práticas de cada
> módulo. Equipe que começa a programar na semana 17 não entrega.

---

## 1. Ritmo de trabalho

### Sprints de 2 semanas

| Sprint | Semanas | Foco sugerido |
| --- | --- | --- |
| S1 | 12–13 | 🔵 Models, migrações, admin, dados de exemplo, **contrato de API** |
| S2 | 14–15 | 🔵 API completa (DTOs, validação, filtros, autenticação) |
| S3 | 16–17 | ⚪ Segurança, autorização, testes e **deploy** do backend |
| S4 | 18 | Ajustes com a organização parceira, documentação e validação final |

> **A ordem não é negociável:** o contrato de API na S1 e a API funcionando na S2 são o que
> permitem que o backend suporte a integração real com o cliente/usuário. Equipe que começa
> sem contrato retrabalha a integração inteira.

### Rituais (curtos e obrigatórios)

| Ritual | Quando | Duração | Pergunta |
| --- | --- | --- | --- |
| Planejamento | Início da sprint | 30 min | O que entra nesta sprint? |
| Acompanhamento | 2×/semana | 10 min | O que fiz, o que farei, o que me trava |
| Revisão | Fim da sprint | 30 min | Demonstrar o que ficou pronto |
| Retrospectiva | Fim da sprint | 20 min | O que manter, parar, começar |

A retrospectiva é a que mais se pula e a que mais rende. 20 minutos honestos na semana 14
evitam a crise da semana 18.

---

## 2. Fluxo de trabalho técnico

```
issue (história) → branch → commits → PR → CI verde → revisão → merge → deploy staging
```

```bash
git switch main
git pull
git switch -c feat/h07-registrar-emprestimo
# ... desenvolve, com commits pequenos e coerentes ...
git push -u origin feat/h07-registrar-emprestimo
# abre PR referenciando a issue: "Closes #7"
```

### Padrão de Pull Request

```markdown
## O que muda
Implementa o registro de empréstimo de ferramenta (H07).

## Como testar
1. Login como secretária
2. /ferramentas/ → escolher uma disponível → "Emprestar"
3. Selecionar morador → confirmar
4. Verificar a data prevista e a indisponibilidade da ferramenta

## Critérios de aceite
- [x] Só ferramentas disponíveis na lista
- [x] Só moradores adimplentes
- [x] Data prevista calculada (7 dias)
- [x] Impossível emprestar duas vezes (constraint no banco)

## Testes
4 testes novos em `emprestimos/emprestimos.service.spec.ts` e `test/emprestimos.e2e-spec.ts`.

## Pendências
Layout do celular precisa de ajuste — issue #23.
```

### Revisão de código: o que olhar

- [ ] Faz o que a história pede? Os critérios de aceite estão cobertos?
- [ ] Tem teste? O teste falharia se a regra fosse quebrada?
- [ ] Regra de negócio está no *service*, não no *controller*?
- [ ] Alguma consulta N+1? (`relations` / `leftJoinAndSelect`)
- [ ] Controle de acesso: o service filtra a consulta pelo usuário da sessão?
- [ ] Entidade devolvida direto na resposta, DTO sem `whitelist` ou payload inseguro?
- [ ] Nomes claros? Dá para entender daqui a seis meses?
- [ ] Alguma credencial ou dado real de pessoa no diff?

Revisão é sobre o código, nunca sobre a pessoa. Comentário útil sugere alternativa:
*"aqui pode dar N+1 na listagem — que tal `leftJoinAndSelect` no morador?"*.

---

## 3. Requisitos técnicos (verificados na rubrica)

### Piso — sem isto a etapa não é entregue

- [ ] API em produção com HTTPS e `GET /health` verificando o banco
- [ ] Swagger em `/api/docs` e `openapi.json` versionado no repositório
- [ ] Autenticação com 2+ papéis; escrita sem token → 401, papel errado → 403, recurso alheio → 403/404
- [ ] Banco criado por migrações versionadas (`synchronize` desligado em produção)
- [ ] Testes automatizados verdes no CI
- [ ] Nenhum segredo no repositório; README sobe o backend localmente

### O que diferencia uma API bem feita

- **Contrato:** rotas REST coerentes, status corretos (201/204/400/401/403/404/409/422),
  um único formato de erro, paginação com teto e metadados, OpenAPI com exemplos de erro.
- **Dados:** relações 1-N e N-N, restrições no banco (`UNIQUE`, `CHECK`, `onDelete`
  pensado), regras no *service*, transação onde há concorrência, sem N+1 nas listagens.
- **Segurança:** Argon2/bcrypt, token ou sessão com expiração, *guards* por papel **e**
  verificação de dono, `ValidationPipe` com `whitelist`, DTO de saída sem campos sensíveis,
  Helmet, CORS explícito, *rate limit* no login.
- **Qualidade:** testes e2e (Jest + Supertest) cobrindo regras, validação e matriz de
  acesso; CI com lint, build, testes e verificação do contrato; PRs revisados.
- **Operação:** deploy reproduzível (idealmente automático a partir da `main`),
  configuração por variáveis de ambiente, logs estruturados, backup, `docs/deploy.md`.

## 4. Plano de teste

Além dos automatizados, produza o
[plano de teste](../modelos-de-documentos/plano-de-teste.md) com:

**4.1 Testes automatizados** — lista do que cada um garante.

**4.2 Testes manuais de fluxo** — roteiro passo a passo dos 3 fluxos principais, com
resultado esperado e obtido.

**4.3 Teste com usuário real** ⭐ — o mais valioso desta etapa:

1. Peça a alguém da organização parceira para executar uma tarefa real no sistema.
2. **Não ajude. Não explique. Só observe e anote.**
3. Registre: onde hesitou, onde errou, o que perguntou, quanto tempo levou.
4. Corrija os 3 problemas mais graves.
5. Repita com outra pessoa.

Cinco minutos observando alguém usar o sistema ensinam mais que cinco horas de reunião
sobre usabilidade.

**4.4 Teste de carga simples** — com dados de volume (300+ registros), verifique que
nenhuma página passa de 2 segundos e que não há N+1 (Debug Toolbar).

---

## 📦 Entrega P3 — Sistema desenvolvido

**Prazo:** semana 18

| Item | Onde |
| --- | --- |
| Código-fonte completo | Repositório GitHub |
| Sistema no ar | URL pública, HTTPS |
| Suíte de testes verde | CI com badge no README |
| Plano de teste executado | `docs/plano-de-teste.md` |
| Evidências de uso real | `docs/teste-usuario.md` + registros |
| Histórico de trabalho | Commits, PRs e quadro do projeto |
| README funcional | Raiz do repositório |
| Documentação de deploy | `docs/deploy.md` |

Rubrica em [`../../avaliacao/rubrica-etapa-3.md`](../../avaliacao/rubrica-etapa-3.md).

## ⚠️ Erros que derrubam esta etapa

| Erro | Sintoma | Prevenção |
| --- | --- | --- |
| Começar tarde | Semana 17 com models incompletos | Sprints desde a semana 12 |
| Ninguém integra até o fim | Três branches enormes que não se juntam | PR pequeno, merge frequente |
| Uma pessoa faz tudo | Histórico com 90% de commits de um autor | Pareamento; tarefas distribuídas |
| Deploy deixado para o final | Descobre na véspera que não sobe | Deploy na semana 16, com o backend pronto |
| Testar só no fim | Bug estrutural descoberto tarde | Teste junto com a funcionalidade |
| Escopo crescendo | Nada fecha | Escopo declarado; troca 1 por 1 |
| Nunca mostrar ao parceiro | Sistema não resolve o problema real | Demonstração a cada sprint |
