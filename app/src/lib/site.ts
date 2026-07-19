/**
 * Retorna a URL base do site a partir das variáveis de ambiente.
 * Usado no sitemap.ts e manifest.ts.
 */
export function obterUrlBase(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
