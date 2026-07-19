import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { enviarEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// GET /api/admin/testar-email
// Testa o envio de e-mail de notificação de lead para os ADMINs da imobiliária logada.
// Retorna diagnóstico completo: quantos admins encontrados, e-mails tentados, erros.
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !["ADMIN", "SUPER_ADMIN"].includes(sessao.papel)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const imobiliariaId = sessao.imobiliariaId;
  if (!imobiliariaId) {
    return NextResponse.json({ erro: "SUPER_ADMIN sem imobiliária selecionada." }, { status: 400 });
  }

  const log: string[] = [];

  try {
    log.push(`Buscando ADMINs para imobiliariaId=${imobiliariaId}`);

    const admins = await prisma.usuario.findMany({
      where: { imobiliariaId, papel: "ADMIN" },
      select: { email: true, nome: true }
    });

    log.push(`Encontrados: ${admins.length} admin(s)`);
    admins.forEach(a => log.push(`  - ${a.nome} <${a.email}>`));

    if (admins.length === 0) {
      return NextResponse.json({ ok: false, log, erro: "Nenhum ADMIN encontrado para esta imobiliária." });
    }

    const resultados: { email: string; ok: boolean; erro?: string }[] = [];

    for (const admin of admins) {
      try {
        await enviarEmail({
          para: admin.email,
          assunto: "✅ Teste de notificação — Vitrine Imob",
          html: `
            <h2>Teste de e-mail funcionando!</h2>
            <p>Olá, ${admin.nome}! Este é um e-mail de teste da plataforma Vitrine Imob.</p>
            <p>Se você está recebendo isso, as notificações de novos leads estão configuradas corretamente.</p>
          `
        });
        log.push(`  ✅ E-mail enviado para ${admin.email}`);
        resultados.push({ email: admin.email, ok: true });
      } catch (err: any) {
        const msg = err?.message || String(err);
        log.push(`  ❌ Erro ao enviar para ${admin.email}: ${msg}`);
        resultados.push({ email: admin.email, ok: false, erro: msg });
      }
    }

    const todosOk = resultados.every(r => r.ok);
    return NextResponse.json({ ok: todosOk, log, resultados });

  } catch (err: any) {
    const msg = err?.message || String(err);
    log.push(`❌ Erro geral: ${msg}`);
    return NextResponse.json({ ok: false, log, erro: msg }, { status: 500 });
  }
}
