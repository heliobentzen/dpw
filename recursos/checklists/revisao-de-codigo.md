# Checklist de revisão de código (Pull Request)

Para usar na Etapa 2 do projeto. Uma revisão leva de 15 a 30 minutos; PR que exige mais que
isso está grande demais e deveria ser dividido.

> Revisar código é como a segunda leitura de um contrato antes de assinar: quem escreveu
> lê o que quis dizer; quem revisa lê o que está escrito.

## Antes de tudo

- [ ] O PR tem descrição: o que muda, como testar, quais critérios de aceite cobre
- [ ] Está vinculado a uma issue/história
- [ ] O CI está verde
- [ ] O diff tem menos de ~400 linhas (fora migrações e arquivos gerados)

## Funcionalidade

- [ ] Faz o que a história pede?
- [ ] Os critérios de aceite estão todos cobertos?
- [ ] Os caminhos de erro foram tratados (entrada inválida, recurso inexistente, sem permissão)?
- [ ] A lista vazia foi tratada (devolve `{"itens":[],"total":0,...}`, não erro)?

## Testes

- [ ] Há teste para a regra de negócio nova?
- [ ] O teste falharia se a regra fosse quebrada? (pergunte-se: qual mutação ele pega?)
- [ ] Há teste do caminho de erro, não só do caminho feliz?
- [ ] Nenhum teste depende da data real, de rede ou da ordem de execução?

## Entidades e migrações

- [ ] Regra de negócio está no service, não no controller?
- [ ] `onDelete` adequado ao significado de negócio da relação?
- [ ] Migração gerada, nomeada e **lida** (o SQL, não só o nome do arquivo)?
- [ ] A migração tem `down()` que desfaz de verdade o `up()`?
- [ ] Coluna nova obrigatória em tabela com dados usa expandir → migrar → contrair?

## Consultas

- [ ] Algum laço que dispara uma consulta por item? (N+1 — use `relations` ou `leftJoinAndSelect`)
- [ ] Algum `count()` ou `findOne()` dentro de laço?
- [ ] Filtro por relação N-N devolvendo linhas repetidas?
- [ ] Contador lido e reescrito na aplicação, em vez de `UPDATE ... SET x = x + 1`?
- [ ] Listagem sem paginação, ou paginação sem teto?

## Controllers e rotas

- [ ] O verbo HTTP combina com o efeito (`GET` nunca altera dados)?
- [ ] O status de resposta é o do contrato (201 no `POST`, 204 no `DELETE`)?
- [ ] Rotas de escrita cobertas por guard (`@UseGuards`)?
- [ ] Rota literal (`/obras/destaques`) declarada **antes** da rota com parâmetro (`/obras/:id`)?
- [ ] Recurso inexistente vira `NotFoundException`, não `null` com status 200?
- [ ] Todo `@Body()` usa uma classe DTO, e toda resposta passa por DTO de saída?
- [ ] O Swagger documenta as respostas de erro, não só a de sucesso?

## Segurança

- [ ] A rota exige autenticação onde deveria?
- [ ] A rota exige o papel certo onde deveria?
- [ ] A consulta é filtrada pelo usuário autenticado (sem IDOR)?
- [ ] Campos sensíveis definidos no servidor, não vindos do corpo?
- [ ] Nenhum SQL montado com template string?
- [ ] Nenhuma credencial, token ou dado real de pessoa no diff?

## Legibilidade

- [ ] Os nomes dizem o que a coisa é? (`obrasDisponiveis` > `lista2`)
- [ ] Alguma função com mais de ~40 linhas ou 3 níveis de indentação?
- [ ] Alguma duplicação óbvia que pediria extração?
- [ ] Comentários explicam **por quê**, não **o quê**?
- [ ] Nenhum `console.log`, código comentado ou `TODO` sem issue?

## Código gerado com IA

- [ ] Quem abriu o PR consegue explicar cada linha, sem reabrir o assistente?
- [ ] Os pacotes importados existem e são os oficiais (IA inventa nomes plausíveis)?
- [ ] As APIs usadas existem **na versão do projeto** (NestJS 12, TypeORM 1.x)?
- [ ] Há teste que prova o comportamento, e não só código que "parece certo"?

---

## Como comentar

| ❌ | ✅ |
|---|---|
| "Isso está errado." | "Aqui pode dar N+1 na listagem — que tal `relations: { autor: true }`?" |
| "Código ruim." | "Essa função faz três coisas; extrair a regra para o service deixaria mais fácil de testar." |
| "Você não sabe fazer isso?" | "Não conhecia essa abordagem — pode me explicar por que escolheu assim?" |

Classifique cada comentário:

- **Bloqueante** — precisa mudar antes do merge (bug, falha de segurança, teste ausente)
- **Sugestão** — melhoraria, mas não bloqueia
- **Dúvida** — quero entender
- **Elogio** — sim, use; revisão só com críticas desgasta a equipe

Revisão é sobre o código, nunca sobre a pessoa. Quem escreveu está lendo, e vai revisar o
seu PR amanhã.
