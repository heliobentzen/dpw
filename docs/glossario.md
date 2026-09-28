# Glossário

Termos usados no material, na ordem em que costumam aparecer.

## Web e HTTP

**Cliente / Servidor** — Cliente é quem pede (navegador, app, `curl`); servidor é quem
responde. Toda a web é essa conversa.

**HTTP** — *HyperText Transfer Protocol*. Protocolo de texto, sem estado, que define o
formato da requisição e da resposta.

**HTTPS** — HTTP dentro de um túnel TLS. Garante confidencialidade e integridade em
trânsito; não garante que a aplicação seja segura.

**Requisição (request)** — Mensagem do cliente: método + caminho + cabeçalhos + corpo.

**Resposta (response)** — Mensagem do servidor: código de status + cabeçalhos + corpo.

**Método HTTP** — Verbo da requisição: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`,
`OPTIONS`.

**Idempotência** — Repetir a operação produz o mesmo estado final. `GET`, `PUT` e `DELETE`
são idempotentes; `POST` não é (daí o "não reenviar formulário" do navegador).

**Método seguro (*safe*)** — Não altera estado no servidor. `GET` e `HEAD` são seguros.

**Query string** — Parte da URL após `?`: `/busca?q=nestjs&pagina=2`. Visível, logada,
compartilhável — nunca coloque senha ali.

**Status code** — `2xx` sucesso, `3xx` redirecionamento, `4xx` erro do cliente, `5xx` erro
do servidor.

**Cabeçalho (header)** — Metadado da mensagem: `Content-Type`, `Cookie`, `Authorization`.

**Cookie** — Par chave-valor que o servidor pede ao navegador para guardar e reenviar.

**Sessão** — Estado do usuário mantido no servidor, identificado por um cookie
(no `express-session`, o cookie `connect.sid`).

**Statelessness** — HTTP não lembra requisições anteriores; sessão e token são as formas
de simular memória.

**DNS** — Traduz nome (`exemplo.com.br`) em endereço IP.

**Porta** — Número que identifica o serviço na máquina: 80 (HTTP), 443 (HTTPS), 3000
(NestJS em desenvolvimento), 5432 (PostgreSQL).

**Servidor de aplicação** — Processo que executa o seu código e responde a requisições. Em
Node, é o próprio `node dist/main.js`: não há um processo separado entre ele e o proxy.

**Proxy reverso** — Servidor à frente da aplicação (Nginx, load balancer da PaaS) que
termina TLS, serve estáticos e distribui carga.

## Framework e arquitetura

**Framework** — Conjunto de código que **chama o seu código** (inversão de controle),
oferecendo estrutura pronta. Diferente de biblioteca, que você chama.

**Arquitetura desacoplada** — Backend e cliente separados, conversando só por HTTP e JSON.
O backend não sabe se quem chama é navegador, app ou outro serviço (M02).

**C4 Model** — Forma de desenhar arquitetura em quatro níveis de zoom: **C**ontexto (o
sistema e quem o usa), **C**ontêineres (API, banco, cliente), **C**omponentes (módulos,
controllers, services) e **C**ódigo. Desenha-se em texto, com Mermaid, e o diagrama fica
versionado junto com o código (M02).

**Camadas** — Divisão de responsabilidades: **DTO** (formato), **controller** (HTTP),
**service** (regra de negócio), **repository** (dados). Critério do M03: *se o código não
mudaria vindo de um comando de terminal, é service*.

**Módulo (NestJS)** — Unidade que agrupa controllers e providers de um domínio e declara o
que expõe, pelas listas `imports`, `controllers` e `providers`. O `AppModule` é a raiz.

**Controller** — Classe que traduz HTTP em chamada de método: lê rota, parâmetros e corpo,
chama o service, devolve dados. Não guarda dados nem decide regra.

**Provider / Service** — Classe marcada com `@Injectable()` que concentra a regra de
negócio. Não sabe que HTTP existe.

**Injeção de dependência** — A classe declara **o que precisa** no construtor, e o
framework entrega pronto. Como uma tomada: o aparelho não sabe de que usina vem a energia,
só exige o padrão certo. Torna o teste barato e a troca de implementação indolor (M03).

**Decorator** — Função que **anexa informação** a uma classe, método ou parâmetro
(`@Controller`, `@Get`, `@Entity`, `@IsString`). O framework lê essas anotações na
inicialização. Não executa nada sozinho.

**Pipe** — Peça que roda **entre a requisição e o método**, convertendo ou validando a
entrada. Pode recusar sozinho com 400 (`ParseIntPipe`, `ValidationPipe`).

**Guard** — Peça que decide **se a requisição pode entrar**. Autenticação e papéis (M08).

**Middleware** — Camada que processa toda requisição antes do roteamento: cabeçalhos de
segurança, log, CORS (M09, M13).

**Interceptor** — Peça que envolve a execução do método, podendo moldar a resposta.

**`main.ts`** — Ponto de entrada: cria a aplicação, aplica prefixo, pipes e middlewares
globais, sobe o servidor.

**ESM** — *ECMAScript Modules*, o sistema de módulos oficial do JavaScript. No projeto do
Nest 12, todo `import` de arquivo próprio termina em `.js`, mesmo o arquivo sendo `.ts` (M03).

## Dados e ORM

**ORM** — *Object-Relational Mapper*. Traduz classes ↔ tabelas, objetos ↔ linhas,
atributos ↔ colunas.

**Entidade** — Classe marcada com `@Entity()` que descreve uma tabela. Cada `@Column` vira
uma coluna (M04).

**Repository** — Objeto que dá acesso aos dados de uma entidade (`find`, `save`, `delete`).
Injetado com `@InjectRepository(Entidade)` (M06).

**`synchronize`** — Modo do TypeORM que altera o banco a cada boot para casar com as
entidades. Útil para aprender; **proibido em produção**, porque pode apagar dados sem aviso.

**Migração (migration)** — Arquivo versionado que descreve uma mudança de esquema, com
`up()` para aplicar e `down()` para desfazer. É código, entra no Git e roda em ordem (M05).

**`migration:generate`** — Compara entidades × banco e **escreve** a migração. Não aplica.

**`migration:run` / `migration:revert`** — **Aplica** as pendentes / **desfaz** a última.

**Chave primária (PK)** — Identificador único da linha. `@PrimaryGeneratedColumn()` a cria.

**Chave estrangeira (FK)** — Referência a outra tabela; no TypeORM, o lado `@ManyToOne` a
carrega. Declarar `@Column() autorId` junto expõe a coluna ao TypeScript.

**Relação N-N** — `@ManyToMany` + `@JoinTable`; o TypeORM cria a tabela intermediária.

**`onDelete`** — O que acontece com os filhos quando o pai é apagado: `RESTRICT` (impede),
`CASCADE` (apaga junto), `SET NULL`. É decisão de negócio, não de banco.

**QueryBuilder** — API que monta consultas por encadeamento; boa para filtros opcionais e
agregações. Nada vai ao banco até `getMany()` ou `getOne()`.

**Problema N+1** — Uma consulta para a lista e mais uma por item. Corrige-se pedindo a
relação (`relations`), que o ORM resolve com `JOIN` (M06).

**Agregação** — Valor calculado pelo banco (`COUNT`, `AVG`), obtido com `addSelect` +
`groupBy`.

**Transação** — Bloco atômico: ou tudo é gravado, ou nada. `dataSource.transaction(...)`,
usando **sempre** o `manager` recebido lá dentro.

**Seed** — Script que popula o banco com dados de teste (`recursos/codigo/semear.ts`).

## Rotas, DTOs e contrato

**Roteamento** — Mapeamento de URL para método, feito pelos decorators `@Controller` e
`@Get`/`@Post`/`@Patch`/`@Delete`.

**Prefixo de rota** — Definido em `@Controller("obras")`; todas as rotas da classe partem
dele. O prefixo global (`/api`) é definido uma vez, em `main.ts`.

**Parâmetro de rota** — Trecho variável da URL (`/obras/:id`), lido com `@Param("id")`.
Rotas literais (`/obras/buscar`) devem ser declaradas **antes** das paramétricas.

**DTO** — *Data Transfer Object*: classe que descreve **o que entra** ou **o que sai** da
API, separada da entidade que descreve **o que é guardado** (M07).

**`ValidationPipe`** — Pipe global que lê os decorators do DTO e recusa com 400 o que não
bate. Com `whitelist`, descarta campos não declarados.

***Mass assignment*** — Falha em que o cliente grava campos que não deveria (`papel`,
`criadoEm`) porque a API aceitou o corpo inteiro. Impedida por DTO + `whitelist`.

**OpenAPI** — Formato padrão de descrição de API, legível por máquina. No curso é gerado
dos decorators (`openapi.json`) e exibido pelo Swagger UI em `/api/docs`.

**Contrato de API** — O acordo sobre recursos, rotas, formatos e erros. Escrito antes do
código (M02), verificado pelo CI depois (M10, M11).

## Autenticação e autorização

**Autenticação** — Quem é você (falha: `401`). **Autorização** — o que você pode fazer
(falha: `403`).

**Hash de senha** — Senha nunca é armazenada; guarda-se um hash lento (Argon2, bcrypt) que
já embute o *salt*.

**Sessão × token** — Sessão guarda o estado no servidor e manda só um identificador no
cookie; token (JWT) carrega os dados assinados no próprio cliente. Escolhe-se pelo modelo de
ameaça, não pela moda (M08).

**Cookie `HttpOnly`** — Cookie que o JavaScript da página não consegue ler. Protege a sessão
contra roubo por XSS.

**Papel (role)** — Conjunto de permissões atribuído a usuários (associado, bibliotecário,
coordenação).

**Autorização por objeto** — Verificar não só o papel, mas se **aquele registro** pertence a
quem pede. É o que impede IDOR.

## Segurança

**OWASP Top 10** — Lista de referência das dez classes de risco mais críticas em
aplicações web.

**Injeção de SQL** — Entrada do usuário interpretada como SQL. Parâmetros nomeados
(`:termo`) protegem; montar consulta com crase ou `+`, não (M06).

**XSS** — *Cross-Site Scripting*: script do atacante executado no navegador da vítima. Na
API, o risco é devolver HTML sem escapar ou aceitar arquivo que o navegador execute.

**CSRF** — *Cross-Site Request Forgery*: site malicioso dispara ação autenticada no seu
site. Mitigado por `SameSite=Lax` no cookie de sessão e por token anti-CSRF nas rotas de escrita.

**IDOR** — *Insecure Direct Object Reference*: acessar `/pedido/42/` de outra pessoa
trocando o número. Autorização por objeto resolve.

**Enumeração de usuários** — Mensagens que revelam se um e-mail existe.

**Rate limiting** — Limitar tentativas por IP/usuário (defesa contra força bruta).

**HSTS** — Cabeçalho que força HTTPS nas visitas seguintes.

**CSP** — *Content Security Policy*: define de onde scripts e estilos podem vir.

**LGPD** — Lei Geral de Proteção de Dados (Lei 13.709/2018): base legal, minimização,
finalidade, direitos do titular.

## Testes, deploy e operação

**Teste unitário / de integração / e2e** — Testam uma unidade isolada (um service com
dublês) / a combinação de peças (service + banco) / o fluxo HTTP inteiro (Supertest).

**Dublê de teste (mock)** — Objeto falso injetado no lugar de uma dependência real. É a
injeção de dependência pagando dividendo (M10).

**Fixture** — Preparação reutilizável para testes; no Vitest, `beforeEach` e funções de apoio.

**Cobertura** — Percentual de linhas executadas pelos testes. Métrica de apoio, não meta.

**CI / CD** — Integração contínua (testes automáticos a cada push) / entrega contínua
(deploy automático).

**Variável de ambiente** — Configuração vinda do sistema, fora do código.

**`NODE_ENV`** — Indica o ambiente (`development`, `test`, `production`). Em produção, o
Nest deixa de devolver detalhes internos nos erros.

**Validação de ambiente** — Conferir as variáveis na inicialização e **não subir** se
faltar alguma. Melhor falhar alto no boot do que pela metade em produção (M03).

**Healthcheck** — Rota que diz se a aplicação e suas dependências estão de pé. A plataforma
a consulta para decidir se reinicia o serviço (M12, M13).

**`node dist/main.js`** — Como a aplicação sobe em produção. É o mesmo comando em Windows,
macOS, Linux e na plataforma de hospedagem — não há servidor de produção separado.

**PaaS** — *Platform as a Service*: você entrega código, a plataforma cuida de servidor,
TLS e banco.

**Migração zero-downtime** — Estratégia de alterar o esquema sem derrubar a aplicação
(expandir → migrar dados → contrair).

**Log estruturado** — Log em formato de dados (JSON), pesquisável por campo.

**Backup / restore** — Cópia dos dados / **teste de restauração**. Backup nunca testado
não é backup.

## Projeto e extensão

**Extensão universitária** — Processo interdisciplinar que promove interação
transformadora entre instituição e sociedade; exige demanda real, dialogicidade e impacto
verificável. Não é estágio, não é visita técnica e não é palestra.

**Organização parceira** — Entidade externa (ONG, escola, associação, órgão público) que
apresenta a demanda e recebe a entrega.

**Carta de anuência** — Documento em que a organização concorda em participar.

**Relato de experiência** — Registro reflexivo da ação extensionista: contexto, ação,
resultados, aprendizados.

**MVP** — *Minimum Viable Product*: menor recorte que já resolve o problema central.

**Backlog** — Lista priorizada do que fazer, escrita em linguagem do usuário.

**História de usuário** — "Como \<papel\>, quero \<ação\> para \<benefício\>".

**Critério de aceite** — Condição objetiva que define quando a história está pronta.

**Definition of Done (DoD)** — Padrão de qualidade que toda entrega deve cumprir.
