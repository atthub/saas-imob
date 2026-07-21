import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/debug-status
 * Diagnóstico do servidor — mostra o erro exato que está causando o Application Error.
 * REMOVER após diagnóstico.
 */
export async function GET() {
  const resultado: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG || "(não definido)",
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL
        ? "✓ definida (oculta)"
        : "✗ NÃO DEFINIDA",
    },
  };

  // 1. Testar conexão básica com o banco
  try {
    await prisma.$queryRaw`SELECT 1`;
    resultado.conexao_banco = "✓ OK";
  } catch (e: unknown) {
    resultado.conexao_banco = `✗ ERRO: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 2. Contar imobiliárias
  try {
    const total = await prisma.imobiliaria.count();
    resultado.total_imobiliarias = total;
  } catch (e: unknown) {
    resultado.total_imobiliarias = `✗ ERRO: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Buscar imobiliária do tenant atual
  const slug = process.env.DEFAULT_TENANT_SLUG || "delta-imoveis-pinda";
  try {
    const imob = await prisma.imobiliaria.findUnique({
      where: { slug },
      select: { id: true, nome: true, slug: true },
    });
    resultado.imobiliaria_tenant = imob
      ? `✓ Encontrada: ${imob.nome} (${imob.slug})`
      : `✗ Não encontrada para slug="${slug}"`;
  } catch (e: unknown) {
    resultado.imobiliaria_tenant = `✗ ERRO: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. Testar include com relações (igual ao obterImobiliariaAtual)
  try {
    const imob = await prisma.imobiliaria.findUnique({
      where: { slug },
      include: { redesSociais: true, template: true },
    });
    resultado.imobiliaria_com_relacoes = imob
      ? `✓ OK (redesSociais: ${imob.redesSociais.length}, template: ${imob.template?.identificador ?? "nenhum"})`
      : `✗ Não encontrada`;
  } catch (e: unknown) {
    resultado.imobiliaria_com_relacoes = `✗ ERRO: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 5. Testar tabela configuracoes_imobiliaria
  try {
    await prisma.$queryRaw`SELECT COUNT(*) FROM configuracoes_imobiliaria`;
    resultado.tabela_configuracoes = "✓ Existe";
  } catch (e: unknown) {
    resultado.tabela_configuracoes = `✗ ERRO: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 6. Testar prisma.promocao.count (igual ao layout)
  try {
    const imob = await prisma.imobiliaria.findUnique({ where: { slug }, select: { id: true } });
    if (imob) {
      const total = await prisma.promocao.count({ where: { imobiliariaId: imob.id } });
      resultado.promocoes_count = `✓ ${total} promoções`;
    } else {
      resultado.promocoes_count = "⚠ Imobiliária não encontrada";
    }
  } catch (e: unknown) {
    resultado.promocoes_count = `✗ ERRO: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 7. Modelos disponíveis no Prisma Client
  try {
    const modelos = Object.keys(prisma)
      .filter((k) => !k.startsWith("$") && !k.startsWith("_"))
      .sort();
    resultado.modelos_prisma = modelos;
  } catch (e: unknown) {
    resultado.modelos_prisma = `✗ ERRO: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 8. Schema.prisma no servidor — verifica se tem Promocao
  try {
    const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
    if (existsSync(schemaPath)) {
      const schema = readFileSync(schemaPath, "utf8");
      resultado.schema_tem_promocao = schema.includes("model Promocao") ? "✓ SIM" : "✗ NÃO";
      resultado.schema_tem_artigo = schema.includes("model Artigo") ? "✓ SIM" : "✗ NÃO";
      resultado.schema_tem_configuracao = schema.includes("ConfiguracaoImobiliaria") ? "✓ SIM" : "✗ NÃO";
      resultado.schema_path = schemaPath;
    } else {
      resultado.schema_path = `✗ NÃO ENCONTRADO em ${schemaPath}`;
    }
  } catch (e: unknown) {
    resultado.schema_info = `✗ ERRO: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(resultado, { status: 200 });
}
