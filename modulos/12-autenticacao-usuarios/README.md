# M12 — Autenticação e gestão de usuários

> **CH:** 5h (2h teóricas · 3h práticas) · **Semana 12** · **Pré-requisitos:** M07, M10, M11
> **Ementa:** *Tópicos relevantes: Gestão de usuários.*

Primeiro módulo genuinamente **ponta a ponta**: a mesma funcionalidade atravessa banco,
API, cache do cliente, roteamento e interface.

## 🎯 Objetivos

1. Distinguir autenticação de autorização e implementar as duas nas duas camadas.
2. Escolher o mecanismo de autenticação **pelo modelo de ameaça**, não pela moda.
3. Estender o model de usuário e implementar o fluxo completo de gestão.
4. Modelar papéis com grupos e permissões, incluindo autorização por objeto.
5. Proteger rotas no cliente sabendo que isso **não** é segurança.

---

## 📖 Teoria (2h)

### 1. Autenticação × autorização (10 min)

| | Autenticação | Autorização |
|---|---|---|
| Pergunta | *Quem é você?* | *O que você pode fazer?* |
| Falha | `401` | `403` |
| Backend | `passport-local`, sessão | `Guard`, filtro na consulta |
| Frontend | Tela de login, contexto de sessão | Esconder o que não pode usar |

Papéis do BiblioCom:

```
anônimo        → consulta o catálogo público
associado      → vê o próprio histórico, faz reserva
bibliotecário  → registra empréstimo/devolução, cadastra obras
coordenação    → tudo + relatórios + gestão de usuários
```

### 2. Sessão × token: a decisão (35 min) ⭐

Este é o ponto do curso em que uma decisão de arquitetura tem consequência direta de
segurança. Três opções reais:

| | Sessão + cookie `HttpOnly` | JWT em `localStorage` | JWT em cookie `HttpOnly` |
|---|---|---|---|
| Onde fica o segredo | No servidor; o cookie é só um id | No navegador, legível por JS | No navegador, ilegível por JS |
| **XSS rouba a sessão?** | ❌ Não | ✅ **Sim, trivialmente** | ❌ Não |
| Precisa de CSRF? | ✅ Sim | ❌ Não | ✅ Sim |
| Revogar acesso agora | ✅ Apagar a sessão | ❌ Difícil (só com lista de revogação) | ❌ Difícil |
| Funciona entre domínios | Com CORS + credenciais | ✅ Naturalmente | Com CORS + credenciais |
| Serve app mobile | Desajeitado | ✅ Sim | Desajeitado |
| Complexidade | Baixa (`express-session` + `passport-local`) | Média (refresh, expiração) | Alta |

