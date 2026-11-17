# Checklist de entrega

Percorra **na véspera**, não na hora. Os itens seguem as [rubricas](../../avaliacao/); os
marcados com ⛔ são pré-requisito ou eliminatórios.

## Todas as entregas

- [ ] A rubrica foi lida e usada como guia
- [ ] Nomes completos e matrículas de todos os integrantes
- [ ] Links funcionam para quem **não** está logado na conta de vocês
- [ ] O docente tem acesso ao repositório da equipe
- [ ] Nenhum dado pessoal de terceiros exposto (prints anonimizados)
- [ ] Entregue **antes** do prazo, não no minuto final

---

## P1 — Definição e planejamento (semana 4)

- [ ] ⛔ Contrato de equipe com papéis e *Definition of Done*
- [ ] ⛔ Tema voltado à comunidade, diferente do das outras equipes
- [ ] Problema em uma frase: quem, o quê, como é hoje, qual consequência — com fontes
- [ ] 2–3 personas coerentes com a pesquisa e o cenário principal passo a passo
- [ ] MVP com até 6 funcionalidades e a coluna "não faremos" preenchida
- [ ] Metas numéricas, com a forma de medir no teste com usuário
- [ ] Backlog com critérios de aceite, estimativas e MoSCoW
- [ ] Entidades e relações, contrato inicial (`docs/api.md`) e quem pode fazer o quê
- [ ] Sprints até a semana 18 e 3–5 riscos com plano B

## P2 — Sistema preliminar (semana 10)

- [ ] ⛔ Repositório da equipe acessível
- [ ] ⛔ Migrações aplicam sem erro num banco vazio
- [ ] ⛔ O cenário principal da P1 funciona de ponta a ponta
- [ ] 5+ entidades com 1-N e N-N; `docs/modelo-de-dados.md` com as decisões justificadas
- [ ] CRUD completo em 2+ recursos, com DTOs de entrada e saída
- [ ] Validação com `whitelist`; paginação com teto; `docs/consultas.md` sem N+1
- [ ] Lint limpo; regra de negócio no *service*; todos commitaram por PR
- [ ] Dados de exemplo (fictícios) para a demonstração

## P3 — Sistema final (semana 18)

- [ ] ⛔ **API no ar, testada hoje** (não "funcionava ontem"), com HTTPS
- [ ] ⛔ Login com 2+ papéis funcionando em produção
- [ ] ⛔ Nenhuma operação sem a autorização adequada
- [ ] ⛔ Testes automatizados verdes no CI
- [ ] Todas as histórias *Must* funcionando
- [ ] `/api/docs` com erros documentados e `openapi.json` conferido no CI
- [ ] Matriz de acesso testada; teste de IDOR
- [ ] `docs/seguranca.md` com as falhas encontradas e corrigidas
- [ ] Nenhum segredo no repositório (confira também o histórico)
- [ ] `/health`, backup restaurado com sucesso, `docs/deploy.md` e `docs/manutencao.md`
- [ ] Teste com usuário (alguém de fora da equipe) registrado em `docs/teste-usuario.md`

## P4 — Relatório e encerramento (semanas 19–20)

- [ ] ⛔ Relatório entregue e apresentação realizada, com todos falando
- [ ] ⛔ Avaliação por pares preenchida por **todos**
- [ ] Decisões técnicas justificadas com as alternativas (ADRs)
- [ ] Metas da P1 comparadas com o medido no teste com usuário; metas não alcançadas analisadas
- [ ] Bugs conhecidos e uso de IA declarados
- [ ] Termo de transferência preenchido: contas, como trocar senhas, custo mensal, backup

## ➕ Trilha opcional de parceria (bônus)

- [ ] Aceite por escrito da organização; 2+ encontros registrados em ata
- [ ] Problema e cenário validados com a organização
- [ ] Visita ao local com o `/health` aberto no equipamento de lá (semana 14)
- [ ] Sistema em uso no equipamento da organização, com capacitação mão na massa
- [ ] Contas e custos transferidos; termo de transferência assinado
- [ ] Autorizações de imagem colhidas; evidências anonimizadas
- [ ] Devolutiva com a fala da organização registrada; relato de experiência

---

## Na véspera da apresentação

- [ ] Acessar a URL da API de outra rede (celular com 4G)
- [ ] Testar as credenciais que serão usadas na demonstração
- [ ] Popular a API com dados realistas (e fictícios)
- [ ] Testar o vídeo de demonstração (plano B)
- [ ] Combinar quem fala o quê e cronometrar um ensaio
- [ ] Testar a apresentação no equipamento da sala
