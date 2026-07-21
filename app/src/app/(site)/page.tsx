import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { imovelParaResumo } from "@/lib/imoveisPublicos";
import HeroSlider from "./_components/HeroSlider";
import PropertyCard from "./_components/PropertyCard";
import DestaqueEspecial from "./_components/DestaqueEspecial";
import Link from "next/link";
import { Megaphone, ArrowRight, BookOpen } from "lucide-react";

// Sempre renderizar no servidor a cada requisição: garante que banners,
// imóveis em destaque e novos cadastros apareçam imediatamente, sem cache
// estático gerado no build.
export const dynamic = "force-dynamic";

const SELECT_RESUMO = {
  id: true,
  codigo: true,
  titulo: true,
  tipo: true,
  finalidade: true,
  valorVenda: true,
  valorLocacao: true,
  quartos: true,
  vagasGaragem: true,
  areaTotal: true,
  fotos: { select: { url: true, capa: true }, orderBy: { ordem: "asc" as const } },
  cidade: { select: { nome: true } },
  bairro: { select: { nome: true } }
} as const;

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export default async function HomePage() {
  const imobiliaria = await obterImobiliariaAtual();

  if (!imobiliaria) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center text-gray-500">
        Site em configuração. Volte em breve.
      </div>
    );
  }

  // blogHomepageHabilitado: tabela chave-valor configuracoes_imobiliaria
  const blogHomepageHabilitado = await getConfig(imobiliaria.id, "blogHomepageHabilitado", false);

  const agora = new Date();

  // Usa $queryRaw para promoções e artigos — evita crash quando o Prisma Client
  // do servidor não tem esses models gerados (client desatualizado no node_modules).
  const [banners, imoveisDestaque] = await Promise.all([
    prisma.banner.findMany({
      where: { imobiliariaId: imobiliaria.id, ativo: true },
      orderBy: { ordem: "asc" },
      select: { id: true, titulo: true, urlDesktop: true, urlMobile: true, link: true }
    }),
    prisma.imovel.findMany({
      where: { imobiliariaId: imobiliaria.id, destaque: true, status: "DISPONIVEL" },
      take: 10,
      orderBy: { criadoEm: "desc" },
      select: SELECT_RESUMO
    }),
  ]);

  type PromoResumo = { id: string; titulo: string; subtitulo: string | null; imagemUrl: string | null };
  let promocoesAtivas: PromoResumo[] = [];
  try {
    promocoesAtivas = await prisma.$queryRaw<PromoResumo[]>`
      SELECT id, titulo, subtitulo, imagemUrl FROM promocoes
      WHERE imobiliariaId = ${imobiliaria.id} AND ativo = 1
        AND (
          (dataInicio IS NULL AND dataFim IS NULL)
          OR (dataInicio <= ${agora} AND dataFim IS NULL)
          OR (dataInicio IS NULL AND dataFim >= ${agora})
          OR (dataInicio <= ${agora} AND dataFim >= ${agora})
        )
      ORDER BY ordem ASC
      LIMIT 4
    `;
  } catch { promocoesAtivas = []; }

  type ArtigoResumo = { id: string; titulo: string; slug: string; resumo: string | null; imagemCapaUrl: string | null; categoria: string | null; publicadoEm: Date | null };
  let artigosRecentes: ArtigoResumo[] = [];
  if (blogHomepageHabilitado) {
    try {
      artigosRecentes = await prisma.$queryRaw<ArtigoResumo[]>`
        SELECT id, titulo, slug, resumo, imagemCapaUrl, categoria, publicadoEm FROM artigos
        WHERE imobiliariaId = ${imobiliaria.id} AND ativo = 1
        ORDER BY publicadoEm DESC
        LIMIT 3
      `;
    } catch { artigosRecentes = []; }
  }

  const idsDestaque = imoveisDestaque.map((imovel) => imovel.id);

  const poolAleatorio = await prisma.imovel.findMany({
    where: {
      imobiliariaId: imobiliaria.id,
      status: "DISPONIVEL",
      id: { notIn: idsDestaque }
    },
    select: { id: true }
  });

  const idsAleatorios = embaralhar(poolAleatorio.map((imovel) => imovel.id)).slice(0, 6);

  const imoveisAleatoriosBrutos = idsAleatorios.length
    ? await prisma.imovel.findMany({
        where: { id: { in: idsAleatorios } },
        select: SELECT_RESUMO
      })
    : [];

  // Preserva a ordem embaralhada (o "in" do Prisma não garante a ordem da lista de ids).
  const imoveisAleatorios = idsAleatorios
    .map((id) => imoveisAleatoriosBrutos.find((imovel) => imovel.id === id))
    .filter((imovel): imovel is (typeof imoveisAleatoriosBrutos)[number] => Boolean(imovel));

  return (
    <>
      <HeroSlider
        banners={banners}
        heroTitulo={imobiliaria.heroTitulo}
        heroSubtitulo={imobiliaria.heroSubtitulo}
      />

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-2xl font-bold text-brand-dark">Imóveis em destaque</h2>
          <Link href="/imoveis" className="text-sm font-medium text-brand-goldVivid hover:underline">
            Ver todos os imóveis
          </Link>
        </div>

        {imoveisDestaque.length > 0 ? (
          (imobiliaria as any).modoDestaque === "especial" ? (
            <DestaqueEspecial imoveis={imoveisDestaque.map(imovelParaResumo)} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {imoveisDestaque.map((imovel) => (
                <PropertyCard key={imovel.id} imovel={imovelParaResumo(imovel)} />
              ))}
            </div>
          )
        ) : (
          <p className="text-gray-400 text-sm">Nenhum imóvel em destaque no momento.</p>
        )}
      </section>

      {/* Seção de promoções */}
      {promocoesAtivas.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-goldVivid" />
              <h2 className="font-heading text-2xl font-bold text-brand-dark">Promoções exclusivas</h2>
            </div>
            <Link href="/promocoes" className="text-sm font-medium text-brand-goldVivid hover:underline">
              Ver todas
            </Link>
          </div>
          <div className={`grid gap-5 ${promocoesAtivas.length === 1 ? "" : "sm:grid-cols-2"}`}>
            {promocoesAtivas.map((p) => (
              <Link
                key={p.id}
                href={`/promocoes/${p.id}`}
                className="relative bg-brand-dark rounded-2xl overflow-hidden min-h-[180px] flex items-end group block"
              >
                {p.imagemUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imagemUrl} alt={p.titulo} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="relative p-6 w-full">
                  <h3 className="font-heading text-white text-xl font-bold leading-tight">{p.titulo}</h3>
                  {p.subtitulo && <p className="text-white/70 text-sm mt-1">{p.subtitulo}</p>}
                  <span className="inline-flex items-center gap-1.5 mt-3 text-brand-gold text-sm font-semibold group-hover:text-white transition">
                    Saiba mais <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {imoveisAleatorios.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-brand-dark">Conheça também</h2>
            <Link href="/imoveis" className="text-sm font-medium text-brand-goldVivid hover:underline">
              Ver todos os imóveis
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {imoveisAleatorios.map((imovel) => (
              <PropertyCard key={imovel.id} imovel={imovelParaResumo(imovel)} />
            ))}
          </div>
        </section>
      )}

      {/* Seção de artigos recentes do blog */}
      {blogHomepageHabilitado && artigosRecentes.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-goldVivid" />
              <h2 className="font-heading text-2xl font-bold text-brand-dark">Do nosso blog</h2>
            </div>
            <Link href="/blog" className="text-sm font-medium text-brand-goldVivid hover:underline">
              Ver todos os artigos
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artigosRecentes.map((artigo) => (
              <Link
                key={artigo.id}
                href={`/blog/${artigo.slug}`}
                className="group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                {artigo.imagemCapaUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artigo.imagemCapaUrl}
                    alt={artigo.titulo}
                    className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform"
                  />
                )}
                <div className="p-5">
                  {artigo.categoria && (
                    <span className="text-xs font-semibold text-brand-goldVivid uppercase tracking-wide">
                      {artigo.categoria}
                    </span>
                  )}
                  <h3 className="font-heading font-bold text-brand-dark mt-1 text-base leading-snug group-hover:text-brand-goldVivid transition-colors">
                    {artigo.titulo}
                  </h3>
                  {artigo.resumo && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{artigo.resumo}</p>
                  )}
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand-goldVivid">
                    Ler artigo <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
