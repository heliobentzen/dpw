# M08 — Autenticação e autorização na API

> **Pré-requisito:** M07 · **Duração:** longa · **Semanas:** 9–10
> **Ementa:** *Gestão de usuários.*
> **No projeto:** login, papéis e rotas protegidas na API da equipe · P3 (critério 3, eliminatório)

## Por que este módulo existe no projeto

Até aqui, qualquer pessoa com o endereço da API pode criar, alterar e apagar tudo. Na semana
14 essa API estará na internet, com **dados de pessoas reais** da organização. A P3 é
eliminatória se não houver autenticação ou se a API aceitar operação sem a autorização
adequada.

A coluna **"Quem pode"** do `docs/api.md` (M02) vira código neste módulo. Cada tipo de
usuário das personas da P1 vira um **papel**, e cada rota passa a responder
duas perguntas antes de executar: *quem é você?* e *você pode?*

## 🎯 Ao final do módulo

1. A API da equipe tem login e logout, com senhas guardadas com hash.
2. Cada rota exige o papel certo: `401` para anônimo, `403` para papel sem permissão.
3. A equipe registrou num ADR a escolha entre sessão e token.

---

## 📖 Conceitos

### 1. Três perguntas diferentes

Pense na **portaria de um prédio**:

| Na portaria | Na API | Pergunta | Falha |
| --- | --- | --- | --- |
| Documento → crachá | **Autenticação** | Quem é você? | **401** |
| A catraca de cada andar | **Autorização** | Você pode fazer isto? | **403** |
| O livro de registro | **Auditoria** | Quem fez o quê? | (M13) |

> ⚠️ O nome do 401 engana: *Unauthorized* significa **não autenticado**. O "sem permissão"
> é o **403**.

### 2. Senha: hash lento, nunca criptografia

Hash é um **moedor de carne**: dá para moer, não dá para "desmoer". No login, a API mói o que
a pessoa digitou e compara as massas — nunca lê a senha de volta.

| Como a senha foi guardada | O que um vazamento do banco entrega |
| --- | --- |
| Texto puro | Todas as senhas, prontas para usar aqui e onde a pessoa repetiu |
| Criptografada | Todas, assim que acharem a chave (geralmente no mesmo servidor) |
| **Argon2** (lento, com sal) | Um trabalho enorme por senha |

SHA-256 e MD5 **não** são hash de senha: são rápidos, e rapidez aqui é defeito.

### 3. Sessão ou token

| | **Sessão em cookie** | **Token (JWT)** |
| --- | --- | --- |
| Analogia | A **comanda** de um restaurante: um número, a conta fica no caixa | A **pulseira** de um show: os dados estão nela, com um selo |
| Logout | Apaga no servidor: efeito imediato | O token vale até expirar |
| Ponto fraco | Precisa guardar sessões no servidor; cookie exige cuidado com CSRF (M09) | Roubou o token, roubou a identidade até ele expirar |

**A escolha deste curso: sessão em cookie `HttpOnly`**, guardada no PostgreSQL a partir do
M12. Motivos: o logout funciona de verdade (computadores compartilhados são comuns nas
organizações parceiras), o JavaScript não lê o cookie, e o `/api/docs` funciona com login sem
código extra. Token seria a escolha certa para um app móvel ou integração entre sistemas. O
que não é aceitável é escolher sem saber por quê.

### 4. Guards: a catraca do Nest

Um **guard** roda **antes** do método do controller e responde uma pergunta: *deixo passar?*
Vocês vão escrever dois: um que exige login (401) e um que exige papel (403). **A ordem
importa**: primeiro "quem é você?", depois "você pode?".

---

## 🧩 No projeto da equipe

Antes de codar, **definam os papéis** a partir dos tipos de usuário da P1 e completem a
**matriz de acesso** no `docs/api.md`:

| Rota | Anônimo | `operador` | `coordenacao` |
| --- | :---: | :---: | :---: |
| `GET /api/<recurso>` | ? | 200 | 200 |
| `POST /api/<recurso>` | 401 | 201 | 201 |
| `DELETE /api/<recurso>/:id` | 401 | 403 | 204 |
| `POST /api/usuarios` | 401 | 403 | 201 |

