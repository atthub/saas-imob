#!/bin/bash
# ============================================================
# Deploy manual para homologacao.attitudehub.com.br
# Uso: ./deploy-homologacao.sh SEU_USUARIO_CPANEL
# Exemplo: ./deploy-homologacao.sh attitudehb
# ============================================================

set -e

SSH_USER="${1:?Informe o usuário SSH: ./deploy-homologacao.sh SEU_USUARIO}"
SSH_HOST="homologacao.attitudehub.com.br"
SSH_PORT="1158"
SSH_OPTS="-p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=30"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/app"
ZIP_FILE="$SCRIPT_DIR/next-build.zip"

echo "=== [1/4] Build Next.js ==="
cd "$APP_DIR"
NEXT_TELEMETRY_DISABLED=1 \
DATABASE_URL="mysql://fake:fake@localhost:3306/fake" \
npm run build

echo ""
echo "=== [2/4] Compactando .next ==="
cd "$SCRIPT_DIR"
rm -f next-build.zip
zip -r next-build.zip app/.next
echo "Zip gerado: $(du -sh next-build.zip | cut -f1)"

echo ""
echo "=== [3/4] Enviando e instalando no servidor ==="
ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" \
  "cat > ~/next-build.zip && \
   cd ~/homologacao.attitudehub.com.br && \
   rm -rf .next_old && \
   mv .next .next_old && \
   cd ~ && \
   unzip -o next-build.zip -d . && \
   mv ~/app/.next ~/homologacao.attitudehub.com.br/.next && \
   rm -f ~/next-build.zip && \
   cd ~/homologacao.attitudehub.com.br && \
   touch tmp/restart.txt && \
   echo 'Deploy concluído em: '\$(date)" < next-build.zip

echo ""
echo "=== [4/4] Verificando site ==="
sleep 5
HTTP=$(curl -sk -o /dev/null -w "%{http_code}" "https://homologacao.attitudehub.com.br" || echo "000")
echo "HTTP status: $HTTP"

echo ""
echo "=== Limpeza local ==="
rm -f "$ZIP_FILE"

echo ""
echo "✅ Deploy finalizado!"
