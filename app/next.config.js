/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita instrumentation.ts — executado a cada restart para garantir schema do banco
  experimental: {
    instrumentationHook: true,
  },
  // Compressão gzip nas respostas (reduz payload e tráfego)
  compress: true,

  // Desabilita telemetria de build (evita requests externos durante build)
  // Configurado também via NEXT_TELEMETRY_DISABLED=1 no ambiente.

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
    ]
  },
  eslint: {
    ignoreDuringBuilds: true
  },

  // ─── Cabeçalhos de segurança HTTP ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impede que o site seja embutido em iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Impede que o browser "adivinhe" o tipo do conteúdo (MIME sniffing)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limita informações enviadas no cabeçalho Referer a origens seguras
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Desabilita funcionalidades sensíveis do browser que não são usadas
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
          // Ativa filtro XSS nativo de browsers mais antigos
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // DNS prefetch controlado (evita vazamento de domínios internos)
          { key: "X-DNS-Prefetch-Control", value: "on" }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