Nos exemplos abaixo os papéis se chamam `OPERADOR` e `COORDENACAO`. **Troquem pelos da
organização** (recepção, voluntário, coordenação...). A P3 exige pelo menos 2.

### Passo 1 — A entidade `Usuario`

```bash
nest generate module auth
nest generate service auth --no-spec
nest generate controller auth --no-spec
npm install argon2
```

`src/auth/usuario.entity.ts`:

```ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum Papel {
  OPERADOR = "operador",
  COORDENACAO = "coordenacao",
}

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 150 }) nome: string;
  @Column({ length: 200, unique: true }) email: string;
  @Column({ select: false }) senhaHash: string;
  @Column({ type: "enum", enum: Papel, default: Papel.OPERADOR }) papel: Papel;
  @Column({ type: "boolean", default: true }) ativo: boolean;
  @CreateDateColumn() criadoEm: Date;
}
```

| Decisão | Por quê |
| --- | --- |
| `select: false` no hash | Nenhum `find` traz a coluna; só o login pede explicitamente |
| `default` = papel com **menos** poder | Esquecer de informar o papel nunca promove ninguém |
| `ativo` em vez de apagar | Desliga alguém sem quebrar o histórico de quem fez o quê |

Registrem em `TypeOrmModule.forFeature([Usuario])` no `AuthModule`, e o ciclo do M05:
`migration:generate src/migracoes/CriaUsuario` → **ler** → `migration:run`.

### Passo 2 — Criar e validar senhas

`src/auth/auth.service.ts`:

```ts
@Injectable()
export class AuthService {
  constructor(@InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>) {}

  async criar(nome: string, email: string, senha: string, papel: Papel) {
    if (await this.usuarios.existsBy({ email })) throw new ConflictException("Já existe usuário com este e-mail");
    const senhaHash = await argon2.hash(senha);
    return this.usuarios.save(this.usuarios.create({ nome, email, senhaHash, papel }));
  }

  async validar(email: string, senha: string) {
    const usuario = await this.usuarios.findOne({
      where: { email, ativo: true },
      select: { id: true, nome: true, email: true, papel: true, senhaHash: true },
    });
    const confere = usuario ? await argon2.verify(usuario.senhaHash, senha) : false;
    if (!usuario || !confere) throw new UnauthorizedException("E-mail ou senha inválidos");
    return usuario;
  }

  buscar(id: number) {
    return this.usuarios.findOneBy({ id, ativo: true });
  }
}
```

**Uma mensagem só** para e-mail inexistente e senha errada: mensagens diferentes ensinariam
ao atacante quais e-mails estão cadastrados.

### Passo 3 — O primeiro usuário

Para criar usuários pela API é preciso estar logado; para estar logado, é preciso um
usuário. A saída é um script. Em `backend/.env` (só desenvolvimento):

```ini
ADMIN_EMAIL=coordenacao@exemplo.org
ADMIN_SENHA=troque-esta-senha-longa
```

`src/seed-admin.ts`:

```ts
import "dotenv/config";
import * as argon2 from "argon2";
import fonte from "./data-source.js";

const email = process.env.ADMIN_EMAIL;
const senha = process.env.ADMIN_SENHA;
if (!email || !senha || senha.length < 12) {
  console.error("Defina ADMIN_EMAIL e ADMIN_SENHA (mínimo de 12 caracteres)");
  process.exit(1);
}
await fonte.initialize();
await fonte.query(
  `INSERT INTO "usuario" ("nome", "email", "senhaHash", "papel") VALUES ($1, $2, $3, 'coordenacao')
   ON CONFLICT ("email") DO NOTHING`,
  ["Coordenação", email, await argon2.hash(senha)],
);
await fonte.destroy();
console.log(`Usuário de coordenação pronto: ${email}`);
```

No `package.json`: `"seed:admin": "node dist/seed-admin.js"`. Rode `npm run build && npm run
seed:admin`. O `ON CONFLICT DO NOTHING` torna o script **idempotente**: o M12 o roda em
produção.

### Passo 4 — Ligar a sessão

