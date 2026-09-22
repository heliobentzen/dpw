# M11 — Tipos compartilhados e contrato OpenAPI

> **CH:** 2h (1h teórica · 1h prática) · **Semana 11** · **Pré-requisito:** M10

Uma API profissional não é apenas um conjunto de rotas: ela tem um contrato que clientes,
testes e equipes conseguem consultar. Neste módulo, o schema gerado pelo Swagger vira um
artefato versionado e verificável.

## Objetivos

Ao final você será capaz de:

1. Diferenciar documentação visual do Swagger UI e schema OpenAPI.
2. Versionar o `openapi.json` junto com a API.
3. Revisar mudanças de contrato antes de aprová-las.
4. Identificar mudanças compatíveis, incompatíveis e que exigem nova versão.
5. Testar um consumidor externo com base no contrato, sem ler o código interno.

## Por que este módulo vem depois dos testes

O M10 verifica se a implementação atual funciona. O M11 verifica se ela continua prometendo
para os consumidores aquilo que o contrato público declara. São garantias diferentes e ambas
são necessárias.

Neste ponto, o aluno deixa de tratar o Swagger como uma tela de consulta e passa a tratá-lo como
artefato de engenharia:

- uma mudança de DTO passa a ter impacto observável;
- o schema pode ser revisado em um diff;
- o CI consegue impedir divergências antes da integração;
- um consumidor externo pode usar a API sem conhecer o código interno.

> A competência nova é pensar em compatibilidade. Uma API madura não é apenas aquela que funciona
hoje, mas aquela que consegue evoluir sem surpreender quem depende dela.

## Sequência prática

1. Gerar o schema com `npm run gerar:schema`.
2. Conferir no Swagger UI os endpoints, parâmetros, respostas e erros.
3. Alterar um DTO e revisar o diff do `openapi.json`.
4. Classificar a mudança como compatível ou incompatível.
5. Adicionar ao CI uma verificação que falha quando o schema gerado diverge do commitado.
6. Exercitar a API com Bruno, Insomnia ou `curl`, usando apenas o contrato público.

## Regra de compatibilidade

Adicionar um campo opcional costuma ser compatível. Remover ou renomear um campo, mudar seu
tipo ou alterar o significado de um status pode quebrar consumidores. Toda mudança deve ter
uma decisão registrada e, quando necessário, uma versão nova da API.

## Checklist de saída

- [ ] Swagger UI lista rotas, parâmetros, exemplos e erros principais
- [ ] `openapi.json` foi gerado e versionado
- [ ] Uma mudança de DTO aparece no diff do contrato
- [ ] O CI detecta schema desatualizado
- [ ] Um cliente externo consumiu a API sem importar código interno
- [ ] Mudanças incompatíveis têm decisão de versionamento

## Entrega

Entregue o schema atualizado, a evidência da verificação no CI e um registro curto de uma
mudança compatível e uma incompatível.
