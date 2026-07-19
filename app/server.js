// server.js — ponto de entrada para cPanel (Phusion Passenger)
// Inclui wizard de instalação automático: se o banco estiver vazio,
// mostra formulário de configuração antes de iniciar o Next.js.

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const logPath = path.join(__dirname, "boot-log.txt");

function log(linha) {
  const texto = `[${new Date().toISOString()}] ${linha}\n`;
  console.log(linha);
  try { fs.appendFileSync(logPath, texto); } catch {}
}

function rodarComando(comando) {
  log(`Executando: ${comando}`);
  try {
    const saida = execSync(comando, { cwd: __dirname, encoding: "utf8" });
    log(`Saída:\n${saida.trim().slice(0, 500)}`);
  } catch (erro) {
    log(`FALHOU: ${comando}\nstderr:\n${erro.stderr || erro.message}`);
    log("O site vai continuar subindo mesmo assim.");
  }
}

// ── Configurações de ambiente ─────────────────────────────────────────────────
if (!process.env.UPLOADS_DIR) {
  process.env.UPLOADS_DIR = path.join(__dirname, "public", "uploads");
}
try {
  fs.mkdirSync(process.env.UPLOADS_DIR, { recursive: true });
  log(`Pasta de uploads garantida em: ${process.env.UPLOADS_DIR}`);
} catch {}

if (!process.env.JIMP_FONTS_DIR) {
  const jimpFonts = path.join(__dirname, "node_modules", "jimp", "fonts");
  if (fs.existsSync(jimpFonts)) {
    process.env.JIMP_FONTS_DIR = jimpFonts;
    log(`Pasta de fontes do Jimp encontrada em: ${jimpFonts}`);
  }
}

// ── Prisma: gerar client e criar/atualizar tabelas ────────────────────────────
log("===== Iniciando aplicação =====");

const prismaCli = path.join(__dirname, "node_modules", "prisma", "build", "index.js");
if (fs.existsSync(prismaCli)) {
  rodarComando(`node "${prismaCli}" generate`);
  rodarComando(`node "${prismaCli}" db push --accept-data-loss --skip-generate`);
} else {
  log("AVISO: Prisma CLI não encontrado em node_modules.");
}