```bash
npm install express-session
npm install -D @types/express-session
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ponham o valor gerado em `SESSION_SECRET` no `.env` e **no esquema do `validate`** (senão ele
é descartado e o erro é `secret option required for sessions`):

```ts
SESSION_SECRET: z.string("SESSION_SECRET é obrigatória").min(32, "SESSION_SECRET precisa de 32+ caracteres"),
```

Em `main.ts`:

```ts
import session from "express-session";

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,                            // sessão só nasce no login
    cookie: {
      httpOnly: true,                                    // JavaScript não lê o cookie
      sameSite: "lax",                                   // não vai em escrita vinda de outro site
      secure: process.env.NODE_ENV === "production",     // só HTTPS em produção
      maxAge: 8 * 60 * 60 * 1000,                        // um turno de trabalho
    },
  }),
);
```

`src/auth/sessao.d.ts` — ensina ao TypeScript o que vai na sessão:

```ts
import "express-session";
import { Papel } from "./usuario.entity.js";

declare module "express-session" {
  interface SessionData {
    usuarioId: number;
    papel: Papel;
  }
}
```

> Por enquanto as sessões ficam na memória: reiniciou a API, todos precisam entrar de novo.
> No M12 elas passam para o PostgreSQL.

### Passo 5 — Login, quem sou eu, logout

`src/auth/login.dto.ts` com `@IsEmail() email` e `@IsString() @Length(1, 200) senha`. Depois,
`src/auth/auth.controller.ts`:

```ts
@ApiTags("sessao")
@Controller("sessao")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post()
  @HttpCode(200)
  async entrar(@Body() dto: LoginDto, @Req() req: Request) {
    const usuario = await this.auth.validar(dto.email, dto.senha);
    // Troca o id da sessão no login: impede "session fixation".
    await new Promise<void>((ok, falha) => req.session.regenerate((e) => (e ? falha(e) : ok())));
    req.session.usuarioId = usuario.id;
    req.session.papel = usuario.papel;
    return { id: usuario.id, nome: usuario.nome, papel: usuario.papel };
  }

  @Get()
  @UseGuards(AutenticadoGuard)
  async quemSou(@UsuarioAtual() usuarioId: number) {
    const u = await this.auth.buscar(usuarioId);
    return u && { id: u.id, nome: u.nome, papel: u.papel };
  }

  @Delete()
  @HttpCode(204)
  async sair(@Req() req: Request) {
    await new Promise<void>((ok, falha) => req.session.destroy((e) => (e ? falha(e) : ok())));
  }
}
```

(`Request` vem de `import type { Request } from "express"`.) O recurso é a **sessão**: entrar
cria uma, sair apaga.

### Passo 6 — Os guards e os papéis

`src/auth/autenticado.guard.ts`:

```ts
@Injectable()
export class AutenticadoGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.session.usuarioId) throw new UnauthorizedException("Faça login para continuar");
    return true;
  }
}
```

`src/auth/usuario-atual.decorator.ts`:

```ts
export const UsuarioAtual = createParamDecorator((_: unknown, ctx: ExecutionContext) =>
  ctx.switchToHttp().getRequest<Request>().session.usuarioId,
);
```

`src/auth/papeis.decorator.ts` e `src/auth/papeis.guard.ts`:

```ts
export const CHAVE_PAPEIS = "papeis";
export const Papeis = (...papeis: Papel[]) => SetMetadata(CHAVE_PAPEIS, papeis);
```

```ts
@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Papel[]>(CHAVE_PAPEIS, [ctx.getHandler(), ctx.getClass()]);
    if (!exigidos) return true;
    const { papel } = ctx.switchToHttp().getRequest<Request>().session;
    if (!papel || !exigidos.includes(papel)) throw new ForbiddenException("Seu papel não permite esta ação");
    return true;
  }
}
```

Apliquem **em todas as rotas** seguindo a matriz de acesso:

```ts
@Delete(":id")
@UseGuards(AutenticadoGuard, PapeisGuard)   // nesta ordem: 401 antes de 403
@Papeis(Papel.COORDENACAO)
@HttpCode(204)
async remover(/* ... */) { /* ... */ }
```

> 💡 Guard **na classe** vale para todas as rotas dela: uma rota nova herda a proteção, e
> esquecer não abre brecha. Prefiram assim e abram exceções no método.

### Passo 7 — Cadastro de usuários pela coordenação

`src/auth/criar-usuario.dto.ts` (`nome`, `@IsEmail() email`, `@Length(12, 200) senha`,
`@IsEnum(Papel) papel`) e `src/auth/usuarios.controller.ts` com guards e
`@Papeis(Papel.COORDENACAO)` **na classe**. Registrem o controller no `AuthModule`.
A resposta **nunca** inclui o hash.

### Passo 8 — Conferir a matriz

Para cada célula da matriz de acesso, um `curl` (`-c` grava o cookie do login, `-b` envia):

```bash
curl -s -c coord.txt -X POST http://localhost:3000/api/sessao \
     -H "Content-Type: application/json" -d '{"email":"coordenacao@exemplo.org","senha":"troque-esta-senha-longa"}'
