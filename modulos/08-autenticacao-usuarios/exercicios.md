# M08 — Exercícios

## E08.1 — Modelo de ameaça: sessão ou token (individual)

Uma prefeitura quer que o **sistema de matrículas dela** consulte a API do BiblioCom toda
noite, para saber quais alunos têm empréstimo em atraso. Não há navegador nem pessoa
digitando senha.

1. A sessão em cookie da etapa 6 serve para esse cliente? Por quê?
2. Proponha o mecanismo de autenticação para ele e compare com a sessão em três linhas:
   como se revoga, o que acontece se vazar, onde fica guardado.
3. Escreva o ADR curto dessa decisão (contexto, decisão, consequências).

> Não é preciso implementar. O exercício é escolher sabendo o porquê.

---

## E08.2 — Matriz de autorização (individual) ⭐

Acrescente as rotas de **exemplares** à matriz da etapa 13 e decida, para cada uma, quem
pode o quê:

| Rota | Anônimo | Bibliotecário | Coordenação |
|---|:---:|:---:|:---:|
| `GET /api/exemplares` | | | |
| `POST /api/exemplares` | | | |
| `PATCH /api/exemplares/:id` | | | |
| `DELETE /api/exemplares/:id` | | | |

**Verificação:**

- [ ] Toda célula tem justificativa **de negócio** em uma linha
- [ ] Os guards foram aplicados e cada célula conferida com `curl.exe -o NUL -w "%{http_code}"`
- [ ] Pelo menos uma célula `401` e uma `403` conferidas

---

## E08.3 — Não vazar segredo (individual)

Percorra **todas** as respostas que envolvem usuário — login, `GET /api/sessao`,
`POST /api/usuarios` e as mensagens de erro — e liste cada campo que aparece.

1. Algum campo não deveria estar lá?
2. Remova o `select: false` do `senhaHash` e repita. O que mudou, e em quais respostas?
3. Devolva o `select: false` e explique, em três linhas, por que ele é uma segunda barreira e
   não a única.

---

## E08.4 — Enumeração de usuários (individual)

1. Altere o `validar` para responder `"E-mail não cadastrado"` quando o usuário não existir.
2. Escreva os dois `curl.exe` que provam que, agora, dá para descobrir quais e-mails estão
   cadastrados.
3. Desfaça. Depois, meça o tempo das duas respostas com `-w "%{time_total}"`. Elas levam o
   mesmo tempo? O que o tempo poderia revelar, mesmo com a mensagem igual?

---

## E08.5 — Desativar sem apagar (em duplas)

Implementem `PATCH /api/usuarios/:id` (só coordenação) que liga e desliga o campo `ativo`.

**Verificação:**

- [ ] Usuário desativado não consegue mais entrar
- [ ] O histórico de empréstimos registrados por ele continua no banco
- [ ] A coordenação **não** consegue desativar a si mesma (qual status?)

E respondam: quem já estava logado quando foi desativado continua com acesso até a sessão
expirar? Como o `AutenticadoGuard` resolveria isso, e quanto custaria?

---

## E08.6 — Fixação de sessão (individual)

1. Comente a linha do `regenerate` no login.
2. Com `curl.exe -c antes.txt`, faça uma requisição qualquer que crie sessão — ou, se nenhuma
   criar, explique por quê, olhando o `saveUninitialized`.
3. Faça login enviando `-b antes.txt -c depois.txt` e compare os identificadores dos dois
   arquivos, com e sem o `regenerate`.

---

## Gabarito parcial

**E08.1** — (1) Não bem: não há pessoa para digitar senha nem navegador para guardar
cookie, e sessão de oito horas não combina com uma tarefa noturna. (2) Uma chave de API
(*API key*) por cliente, guardada com hash como a senha, enviada no cabeçalho e revogável
individualmente; ou um token de curta duração obtido com credenciais de máquina. Se vazar,
revoga-se aquela chave sem afetar os usuários humanos.

**E08.3** — (2) Com `select: false` removido, o `findOneBy` do `buscar` passa a trazer o
hash; se alguma rota devolver a entidade inteira, ele sai na resposta. (3) A primeira
barreira é montar a resposta com os campos escolhidos; o `select: false` protege quando
alguém esquece a primeira.

**E08.4** — (3) Com o e-mail inexistente, o `argon2.verify` nem roda, e a resposta volta
mais rápido. A diferença de tempo denuncia o e-mail mesmo com a mensagem igual. Mitigação
comum: rodar uma verificação contra um hash fictício quando o usuário não existe.

**E08.5** — Desativar a si mesma: `422` (a requisição é válida, a regra de negócio a
proíbe). Quem já estava logado continua até a sessão expirar, porque o guard só olha a
sessão. Resolver exige consultar o usuário a cada requisição — uma ida ao banco a mais em
toda rota protegida.

**E08.6** — Sem o `regenerate`, o identificador de antes do login continua valendo depois
dele: quem conhecia o identificador "antes" passa a estar logado junto. Com o
`saveUninitialized: false`, nenhuma requisição anônima cria sessão — o que já reduz a
superfície do ataque, mas não o elimina.
