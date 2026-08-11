# Rubrica — Portfólio de atividades práticas (E0–E7)

> **Peso:** 20% da nota final · **Individual** · Entrega contínua, semanas 2 a 16

## O que compõe o portfólio

| Código | Entrega | Módulo | Semana |
|---|---|---|---:|
| **E0** | Relatório de inspeção HTTP | M01 | 2 |
| **E1** | Modelo de dados do BiblioCom | M03 | 4 |
| **E2** | Caderno de 20 consultas ORM + otimização N+1 | M05 | 6 |
| **E3** | CRUD completo com formulários e validação | M07 | 9 |
| **E4** | Área autenticada com matriz de acesso verificada | M10 | 12 |
| **E5** | Relatório de segurança (10 vulnerabilidades + hardening) | M11 | 13 |
| **E6** | Suíte de testes com CI verde | M12 | 14 |
| **E7** | BiblioCom implantado, com URL pública | M14 | 16 |

Todas as entregas são **individuais** e feitas no repositório pessoal do BiblioCom, criado
no M00. Isso garante que cada estudante percorra o caminho técnico completo, independente
da divisão de tarefas na equipe.

## Como cada entrega é avaliada

| Nível | Pontos | Critério |
|---|---:|---|
| **Excelente** | 4 | Completa, correta, com os itens opcionais e reflexão própria |
| **Adequado** | 3 | Completa e correta, cumprindo todos os requisitos |
| **Em desenvolvimento** | 2 | Parcial: falta parte dos requisitos ou há erros conceituais |
| **Insuficiente** | 1 | Muito incompleta ou não demonstra compreensão |
| **Não entregue** | 0 | — |

**Nota do portfólio** = (soma das 8 entregas ÷ 32) × 10

## Correção

Para viabilizar a correção de uma turma inteira em 8 entregas:

1. **Verificação binária** (entregue/não entregue) em todas, com base no checklist de saída
   do módulo.
2. **Correção detalhada por amostragem** de 30% das entregas, sorteadas, com feedback
   escrito.
3. **Correção detalhada integral** de E5 (segurança) e E7 (deploy), que são as de maior
   risco de erro silencioso.
4. **Verificação automatizada** onde possível: E6 e E7 são conferidos pelo CI e pela URL.

Quem for sorteado numa rodada não é sorteado na seguinte, até todos terem passado pela
amostragem.

## Checklist por entrega

### E0 — Inspeção HTTP
- [ ] Tabela do DevTools preenchida, com prints
- [ ] 5+ comandos `curl` com saída comentada
- [ ] 6 experimentos do servidor mínimo respondidos
- [ ] Código do servidor mínimo no repositório
- [ ] Parágrafo final sobre a característica do HTTP que mais influencia o design de aplicações

### E1 — Modelo de dados
- [ ] Diagrama ER
- [ ] `models.py` migrado, com 7 models
- [ ] Tabela justificando cada `on_delete`
- [ ] `sqlmigrate` com as 4 perguntas respondidas
- [ ] Fixture com 5 obras, 10 exemplares e 5 associados

### E2 — Consultas ORM
- [ ] 20 consultas com código, SQL gerado e nº de resultados
- [ ] Comentário de negócio em cada uma
- [ ] Tabela de otimização N+1 (antes → depois, com medição)

### E3 — CRUD
- [ ] Listar, detalhar, criar, editar e excluir funcionando
- [ ] Busca com filtros e paginação
- [ ] Validação de servidor, com 3+ `clean_<campo>` e 1 `clean()`
- [ ] Mensagens de feedback e PRG
- [ ] Evidência de que a validação funciona sem o navegador (`curl`)

### E4 — Área autenticada
- [ ] `AUTH_USER_MODEL` customizado
- [ ] Cadastro, login, logout e recuperação de senha
- [ ] 3 grupos criados por comando versionado
- [ ] Matriz de acesso preenchida e verificada célula a célula

### E5 — Segurança
- [ ] 10 vulnerabilidades identificadas, exploradas e corrigidas
- [ ] `check --deploy` antes e depois
- [ ] Cabeçalhos de segurança configurados e justificados
- [ ] Mapa de dados pessoais
- [ ] Aviso de privacidade

### E6 — Testes
- [ ] 20+ testes cobrindo model, view, form e permissões
- [ ] Matriz de acesso automatizada
- [ ] Cobertura ≥ 60%
- [ ] CI verde, com badge no README

### E7 — Deploy
- [ ] URL pública com HTTPS
- [ ] Nota A em securityheaders.com
- [ ] `docs/deploy.md` reproduzível
- [ ] Migrações aplicadas em produção
- [ ] Deploy automático a partir da `main`

## Reentrega

Entregas com nota 0, 1 ou 2 podem ser refeitas até a **semana 19**, com nota máxima 7,0.
O objetivo do portfólio é garantir que todos percorram o caminho técnico — não penalizar
quem levou mais tempo.
