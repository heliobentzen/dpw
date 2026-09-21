# M05 — Migrações: evoluir o banco com segurança

> **CH:** 3h (1h teórica · 2h prática) · **Semana 5** · **Pré-requisito:** M04

No M04, as entidades criaram o primeiro esquema. Agora o banco passa a ter histórico: cada
mudança de classe vira uma migração revisável, aplicável em qualquer ambiente e reversível
quando necessário.

## Objetivos

Ao final você será capaz de:

1. Explicar por que `synchronize` não deve ser usado em produção.
2. Gerar, revisar e aplicar migrações TypeORM.
3. Criar uma migração de dados sem perder registros existentes.
4. Executar e reverter migrações em desenvolvimento.
5. Conferir no PostgreSQL se o esquema aplicado corresponde às entidades.

## Sequência prática

1. Desligar `synchronize` e configurar a fonte de dados para migrações.
2. Alterar uma entidade do BiblioCom.
3. Gerar a migração e ler cada operação SQL produzida.
4. Aplicar a migração no PostgreSQL.
5. Simular uma migração de dados com registros existentes.
6. Reverter em ambiente de desenvolvimento e aplicar novamente.
7. Adicionar o comando de migração ao README e ao CI.

## Regra de trabalho

Migração é código de produção. Ela deve ser pequena, nomeada, versionada e testada em uma
cópia do banco antes de ser aplicada. Nunca apague ou edite uma migração que já foi aplicada;
crie outra que corrija o estado.

## Checklist de saída

- [ ] `synchronize` está desativado fora do desenvolvimento local
- [ ] Existe uma migração gerada e revisada no repositório
- [ ] A migração foi aplicada em banco vazio e em banco com dados
- [ ] O rollback foi testado em desenvolvimento
- [ ] O README documenta como aplicar migrações
- [ ] O CI verifica que o esquema pode ser criado do zero

## Entrega E1

Entregue o histórico de migrações do BiblioCom, uma explicação das decisões destrutivas ou
não reversíveis e a evidência de aplicação em PostgreSQL.
