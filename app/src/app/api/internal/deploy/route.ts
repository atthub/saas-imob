import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "child_process";
import { existsSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

// POST /api/internal/deploy
// Chamado pelo GitHub Actions após upload do zip via cPanel UAPI.
// Extrai o zip (.next/) no diretório da app, reinicia o Passenger e limpa o zip.
//
// Headers: Authorization: Bearer <DEPLOY_SECRET>
// Body:    { "zip": "deploy-12345678.zip" }
//
// Variável de ambiente obrigatória no servidor: DEPLOY_SECRET=<segredo>
export async function POST(request: NextRequest) {
  // 1. Autenticação
  const secret = process.env.DEPLOY_SECRET;
  const auth   = request.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validar nome do zip
  const body    = await request.json().catch(() => ({}));
  const zipName = typeof body.zip === "string" ? body.zip.trim() : "";
  if (!zipName || !/^deploy-\d+\.zip$/.test(zipName)) {
    return NextResponse.json({ error: "Parâmetro zip inválido" }, { status: 400 });
  }

  // 3. Verificar existência do zip
  const appDir  = process.cwd(); // /home/jkrimoveis/public_html/vitrineimob
  const zipPath = join(appDir, zipName);
  if (!existsSync(zipPath)) {
    return NextResponse.json(
      { error: `Zip não encontrado: ${zipPath}` },
      { status: 404 }
    );
  }

  try {
    // 4. Extrair zip (sobrescreve .next/ existente)
    execFileSync("unzip", ["-o", zipPath, "-d", appDir], {
      timeout: 120_000,
      env: { ...process.env, PATH: "/usr/local/bin:/usr/bin:/bin" },
    });

    // 5. Reiniciar Passenger (touch tmp/restart.txt)
    const tmpDir = join(appDir, "tmp");
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, "restart.txt"), new Date().toISOString());

    // 6. Limpar zips de deploy antigos
    try {
      for (const f of readdirSync(appDir)) {
        if (/^deploy-\d+\.zip$/.test(f)) {
          unlinkSync(join(appDir, f));
        }
      }
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