curl -s -o /dev/null -w "%{http_code}\n" -b coord.txt -X DELETE http://localhost:3000/api/<recurso>/1
```

```powershell
curl.exe -s -c coord.txt -X POST http://localhost:3000/api/sessao -H "Content-Type: application/json" -d '{\"email\":\"coordenacao@exemplo.org\",\"senha\":\"troque-esta-senha-longa\"}'
curl.exe -s -o NUL -w "%{http_code}`n" -b coord.txt -X DELETE http://localhost:3000/api/<recurso>/1
```

Ponham `*.txt` de cookies no `.gitignore`: **o arquivo é uma credencial**. No M10, cada
célula da matriz vira um teste automático.

### Passo 9 — Swagger com login e o ADR

No `swagger.ts`, `.addCookieAuth("sid")`; nas rotas protegidas, `@ApiCookieAuth()`,
`@ApiUnauthorizedResponse()` e `@ApiForbiddenResponse()`. Assim, quem fizer login pelo
`/api/docs` usa as rotas protegidas ali mesmo — é como a organização vai operar.

Escrevam `docs/adr/0001-sessao-em-cookie.md` ([modelo](../../projeto/modelos-de-documentos/adr.md)):
sessão ou token e por quê, duração, como se revoga, onde ficam as sessões, política de
senha, e **o que se perde** com a escolha. Material direto do critério 1 da P4.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `secret option required for sessions` | `SESSION_SECRET` fora do esquema do `validate` |
| Login dá 200, a rota seguinte dá 401 | O cookie não foi enviado (`-b` no `curl`) |
| Login funciona local e não em produção | `secure: true` exige HTTPS e `trust proxy` (M12) |
| `Property 'usuarioId' does not exist on type 'Session'` | Falta o `sessao.d.ts` |
| Anônimo recebe 403 em vez de 401 | Guards na ordem errada |
| A resposta traz `senhaHash` | A entidade saiu em vez do DTO de saída |
| `Nest can't resolve dependencies of the UsuariosController` | Controller não registrado no `AuthModule` |
| `npm install argon2` tenta compilar e falha | Sistema sem binário pronto (ex.: Mac Intel); instale ferramentas de compilação ou use `bcrypt` |

## 🤖 IA no fluxo

"Um login com NestJS" pedido a uma IA costuma vir com JWT e segredo no código, senha
comparada com `===` ou mensagens diferentes para e-mail e senha. O caminho feliz funciona, e
por isso parece certo. Revise contra: hash lento? segredo no ambiente e no esquema? mesma
mensagem nos dois erros? autorização no servidor, rota a rota? hash fora da resposta?

## ✅ Marco do módulo

- [ ] Papéis da organização definidos; matriz de acesso no `docs/api.md`
- [ ] Senhas com Argon2; `senhaHash` nunca sai na resposta
- [ ] Login, quem sou eu e logout funcionando; sessão regenerada no login
- [ ] **Todas** as rotas de escrita protegidas; a matriz conferida com `curl`
- [ ] `/api/docs` com login; ADR da sessão escrito

## 📚 Para aprofundar

- [NestJS — Guards](https://docs.nestjs.com/guards) · [Custom decorators](https://docs.nestjs.com/custom-decorators)
- [express-session](https://github.com/expressjs/session)
- [OWASP — Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
