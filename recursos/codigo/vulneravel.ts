/**
 * M13 — Laboratório de vulnerabilidades (backend).
 *
 * ⚠️ CÓDIGO DELIBERADAMENTE INSEGURO. Existe para ser atacado e corrigido em
 *    sala. Nunca use nada daqui em produção.
 *
 * São 10 falhas. Para cada uma, entregue:
 *   1. o nome OWASP (A01, A03, …)
 *   2. o impacto de negócio, na linguagem da biblioteca
 *   3. a exploração concreta (payload, URL ou comando)
 *   4. a correção
 *   5. por que a correção funciona
 *
 * O gabarito está no fim do arquivo. Não leia antes de tentar.
 */

import { exec } from "node:child_process";
import { join } from "node:path";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";

@Controller("inseguro")
export class InseguroController {
  constructor(
    private readonly obras: Repository<Obra>,
    private readonly usuarios: Repository<Usuario>,
    private readonly emprestimos: Repository<Emprestimo>,
  ) {}

  // ---------------------------------------------------------------- (1)
  @Get("buscar")
  async buscar(@Query("q") termo: string) {
    return this.obras
      .createQueryBuilder("obra")
      .where(`obra.titulo LIKE '%${termo}%'`)
      .getMany();
  }

  // ---------------------------------------------------------------- (2)
  @Get("emprestimos/:id")
  async verEmprestimo(@Param("id") id: number) {
    return this.emprestimos.findOne({
      where: { id },
      relations: { associado: true, exemplar: true },
    });
  }

  // ---------------------------------------------------------------- (3)
  @Get("usuarios")
  async listarUsuarios() {
    return this.usuarios.find();
  }

  // ---------------------------------------------------------------- (4)
  @Patch("perfil/:id")
  async atualizarPerfil(@Param("id") id: number, @Body() corpo: any) {
    await this.usuarios.update(id, corpo);
    return this.usuarios.findOneBy({ id });
  }

  // ---------------------------------------------------------------- (5)
  @Delete("obras/:id")
  async removerObra(@Param("id") id: number) {
    await this.obras.delete(id);
    return { removido: true };
  }

  // ---------------------------------------------------------------- (6)
  @Get("capa")
  baixarCapa(@Query("arquivo") arquivo: string, @Res() res: Response) {
    return res.sendFile(join("/var/bibliocom/midia", arquivo));
  }

  // ---------------------------------------------------------------- (7)
  @Post("converter")
  converter(@Body("nome") nome: string) {
    exec(`convert /tmp/${nome} /tmp/saida.png`);
    return { ok: true };
  }

  // ---------------------------------------------------------------- (8)
  @Post("entrar")
  async entrar(@Body() dto: { email: string; senha: string }) {
    const usuario = await this.usuarios.findOne({
      where: { email: dto.email },
      select: { id: true, email: true, senhaHash: true },
    });
    if (!usuario) {
      return { erro: "Não existe conta com este e-mail" };
    }
    if (usuario.senhaHash !== md5(dto.senha)) {
      return { erro: "Senha incorreta" };
    }
    return { id: usuario.id, email: usuario.email };
  }

  // ---------------------------------------------------------------- (9)
  @Get("relatorio")
  async relatorio(@Query("tamanho") tamanho: number) {
    return this.obras.find({ take: tamanho });
  }

  // ---------------------------------------------------------------- (10)
  @Get("erro")
  async comErro(@Query("id") id: number) {
    try {
      return await this.obras.findOneByOrFail({ id });
    } catch (err) {
      return { mensagem: err.message, stack: err.stack, sql: err.query };
    }
  }
}

/*
================================================================================
GABARITO — não leia antes de tentar.
================================================================================

(1) A03 — Injeção de SQL.
    O termo é concatenado na consulta. `?q=%' OR 1=1 --` devolve o acervo
    inteiro; `UNION SELECT` alcança outras tabelas.
    Correção: `.where("obra.titulo LIKE :termo", { termo: `%${termo}%` })`.
    Funciona porque o driver envia comando e parâmetro separados: o banco nunca
    interpreta o dado como SQL.

(2) A01 — IDOR (referência direta insegura).
    Qualquer pessoa lê o empréstimo de qualquer outra trocando o `:id`.
    Correção: filtrar pela sessão dentro da consulta — quem não pode ver recebe
    404 e não descobre nem que o registro existe.

(3) A01/A02 — Exposição de dados sensíveis.
    Devolve a entidade inteira, com `senhaHash` e e-mail de todos. Sem
    autenticação, ainda por cima.
    Correção: guard de papel + DTO de saída que declara o que sai.

(4) A01 — Mass assignment com escalada de privilégio.
    `corpo: any` grava qualquer campo: enviar `{"papel":"coordenacao"}` promove o
    próprio usuário.
    Correção: DTO tipado + `ValidationPipe` com `whitelist: true`, e o papel
    definido no servidor.

(5) A01 — Falta de autorização.
    Exclusão sem checar quem chama. Um `curl` apaga o acervo.
    Correção: `@UseGuards` + `@Papeis(Papel.COORDENACAO)`.

(6) A01 — Path traversal.
    `?arquivo=../../etc/passwd` sai da pasta de mídia.
    Correção: resolver o caminho e conferir o prefixo antes de servir.

(7) A03 — Injeção de comando.
    `nome` vai para o shell: `foo; rm -rf /` executa.
    Correção: `execFile("convert", [entrada, saida])` — argumentos separados,
    sem shell interpretando.

(8) A07 — Três falhas de autenticação numa função só.
    (a) Enumeração de usuários: mensagens diferentes revelam quais e-mails
        existem. Use uma única mensagem genérica.
    (b) MD5: rápido demais, quebrado. Use Argon2 ou bcrypt.
    (c) Comparação com `!==`: vulnerável a ataque de tempo. Use a função de
        verificação da própria biblioteca de hash.

(9) A05 — Negação de serviço por parâmetro sem teto.
    `?tamanho=99999999` consome memória do servidor com uma requisição barata.
    Correção: `@Max(100)` no DTO da query.

(10) A05 — Vazamento de informação pelo erro.
     Devolve `stack` e a consulta SQL ao cliente: revela caminhos de arquivo,
     estrutura do banco e versões.
     Correção: registrar o detalhe no log e devolver mensagem genérica com 500.
     O padrão do NestJS já faz isso — o risco é você "melhorar" a depuração.
================================================================================
*/
