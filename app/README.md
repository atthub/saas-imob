# Plataforma Imobiliária (SaaS) — Delta Imóveis Pinda

Sistema completo para imobiliárias: vitrine pública, painel administrativo, captação de leads,
cadastro de imóveis com fotos/vídeos/mapa, gestão de corretores e templates customizáveis por
imobiliária (multi-tenant).

Este é o **módulo 1** do projeto: estrutura base, banco de dados e cadastro completo de imóveis.
Os próximos módulos (vitrine pública, leads/corretores, captação, banners, templates) serão
construídos nas próximas etapas.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + MySQL (compatível com phpMyAdmin do cPanel)
- Autenticação própria (JWT em cookie httpOnly)
- Mapa: OpenStreetMap + Leaflet (gratuito, sem chave de API)
- Marca d'água nas fotos: biblioteca `sharp`

## Como rodar localmente (ou no Terminal do cPanel)

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**
   Copie `.env.example` para `.env` e preencha com os dados do seu banco MySQL (criado no
   phpMyAdmin do cPanel) e demais configurações:
   ```bash
   cp .env.example .env
   ```

3. **Criar as tabelas no banco** (gera o schema a partir do `prisma/schema.prisma`)
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
   Se for a primeira vez (banco vazio), pode usar:
   ```bash
   npx prisma migrate dev --name inicial
   ```

4. **Popular dados iniciais** (cria a imobiliária Delta Imóveis Pinda, usuário admin e catálogo
   de características)
   ```bash
   npm run seed
   ```
   Login inicial gerado: `admin@deltaimoveispinda.com.br` / senha `delta2026`
   (**troque a senha após o primeiro acesso** — funcionalidade de troca de senha será adicionada
   no módulo de configurações).

5. **Build e start (produção)**
   ```bash
   npm run build
   npm run start
   ```

## Publicando no cPanel

1. No cPanel, crie o banco de dados em **MySQL Databases**, anote usuário/senha/nome do banco e
   monte a `DATABASE_URL` no formato:
   `mysql://usuario:senha@localhost:3306/nome_do_banco`

2. Em **Setup Node.js App**, crie uma aplicação Node.js apontando para a pasta deste projeto,
   versão do Node 18 ou superior, comando de inicialização `npm run start` (após o build).

3. Envie os arquivos do projeto (exceto `node_modules` e `.next`) via FTP/Git, depois use o
   **Terminal** disponível no cPanel (ou o botão "Run NPM Install" do Node.js Selector) para
   rodar `npm install`, `npx prisma migrate deploy` e `npm run build`.

4. Configure a pasta de uploads (`UPLOADS_DIR` no `.env`) para um caminho dentro de
   `public_html`, garantindo que o Node tenha permissão de escrita nela.

5. Reinicie a aplicação Node pelo painel do cPanel após qualquer alteração de código ou `.env`.

## O que já está pronto (Módulo 1)

- Banco de dados multi-tenant completo (imobiliárias, usuários, corretores, imóveis, fotos,
  vídeos, características, características de condomínio, leads, captação, cidades/bairros,
  redes sociais, banners, templates).
- Login do painel administrativo.
- Cadastro completo de imóvel: código automático/manual, venda/locação/ambos com valores
  distintos, área e cômodos, características do imóvel e do condomínio, endereço com mapa
  opcional (clique ou busca por endereço), upload de fotos com marca d'água automática,
  marcação de destaque.
- API de leads (`POST /api/leads`) já pronta para receber o formulário de interesse da vitrine
  pública (próxima etapa) e API de direcionamento de lead para corretor.
- Dashboard inicial com contadores e ranking de imóveis mais visualizados.

## Próximas etapas

1. Vitrine pública (home com busca, página do imóvel, botão de interesse, compartilhamento).
2. Módulo de corretores + listagem/direcionamento de leads no painel.
3. Captação de imóveis (formulário público com captcha).
4. Templates de vitrine + seleção de cores por imobiliária.
5. Banners rotativos (desktop/mobile) e configurações gerais da imobiliária (logo, redes sociais).
