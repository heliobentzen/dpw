# Etapa 3 — Desenvolvimento do sistema web

> **CH:** 8h (0h teóricas · 8h práticas) · **Semanas 17 e 18** · **Entrega P3** (semana 18) · **Peso:** 30%

## Atividades previstas

- Criação dos módulos definidos no projeto
- Realização dos testes

## 🎯 O que esta etapa produz

O sistema funcionando, testado e **no ar** — a maior entrega da disciplina.

> As 8h em aula são de integração, revisão e resolução de bloqueios. O desenvolvimento
> acontece continuamente desde a semana 12, aproveitando as atividades práticas de cada
> módulo. Equipe que começa a programar na semana 17 não entrega.

---

## 1. Ritmo de trabalho

### Sprints de 2 semanas

| Sprint | Semanas | Foco sugerido |
|---|---|---|
| S1 | 12–13 | 🔵 Models, migrações, admin, dados de exemplo, **contrato de API** |
| S2 | 14–15 | 🔵 API completa (serializers, validação, filtros) · 🟣 telas de leitura |
| S3 | 16–17 | ⚪ Autenticação ponta a ponta, formulários, testes, **deploy** |
| S4 | 18 | Ajustes com a organização parceira, acessibilidade, documentação |

> **A ordem não é negociável:** o contrato de API na S1 e a API funcionando na S2 são o que
> permite o frontend avançar. Equipe que começa as duas camadas em paralelo, sem contrato,
> retrabalha a integração inteira.

### Rituais (curtos e obrigatórios)

| Ritual | Quando | Duração | Pergunta |
|---|---|---|---|
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
git switch main && git pull
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
4 testes novos em `emprestimos/tests/test_models.py` e `test_views.py`.

## Pendências
Layout do celular precisa de ajuste — issue #23.
```

### Revisão de código: o que olhar

- [ ] Faz o que a história pede? Os critérios de aceite estão cobertos?
- [ ] Tem teste? O teste falharia se a regra fosse quebrada?
- [ ] Regra de negócio está no model/service, não espalhada na view?
- [ ] Alguma consulta N+1? (`select_related`/`prefetch_related`)
- [ ] Controle de acesso: a view filtra o queryset por usuário?
- [ ] Alguma URL literal, `fields = "__all__"` ou `dangerouslySetInnerHTML`?
- [ ] 🟣 `queryKey` inclui todos os filtros? A mutação invalida o cache certo?
- [ ] 🟣 Os quatro estados estão tratados nesta tela?
- [ ] 🟣 Componente acessível: label, foco, papel semântico correto?
- [ ] Nomes claros? Dá para entender daqui a seis meses?
- [ ] Alguma credencial ou dado real de pessoa no diff?

Revisão é sobre o código, nunca sobre a pessoa. Comentário útil sugere alternativa:
*"aqui pode dar N+1 na listagem — que tal `select_related('morador')`?"*.

---

## 3. Requisitos técnicos mínimos (verificados na rubrica)

### 🔵 Backend — modelagem
- [ ] 5+ models com relações 1-N **e** N-N
- [ ] `on_delete` justificado em cada FK
- [ ] 2+ restrições de integridade (`CheckConstraint`/`UniqueConstraint`)
- [ ] Migrações versionadas, sem conflitos pendentes

### 🔵 Backend — API
- [ ] CRUD completo em 2+ recursos, via ViewSet
- [ ] Serializers separados para leitura e escrita, com `fields` explícito
- [ ] Validação de servidor: 3+ `validate_<campo>` e 1 `validate()`
- [ ] Filtros, busca, ordenação (com `ordering_fields`) e paginação
- [ ] 2+ ações customizadas (`@action`)
- [ ] 1+ relatório com agregação
- [ ] Nenhuma consulta N+1 (medido)
- [ ] Documentação OpenAPI em `/api/docs/`

### 🟣 Frontend — interface
- [ ] 5+ rotas, com layout compartilhado e página 404
- [ ] Estado da busca (termo, filtros, ordenação, página) **na URL**
- [ ] Design system próprio: 6+ componentes base em `components/ui/`
- [ ] Responsiva: funciona em 360px sem rolagem horizontal
- [ ] Acessibilidade: labels associados, foco visível, contraste ≥ 4.5:1,
      navegação por teclado, nenhuma informação só por cor
- [ ] **Os quatro estados** (carregando, vazio, conteúdo, erro) em todas as telas
- [ ] Erros diferenciados: rede, 401, 403, 404, 500

### 🟣 Frontend — dados
- [ ] TanStack Query para todo dado do servidor (nenhum `useEffect` buscando dados)
- [ ] `queryKey` incluindo todos os filtros
- [ ] Mutações com `invalidateQueries`
- [ ] Formulários com React Hook Form + Zod
- [ ] Erros 400 do DRF mapeados campo a campo
- [ ] Tipos gerados do OpenAPI (`schema.d.ts`)

### ⚪ Segurança e acesso
- [ ] Autenticação com 2+ papéis, ponta a ponta
- [ ] Autorização por permissão **e** por objeto (sem IDOR)
- [ ] **Evidência de que a API recusa o que a interface esconde** (saída de `curl`)
- [ ] `check --deploy` sem avisos
- [ ] Nenhum segredo no repositório **nem no bundle** (`grep` no `dist/`)
- [ ] CORS com lista explícita, ou dispensado por *same-site*
- [ ] Mapa de dados pessoais preenchido

### ⚪ Qualidade
- [ ] 15+ testes no backend (regra, acesso, validação)
- [ ] 6+ testes no frontend, incluindo erro do servidor no formulário
- [ ] Matriz de acesso automatizada
- [ ] Cobertura ≥ 60% no backend
- [ ] Teste de contrato no CI (tipos sincronizados)
- [ ] CI verde nos dois jobs; `main` protegida

### ⚪ Operação
- [ ] API e SPA no ar, mesmo site, HTTPS
- [ ] **F5 numa rota interna funciona** (fallback configurado)
- [ ] PostgreSQL gerenciado, com backup
- [ ] Healthcheck e logs funcionando
- [ ] `README.md` que sobe os dois projetos em ≤ 8 comandos
- [ ] `docs/deploy.md` reproduzível

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
|---|---|
| Código-fonte completo | Repositório GitHub |
| Sistema no ar | URL pública, HTTPS |
| Suíte de testes verde | CI com badge no README |
| Plano de teste executado | `docs/plano-de-teste.md` |
| Registro do teste com usuário real | `docs/teste-usuario.md` + evidências |
| Histórico de trabalho | Commits, PRs e quadro do projeto |
| README funcional | Raiz do repositório |
| Documentação de deploy | `docs/deploy.md` |

Rubrica em [`../../avaliacao/rubrica-etapa-3.md`](../../avaliacao/rubrica-etapa-3.md).

## ⚠️ Erros que derrubam esta etapa

| Erro | Sintoma | Prevenção |
|---|---|---|
| Começar tarde | Semana 17 com models incompletos | Sprints desde a semana 12 |
| Ninguém integra até o fim | Três branches enormes que não se juntam | PR pequeno, merge frequente |
| Uma pessoa faz tudo | Histórico com 90% de commits de um autor | Pareamento; tarefas distribuídas |
| Deploy deixado para o final | Descobre na véspera que não sobe | Deploy na semana 16, com o BiblioCom pronto |
| Testar só no fim | Bug estrutural descoberto tarde | Teste junto com a funcionalidade |
| Escopo crescendo | Nada fecha | Escopo declarado; troca 1 por 1 |
| Nunca mostrar ao parceiro | Sistema não resolve o problema real | Demonstração a cada sprint |