// ── HTML do wizard de instalação ──────────────────────────────────────────────
const HTML_SETUP = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Configuração inicial</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f5f7fa;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#fff;border-radius:16px;padding:32px;width:100%;max-width:440px;box-shadow:0 2px 16px rgba(0,0,0,.08)}
.emoji{font-size:2.5rem;text-align:center;margin-bottom:12px}
h1{font-size:1.4rem;font-weight:700;margin-bottom:4px;color:#111;text-align:center}
p.sub{font-size:.85rem;color:#666;margin-bottom:24px;text-align:center}
.sep{font-size:.75rem;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:.05em;margin:8px 0 14px;border-top:1px solid #f0f0f0;padding-top:16px}
label{display:block;font-size:.85rem;font-weight:500;color:#333;margin-bottom:4px}
input{width:100%;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:.9rem;margin-bottom:14px;outline:none;transition:border .2s}
input:focus{border-color:#dd8500;box-shadow:0 0 0 3px rgba(221,133,0,.15)}
button{width:100%;background:#dd8500;color:#fff;font-weight:600;border:none;border-radius:8px;padding:12px;font-size:.95rem;cursor:pointer;margin-top:4px;transition:opacity .2s}
button:hover{opacity:.9}
button:disabled{opacity:.55;cursor:not-allowed}
.erro{background:#fef2f2;color:#dc2626;border-radius:8px;padding:10px 12px;font-size:.85rem;margin-bottom:12px;display:none}
.ok{background:#f0fdf4;color:#15803d;border-radius:12px;padding:20px;font-size:.9rem;text-align:center;line-height:1.7}
code{background:#f1f5f9;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:.9rem;color:#0f172a}
</style>
</head>
<body>
<div class="card">
  <div class="emoji">🏠</div>
  <h1>Configuração inicial</h1>
  <p class="sub">Preencha os dados para ativar a plataforma.</p>
  <div id="form">
    <div class="sep">Imobiliária</div>
    <label>Nome da imobiliária *</label>
    <input id="nome" type="text" placeholder="Ex.: VP Negócios Imobiliários"/>
    <div class="sep">Conta de administrador</div>
    <label>Seu nome</label>
    <input id="nomeAdmin" type="text" placeholder="Ex.: João Silva"/>
    <label>E-mail de acesso *</label>
    <input id="email" type="email" placeholder="admin@suaimobiliaria.com.br"/>
    <label>Senha (mínimo 6 caracteres) *</label>
    <input id="senha" type="password" placeholder="••••••••"/>
    <label>Confirmar senha *</label>
    <input id="conf" type="password" placeholder="••••••••"/>
    <div id="erro" class="erro"></div>
    <button id="btn" onclick="enviar()">Criar plataforma</button>
  </div>
  <div id="ok" style="display:none"></div>
</div>
<script>
async function enviar(){
  const nome=v('nome'),nomeAdmin=v('nomeAdmin'),email=v('email'),senha=v('senha'),conf=v('conf');
  if(!nome||!email||!senha){return err('Preencha os campos obrigatórios (*).');}
  if(senha!==conf){return err('As senhas não coincidem.');}
  if(senha.length<6){return err('A senha deve ter ao menos 6 caracteres.');}
  const btn=document.getElementById('btn');
  btn.disabled=true; btn.textContent='Configurando...';
  try{
    const r=await fetch('/__setup__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nomeImobiliaria:nome,nomeAdmin,email,senha})});
    const d=await r.json();
    if(!r.ok){btn.disabled=false;btn.textContent='Criar plataforma';return err(d.erro||'Erro desconhecido.');}
    document.getElementById('form').style.display='none';
    document.getElementById('ok').style.display='block';
    document.getElementById('ok').innerHTML='<div class="ok">✅ Plataforma configurada!<br/><br/>Adicione no <strong>.env</strong>:<br/><code>DEFAULT_TENANT_SLUG='+d.slug+'</code><br/><br/>Depois clique em <strong>Restart</strong> no cPanel.<br/>O site estará pronto!</div>';
  }catch(e){btn.disabled=false;btn.textContent='Criar plataforma';err('Erro de conexão. Tente novamente.');}
}
function v(id){return document.getElementById(id).value.trim();}
function err(msg){const e=document.getElementById('erro');e.textContent=msg;e.style.display='block';}
</script>
</body>
</html>`;

// ── Inicialização ─────────────────────────────────────────────────────────────
async function iniciar() {
  const port = process.env.PORT || 3000;

  // Verifica se já existe uma imobiliária cadastrada.
  // Usa prisma.imobiliaria.count() em vez de SQL bruto para evitar problema
  // de case-sensitivity do MySQL no Linux (tabela "imobiliarias" vs "Imobiliarias").
  let configurado = false;
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    const total = await prisma.imobiliaria.count();
    await prisma.$disconnect();
    configurado = total > 0;
    log(`Imobiliárias no banco: ${total}`);
  } catch (err) {
    log(`Aviso ao verificar banco: ${err.message}`);
  }

  if (!configurado) {
    // ── Modo wizard ───────────────────────────────────────────────────────────
    log("Banco vazio — iniciando wizard de instalação na porta " + port);

    const { PrismaClient } = require("@prisma/client");
    const bcrypt = require("bcryptjs");

    function slugify(nome) {
      return nome.toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    }

    http.createServer(async (req, res) => {
      if (req.method === "POST" && req.url === "/__setup__") {
        let body = "";
        req.on("data", c => body += c);
        req.on("end", async () => {
          try {
            const { nomeImobiliaria, nomeAdmin, email, senha } = JSON.parse(body);
            if (!nomeImobiliaria || !email || !senha || senha.length < 6) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ erro: "Preencha todos os campos obrigatórios." }));
            }
            const slug = slugify(nomeImobiliaria);
            const senhaHash = await bcrypt.hash(senha, 10);
            const prisma = new PrismaClient();
            const imobiliaria = await prisma.imobiliaria.create({
              data: {
                nome: nomeImobiliaria.trim(),
                slug,
                corPrimaria: "#0D0D0D",
                corSecundaria: "#C5A059",
                corDestaque: "#DD8500",
                corFundo: "#F5F7FA"
              }
            });
            await prisma.usuario.create({
              data: {
                nome: (nomeAdmin || "Administrador").trim(),
                email: email.trim().toLowerCase(),
                senhaHash,
                papel: "SUPER_ADMIN",
                permissoes: [],
                imobiliariaId: imobiliaria.id
              }
            });
            await prisma.$disconnect();
            log(`Setup concluído: ${nomeImobiliaria} / slug: ${slug}`);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, slug }));
          } catch (e) {
            log(`Erro no setup: ${e.message}`);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ erro: "Erro ao salvar. Verifique o banco de dados e o .env." }));
          }
        });
      } else {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(HTML_SETUP);
      }
    }).listen(port, () => log(`Wizard rodando na porta ${port}`));

  } else {
    // ── Modo normal: seed + Next.js ───────────────────────────────────────────
    log("Banco configurado — iniciando Next.js na porta " + port);

    // Seed só roda no modo normal (imobiliária já existe)
    const seedPath = path.join(__dirname, "prisma", "seed.js");
    if (fs.existsSync(seedPath)) {
      rodarComando(`node "${seedPath}"`);
    }

    const next = require("next");
    const app = next({ dev: false });
    const handle = app.getRequestHandler();

    // Extensões permitidas para servir do UPLOADS_DIR
    const MIME_UPLOADS = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".png": "image/png",  ".gif": "image/gif",
      ".webp": "image/webp", ".svg": "image/svg+xml",
      ".ico": "image/x-icon", ".pdf": "application/pdf",
    };

    const uploadsBase = process.env.UPLOADS_DIR || path.join(__dirname, "public", "uploads");

    function servirUpload(req, res) {
      // Remove /uploads/ do início para obter o caminho relativo
      const rel = req.url.replace(/^\/uploads\//, "").split("?")[0];
      // Bloqueia path traversal
      const abs = path.resolve(uploadsBase, rel);
      if (!abs.startsWith(path.resolve(uploadsBase))) {
        res.writeHead(403); res.end(); return;
      }
      const ext = path.extname(abs).toLowerCase();
      const mime = MIME_UPLOADS[ext] || "application/octet-stream";
      fs.readFile(abs, (err, data) => {
        if (err) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000",
          "Content-Length": data.length,
        });
        res.end(data);
      });
    }

    app.prepare().then(() => {
      http.createServer((req, res) => {
        // Serve uploads diretamente do UPLOADS_DIR, sem passar pelo Next.js
        if (req.url && req.url.startsWith("/uploads/")) {
          return servirUpload(req, res);
        }
        handle(req, res);
      }).listen(port, () => {
        log(`Next.js rodando na porta ${port}`);
      });
    }).catch(err => {
      log(`ERRO FATAL em app.prepare(): ${err.message}\n${err.stack}`);
      process.exit(1);
    });
  }
}

iniciar().catch(err => {
  log(`Erro fatal: ${err.message}`);
  process.exit(1);
});