**A escolha do material: sessão com cookie `HttpOnly`**, com SPA e API sob o **mesmo site**
([ADR-07](../../docs/decisoes-tecnicas.md#adr-07--autenticação-por-sessão-com-cookie-não-jwt-em-localstorage)).

O raciocínio, que é o que importa aprender:

> A maioria dos tutoriais ensina JWT em `localStorage` porque é o mais fácil de fazer
> funcionar. Só que `localStorage` é legível por **qualquer** JavaScript que rode na página:
> o que um XSS injetou, e o daquela dependência que ninguém auditou. Um cookie `HttpOnly`
> simplesmente **não existe** para o JavaScript.
>
> JWT é a resposta certa quando há vários domínios, clientes móveis ou serviços que não
> compartilham sessão. **Não é o nosso caso.** Escolher pelo modelo de ameaça, e não pelo
> tutorial mais popular, é o conteúdo desta seção.

### 3. A entidade de usuário (20 min)

O NestJS não traz modelo de usuário pronto — você o escreve, e isso torna cada decisão
visível.

```ts
export enum Papel {
  ASSOCIADO = "associado",
  BIBLIOTECARIO = "bibliotecario",
  COORDENACAO = "coordenacao",
}

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  senhaHash: string;

  @Column({ type: "enum", enum: Papel, default: Papel.ASSOCIADO })
  papel: Papel;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;
}
```

| Decisão | Por quê |
|---|---|
| `email` como identificador | Ninguém lembra de "nome de usuário". E-mail já é único por natureza |
| `senhaHash`, nunca `senha` | O nome do campo documenta o que ele contém. Ver abaixo |
| **`select: false`** | O campo **não vem** em `find()`. Precisa ser pedido de propósito. É a defesa contra vazá-lo sem querer num DTO malfeito |
| `papel` como enum | Um papel por usuário resolve o BiblioCom. Se precisasse de vários, seria uma tabela `usuario_papel` |
| `ativo` em vez de apagar | Desativar preserva o histórico de empréstimos. Apagar violaria o `RESTRICT` do M04 |

**Senha nunca é guardada — só o hash.**

```ts
import * as argon2 from "argon2";

const hash = await argon2.hash(senhaEmTexto);      // ao cadastrar
const ok = await argon2.verify(hash, senhaEnviada); // ao autenticar
```

| Regra | Motivo |
|---|---|
| Use **Argon2** ou **bcrypt** | São **lentos de propósito**: tornam a tentativa em massa cara |
| **Nunca** MD5 ou SHA-256 | São rápidos. Uma GPU testa bilhões por segundo |
| **Nunca** criptografia reversível | Se você consegue recuperar a senha, quem invadir também consegue |
| O *salt* já vem embutido | Argon2 e bcrypt guardam o salt dentro do próprio hash |

> Se um site consegue **te mandar a senha por e-mail** quando você esquece, ele guardou a
> senha de forma reversível. É motivo suficiente para não usar o site.

### 4. Endpoints de sessão (25 min)

Quatro rotas, e um formato de resposta que o frontend consegue consumir sem adivinhar:

| Rota | Método | Faz | Sucesso | Falha |
|---|---|---|---|---|
| `/api/auth/login` | POST | Cria a sessão | 200 + usuário | **401** |
| `/api/auth/logout` | POST | Destrói a sessão | 204 | — |
| `/api/auth/eu` | GET | Quem está logado | 200 + usuário | **401** |
| `/api/auth/registrar` | POST | Cria conta | 201 + usuário | 400 / 409 |

Três detalhes que decidem se o frontend fica simples ou não:

1. **`/eu` responde 401 quando não há sessão**, não 200 com `null`. O status é o que o
   cliente checa; corpo nulo com 200 obriga a inspecionar o conteúdo.
2. **`logout` é POST**, não GET. `GET` precisa ser seguro — um *prefetch* do navegador
   deslogaria a pessoa.
3. **A resposta nunca traz `senhaHash`.** Use DTO de saída (M07), sempre.

⚠️ **A mensagem de erro do login é genérica**: `"Credenciais inválidas"`, nunca "esse e-mail
não existe". Distinguir os dois casos entrega de bandeja a lista de e-mails cadastrados. Isso
tem nome, **enumeração de usuários**, e o M13 volta ao assunto.

### 5. Autorização em quatro níveis (25 min)

#### Nível 1 — exigir autenticação

```ts
@UseGuards(AutenticadoGuard)
@Post()
criar(@Body() dto: CriarObraDto) {}
```

Um **Guard** roda antes do handler e responde `403` (ou `401`) sozinho quando devolve
`false`. É a caixa "Guard" do diagrama do M03.

#### Nível 2 — por papel

```ts
@Injectable()
export class PapelGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidos = this.reflector.get<Papel[]>("papeis", ctx.getHandler());
    if (!exigidos) return true;
    const { user } = ctx.switchToHttp().getRequest();
    return !!user && exigidos.includes(user.papel);
  }
}

// uso
@Papeis(Papel.BIBLIOTECARIO, Papel.COORDENACAO)
@Delete(":id")
remover(@Param("id", ParseIntPipe) id: number) {}
```

| Trecho | O que faz |
|---|---|
| `Reflector` | Lê o metadado que o decorator `@Papeis(...)` anexou ao método |
| `if (!exigidos) return true` | Rota sem `@Papeis` não é restringida por este guard |
| `ctx.switchToHttp().getRequest()` | Chega ao objeto de requisição, onde o Passport pôs o `user` |

#### Nível 3 — o decorator que declara o papel

```ts
export const Papeis = (...papeis: Papel[]) => SetMetadata("papeis", papeis);
```

Uma linha. É o mesmo mecanismo de metadados do `@Get()` e do `@Entity()` — **um conceito,
usado pela terceira vez** no curso.

> Declarar o papel **junto da rota** é melhor que uma tabela central de permissões: quem lê
> o controller vê quem pode chamar aquilo, sem abrir outro arquivo.

#### Nível 4 — autorização por objeto ⭐

Papel diz "pode ver empréstimos". Não diz "pode ver **este** empréstimo".

```ts
async listarDoUsuario(usuario: Usuario) {
  const qb = this.emprestimos.createQueryBuilder("e")
    .leftJoinAndSelect("e.exemplar", "ex")
    .leftJoinAndSelect("ex.obra", "obra");

  if (usuario.papel === Papel.ASSOCIADO) {
    qb.where("e.associadoId = :id", { id: usuario.id });   // filtra, não checa depois
  }
  return qb.getMany();
}
```

**Filtrar a consulta** é melhor que checar depois de buscar: quem tenta
`/api/emprestimos/999` de outra pessoa recebe **404**, e não descobre nem que o registro
existe. É a defesa contra **IDOR** — *Insecure Direct Object Reference* — que o M13 retoma.

> A diferença entre `403` e `404` aqui é deliberada. `403` confirma que o recurso existe;
> `404` não confirma nada.

### 6. Sessão no cliente (25 min)

```tsx
// src/auth/AuthContext.tsx
import { createContext, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Usuario = { id: number; username: string; papel: string; eh_equipe: boolean };

const AuthContext = createContext<{
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (c: { username: string; password: string }) => Promise<void>;
  sair: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: usuario, isPending } = useQuery({
    queryKey: ["eu"],
    queryFn: () => api<Usuario>("/auth/eu/"),
    retry: false,                                  // 401 não é para repetir
    staleTime: 5 * 60_000,
  });

  const entrarMut = useMutation({
    mutationFn: (c: { username: string; password: string }) =>
      api<Usuario>("/auth/login/", { method: "POST", body: JSON.stringify(c) }),
    onSuccess: (u) => queryClient.setQueryData(["eu"], u),
  });

  const sairMut = useMutation({
    mutationFn: () => api<null>("/auth/logout/", { method: "POST" }),
    onSuccess: () => queryClient.clear(),          // limpa TODO o cache: dados de outra pessoa
  });

  return (
    <AuthContext.Provider
      value={{
        usuario: usuario ?? null,
        carregando: isPending,
        entrar: async (c) => { await entrarMut.mutateAsync(c); },
        sair: async () => { await sairMut.mutateAsync(); },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
```

> `queryClient.clear()` no logout **não é detalhe**. Sem ele, o cache continua com os dados
> da pessoa anterior — e o próximo login num computador compartilhado (balcão da
> biblioteca!) exibe informações que não deveria.

```tsx
// src/auth/RotaProtegida.tsx
import { Navigate, Outlet, useLocation } from "react-router";

export function RotaProtegida({ papeis }: { papeis?: string[] }) {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <Carregando />;          // não pisca o login para quem está logado
  if (!usuario) return <Navigate to="/login" state={{ de: local.pathname }} replace />;
  if (papeis && !papeis.includes(usuario.papel)) return <SemPermissao />;

  return <Outlet />;
}
```

> ⚠️ **`RotaProtegida` não é segurança.** O código está no *bundle* que qualquer pessoa
> baixa, e a API pode ser chamada por `curl`. Ela é **experiência do usuário**: evita
> mostrar telas que resultariam em 403. A proteção real está nas `permission_classes` e no
> filtro na consulta do backend. Prove isso no roteiro prático.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Entidade de usuário e hash (35 min)

```bash
cd ~/dev/bibliocom/backend
npm install @nestjs/passport passport passport-local express-session argon2
npm install -D @types/passport-local @types/express-session
```

Crie `src/contas/entidades/usuario.entity.ts` com a entidade da seção 3, gere a migração e
aplique:

```bash
npm run migration:generate src/migracoes/CriaUsuario
npm run migration:run
```

`src/contas/contas.service.ts`:

```ts
async registrar(dto: RegistrarDto): Promise<Usuario> {
  const jaExiste = await this.usuarios.existsBy({ email: dto.email });
  if (jaExiste) throw new ConflictException("E-mail já cadastrado");

  const usuario = this.usuarios.create({
    email: dto.email,
    senhaHash: await argon2.hash(dto.senha),
    papel: Papel.ASSOCIADO,
  });
  return this.usuarios.save(usuario);
}

async validar(email: string, senha: string): Promise<Usuario | null> {
  const usuario = await this.usuarios.findOne({
    where: { email },
    select: { id: true, email: true, papel: true, ativo: true, senhaHash: true },
  });
  if (!usuario || !usuario.ativo) return null;
  return (await argon2.verify(usuario.senhaHash, senha)) ? usuario : null;
}
```

| Trecho | Por quê |
|---|---|
| `select: { …, senhaHash: true }` | O campo é `select: false` na entidade. Aqui ele é pedido **de propósito** — o único lugar do sistema que o lê |
| `!usuario.ativo` cai no mesmo `return null` | Conta desativada e senha errada devolvem a **mesma** resposta. Distinguir informaria ao atacante que a conta existe |
| `ConflictException` no registro | 409, não 400: a requisição está bem formada; o conflito é de estado |

⚠️ **O `registrar` sempre cria `ASSOCIADO`.** Se o papel viesse do DTO, qualquer pessoa se
cadastraria como coordenação. É *mass assignment* com consequência de privilégio.

### Passo 2 — Sessão e endpoints (40 min)

Em `main.ts`:

```ts
import * as session from "express-session";
import * as passport from "passport";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());
```

| Opção | O que faz |
|---|---|
| `httpOnly: true` | **A linha do módulo.** O cookie deixa de existir para o JavaScript |
| `secure` só em produção | Exige HTTPS. Em `localhost` (HTTP) impediria o login |
| `sameSite: "lax"` | O cookie não é enviado em requisição *cross-site* de escrita — mitiga CSRF |
| `saveUninitialized: false` | Não cria sessão para quem só visitou. Menos lixo no armazenamento |
| `maxAge` | Expira em 8 horas |

⚠️ `SESSION_SECRET` vai no `.env`, e é **diferente** em produção. Com o segredo, qualquer
pessoa forja um cookie de sessão válido.

Implemente as quatro rotas da seção 4. O `/eu`:

```ts
@Get("eu")
@UseGuards(AutenticadoGuard)
eu(@Req() req: Request) {
  return UsuarioResposta.de(req.user as Usuario);
}
```

**Teste, e observe o cookie:**

```bash
# Linux / macOS / WSL / Git Bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bib@exemplo.org","senha":"senha-de-teste-123"}'

curl -i -b cookies.txt http://localhost:3000/api/auth/eu
curl -i http://localhost:3000/api/auth/eu          # sem cookie: 401
```

```powershell
# Windows PowerShell
$s = $null
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -SessionVariable s `
  -ContentType "application/json" `
  -Body '{"email":"bib@exemplo.org","senha":"senha-de-teste-123"}'

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/eu" -WebSession $s
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/eu" -SkipHttpErrorCheck
```

**Deu certo se:** o cabeçalho `Set-Cookie` do login contém **`HttpOnly`**, e o `/eu` sem
sessão responde **401**.

Agora a prova do módulo: abra o DevTools do navegador, faça login e rode no console:

```js
document.cookie
```

O cookie de sessão **não aparece**. Esse é o `HttpOnly` funcionando — e é exatamente o que
um XSS não conseguiria roubar. Compare mentalmente com `localStorage.getItem("token")`.

### Passo 3 — Guards e autorização (40 min)

Implemente `AutenticadoGuard`, `PapelGuard` e o decorator `@Papeis` da seção 5. Registre o
`PapelGuard` globalmente em `app.module.ts`:

```ts
{ provide: APP_GUARD, useClass: PapelGuard }
```

Depois aplique a matriz:

| Rota | Anônimo | Associado | Bibliotecário | Coordenação |
|---|---|---|---|---|
| `GET /api/obras` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/obras` | ❌ 401 | ❌ 403 | ✅ | ✅ |
| `DELETE /api/obras/:id` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |
| `GET /api/emprestimos` | ❌ 401 | só os seus | todos | todos |
| `POST /api/emprestimos` | ❌ 401 | ❌ 403 | ✅ | ✅ |
| `GET /api/usuarios` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |
| `POST /api/obras/:id/capa` | ❌ 401 | ❌ 403 | ✅ | ✅ |

> A última linha é uma **dívida do M07**. A rota de upload nasceu aberta lá, com um
> `// TODO(M12)` marcando o lugar. É agora. Procure o comentário no código, aplique o
> `@UseGuards` e apague o `TODO` — dívida técnica anotada e não paga é só dívida técnica.

A linha `GET /api/emprestimos` é o nível 4: não é permitir ou negar, é **filtrar**.

### Passo 4 — Sessão no cliente (40 min)

No frontend, o cliente HTTP precisa enviar o cookie:

```ts
export const api = {
  async get<T>(caminho: string): Promise<T> {
    const r = await fetch(`/api${caminho}`, { credentials: "include" });
    if (r.status === 401) throw new NaoAutenticado();
    if (!r.ok) throw new ErroApi(r.status, await r.text());
    return r.json();
  },
};
```

⚠️ **Sem `credentials: "include"`, o `fetch` não envia o cookie** — e todo endpoint
autenticado responde 401 sem explicação aparente. É o erro nº 1 deste passo.

Implemente, com o que o M10 e o M11 ensinaram:

- `useSessao()` sobre TanStack Query, consultando `/auth/eu`
- `<RotaProtegida papel={...}>` que redireciona para `/entrar` guardando o destino
- Login que, ao dar certo, **invalida** a consulta da sessão para o cache atualizar
- Logout que limpa o cache inteiro (`queryClient.clear()`)

> **Esconder um botão não é segurança.** Proteger rota no cliente melhora a experiência,
> porque evita mostrar uma tela que ia falhar de qualquer jeito. Quem chama a API direto
> continua barrado pelo backend, e é lá que a segurança mora. O M13 demonstra isso com um
> `curl` e nenhuma cerimônia.

### Passo 5 — Verificar a matriz nas duas camadas (25 min) ⭐

Para **cada célula** da tabela do Passo 3, confira as duas camadas:

1. **Backend:** chame a rota com `curl.exe`/`Invoke-RestMethod`, usando a sessão de cada
   papel. O status bate com a tabela?
2. **Frontend:** logado com aquele papel, o elemento aparece na tela?

Preencha e entregue:

| Rota | Papel | Status esperado | Status obtido | UI coerente? |
|---|---|---|---|---|

⚠️ **Uma célula onde o frontend esconde e o backend permite é uma falha de segurança**, não
um detalhe de interface. Marque-a em vermelho e corrija o backend — nunca "resolva"
escondendo melhor.

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `user.password = "x"` | `user.set_password("x")` |
| Trocar a entidade `Usuario` depois de a 1ª migração rodar | Decida antes |
| JWT em `localStorage` "porque é mais fácil" | Decida pelo modelo de ameaça |
| Mensagem de login que revela se o usuário existe | Mensagem única |
| Só esconder o link no React | Proteja a API |
| Papel checado, objeto não | Filtre a consulta por dono (IDOR) |
| Logout sem `queryClient.clear()` | Cache com dados da pessoa anterior |
| `retry` na query `/auth/eu/` | Repete o 401 três vezes |
| Faltou `X-CSRFToken` na escrita | 403 em todo POST |
| `credentials` ausente no `fetch` | O cookie não é enviado |
| Piscar a tela de login para quem está logado | Trate o estado `carregando` |

## ✅ Checklist de saída

- [ ] Entidade `Usuario` própria, criada por migração desde o início
- [ ] Argon2 configurado; nenhuma senha em texto puro
- [ ] `login`, `logout` e `eu` funcionando, testados com `curl`
- [ ] CSRF funcionando na SPA (cookie lido, cabeçalho enviado)
- [ ] Os três papéis criados por migração de dados, não à mão no banco
- [ ] Autorização nos 4 níveis, com a consulta filtrada por usuário
- [ ] `AuthProvider`, `RotaProtegida` e página de login funcionando
- [ ] Logout limpa o cache do Query
- [ ] Matriz de acesso verificada nas duas camadas, upload de capa incluído
- [ ] O `// TODO(M12)` do M07 foi resolvido e apagado
- [ ] **Provei com `curl` que a API recusa o que a interface esconde**

## 📦 Entrega E5 — Autenticação ponta a ponta

Sistema com login, 3 papéis, rotas protegidas no cliente, autorização real no servidor e a
matriz de acesso verificada — incluindo a evidência do teste com `curl` ignorando a
interface.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS — Guards](https://docs.nestjs.com/guards)
- [Passport — estratégia local](https://www.passportjs.org/concepts/authentication/password/)
- [OWASP — Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP — JWT for Java (o raciocínio vale para qualquer stack)](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
