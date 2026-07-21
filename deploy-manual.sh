#!/bin/bash
# =============================================================================
# deploy-manual.sh — Deploy manual da Vitrine Imob para clientes
#
# Uso:   ./deploy-manual.sh <cliente>
# Exemplos:
#   ./deploy-manual.sh jkr
#   ./deploy-manual.sh delta
#   ./deploy-manual.sh eliana
#   ./deploy-manual.sh vp
#
# O que faz (em ordem):
#   1. Build do Next.js no Mac (com DATABASE_URL fake para não precisar de banco)
#   2. Zip de .next/ + prisma/schema.prisma + prisma/seed.js
#   3. SCP do zip para o servidor via SSH
#   4. SSH: extrai zip, atualiza schema, roda prisma db push, reinicia Passenger
#
# Pré-requisito: chave SSH configurada (~/.ssh/config ou ssh-add)
#
# ⚠️  REGRA OBRIGATÓRIA PARA CLIENTES NOVOS:
#   Todo cliente novo (ou que ainda roda código antigo) DEVE receber um deploy
#   manual ANTES de usar o GitHub Actions. O GitHub Actions depende do endpoint
#   /api/internal/deploy que só existe no código novo. Sem o deploy manual
#   inicial, o GitHub Actions sempre falhará com CURL_ERROR: 22.
#
#   Ordem correta para cada cliente novo:
#     1. ./deploy-manual.sh <cliente>   ← ativa o endpoint no servidor
#     2. A partir daí: GitHub Actions → Run workflow → <cliente>
# =============================================================================

set -euo pipefail

# ─── Seleção de cliente ───────────────────────────────────────────────────────
CLIENTE="${1:-}"
if [[ -z "$CLIENTE" ]]; then
  echo "Uso: $0 <cliente>"
  echo "Clientes disponíveis: jkr, delta, eliana, vp"
  exit 1
fi

# ─── Configurações por cliente ────────────────────────────────────────────────
case "$CLIENTE" in
  homologacao)
    SSH_USER="atthub"
    SSH_HOST="128.201.75.100"
    SSH_PORT="1158"
    NODE_BIN="/home/atthub/nodevenv/homologacao.attitudehub.com.br/22/bin/node"
    APP_DIR="/home/atthub/homologacao.attitudehub.com.br"
    ;;

  jkr)
    SSH_USER="jkrimoveis"
    SSH_HOST="128.201.75.100"
    SSH_PORT="1158"
    NODE_BIN="/home/jkrimoveis/nodevenv/public_html/vitrineimob/22/bin/node"
    APP_DIR="/home/jkrimoveis/public_html/vitrineimob"
    ;;

  delta)
    SSH_USER="deltaimoveis"
    SSH_HOST="128.201.75.100"
    SSH_PORT="1158"
    NODE_BIN="/home/deltaimoveis/nodevenv/vitrine.deltaimoveispinda.com.br/22/bin/node"
    APP_DIR="/home/deltaimoveis/vitrine.deltaimoveispinda.com.br"
    ;;

  eliana)
    SSH_USER="elianagodoy"
    SSH_HOST="128.201.75.100"
    SSH_PORT="1158"
    NODE_BIN="/home/elianagodoy/nodevenv/vitrine.elianagodoy.com.br/22/bin/node"
    APP_DIR="/home/elianagodoy/vitrine.elianagodoy.com.br"
    ;;

  vp)
    SSH_USER="vpnegocios"
    SSH_HOST="128.201.75.100"
    SSH_PORT="1158"
    NODE_BIN="/home/vpnegocios/nodevenv/public_html/vitrineimob/22/bin/node"
    APP_DIR="/home/vpnegocios/public_html/vitrineimob"
    ;;

  *)
    echo "❌  Cliente '$CLIENTE' não reconhecido."
    echo "Clientes disponíveis: jkr, delta, eliana, vp"
    exit 1
    ;;
esac

# ─── Caminhos locais ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_LOCAL="$SCRIPT_DIR/app"
ZIP="/tmp/vitrineimob-${CLIENTE}-$(date +%Y%m%d%H%M%S).zip"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Deploy Vitrine Imob → $CLIENTE"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Build ─────────────────────────────────────────────────────────────────
echo "▶ [1/4] Build Next.js..."
cd "$APP_LOCAL"
NEXT_TELEMETRY_DISABLED=1 \
  DATABASE_URL="mysql://fake:fake@localhost:3306/fake" \
  npm run build
echo "✔ Build concluído"
echo ""

# ─── 2. Empacotar ─────────────────────────────────────────────────────────────
echo "▶ [2/4] Empacotando arquivos..."
cd "$APP_LOCAL"
zip -r "$ZIP" \
  .next \
  prisma/schema.prisma \
  prisma/seed.js \
  --quiet
echo "✔ Zip criado: $ZIP ($(du -sh "$ZIP" | cut -f1))"
echo ""

# ─── 3. Enviar via SCP ────────────────────────────────────────────────────────
REMOTE_FILENAME="deploy-${CLIENTE}-$(date +%Y%m%d%H%M%S).zip"
echo "▶ [3/4] Enviando zip para o servidor ($SSH_USER@$SSH_HOST)..."
scp -P "$SSH_PORT" "$ZIP" "${SSH_USER}@${SSH_HOST}:~/${REMOTE_FILENAME}"
echo "✔ Upload concluído"
echo ""

# ─── 4. SSH: extrair, atualizar schema e reiniciar ───────────────────────────
echo "▶ [4/4] Aplicando no servidor..."
# shellcheck disable=SC2087
ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" <<ENDSSH
set -e
NODE="${NODE_BIN}"
APP="${APP_DIR}"
ZIP_REMOTE="\$HOME/${REMOTE_FILENAME}"

echo "  → Extraindo zip..."
DTMP=\$(mktemp -d)
unzip -oq "\$ZIP_REMOTE" -d "\$DTMP"

echo "  → Atualizando .next..."
rm -rf "\$APP/.next_old" 2>/dev/null || true
mv "\$APP/.next" "\$APP/.next_old" 2>/dev/null || true
mv "\$DTMP/.next" "\$APP/.next"

echo "  → Atualizando prisma/schema.prisma e seed.js..."
cp "\$DTMP/prisma/schema.prisma" "\$APP/prisma/schema.prisma"
cp "\$DTMP/prisma/seed.js"       "\$APP/prisma/seed.js"

echo "  → Limpando temporários..."
rm -rf "\$DTMP" "\$ZIP_REMOTE"

echo "  → Regenerando Prisma Client..."
cd "\$APP"
"\$NODE" node_modules/prisma/build/index.js generate 2>&1 | tail -3

echo "  → Aplicando schema no banco (db push)..."
"\$NODE" node_modules/prisma/build/index.js db push --accept-data-loss 2>&1 | tail -5

echo "  → Reiniciando Passenger..."
mkdir -p "\$APP/tmp"
touch "\$APP/tmp/restart.txt"

echo ""
echo "✔ Deploy concluído em \$(date)"
ENDSSH

# ─── Limpeza local ────────────────────────────────────────────────────────────
rm -f "$ZIP"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅  Deploy $CLIENTE finalizado com sucesso!"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  Verifique os toggles no admin após o primeiro deploy:"
echo "   - Portais (XML) → reativar se necessário"
echo "   - Landing Pages → reativar se necessário"
echo "   - Comissões     → reativar se necessário"
echo ""
