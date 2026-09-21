# M13 — Segurança de APIs

> **CH:** 5h (3h teóricas · 2h práticas) · **Semana 13** · **Pré-requisitos:** M07, M12
> **Ementa:** tópicos relevantes de segurança

Segurança não é uma etapa decorativa depois do CRUD. Neste módulo, as ameaças são ligadas
diretamente às entradas, respostas, autorização e operação da API.

## Objetivos

1. Aplicar princípios do OWASP Top 10 a endpoints NestJS.
2. Validar entrada, limitar recursos e parametrizar consultas.
3. Evitar IDOR, exposição excessiva de dados e upload inseguro.
4. Proteger segredos, cabeçalhos, CORS e mensagens de erro.
5. Registrar riscos e evidências de correção no projeto.

## Sequência prática

1. Revisar o modelo de ameaça e os ativos do sistema.
2. Conferir `ValidationPipe`, limites de paginação e tamanho de requisição.
3. Testar autorização por objeto: um usuário não acessa o registro de outro.
4. Auditar DTOs de saída para remover dados pessoais e segredos.
5. Corrigir SQL não parametrizado e validar uploads por tamanho, tipo e conteúdo.
6. Configurar CORS restritivo, Helmet, rate limiting e tratamento de erros.
7. Executar `npm audit`, revisar dependências e atualizar o checklist OWASP.

## Princípios

- Toda entrada é não confiável: URL, query, JSON, cabeçalho e arquivo.
- Autenticação não substitui autorização.
- O backend nunca confia em uma validação feita por um cliente.
- Logs não devem conter senhas, tokens ou dados pessoais desnecessários.
- A documentação Swagger mostra o contrato, não segredos de ambiente.

## Checklist de saída

- [ ] DTOs rejeitam entrada inválida e campos inesperados
- [ ] Paginação, upload e payload têm limites explícitos
- [ ] Autorização por objeto foi testada
- [ ] DTOs de saída minimizam dados pessoais
- [ ] CORS e cabeçalhos estão configurados para a implantação
- [ ] Dependências foram auditadas
- [ ] Não há segredo no repositório nem nos logs

## Entrega E6

Entregue o checklist OWASP aplicado à API, a matriz de ameaças, evidências dos testes de
segurança e a lista de correções realizadas.
