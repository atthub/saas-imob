-- =============================================================================
-- SQL DE ATUALIZAÇÃO COMPLETA — Plataforma Imobiliária SaaS
-- Execute este script no phpMyAdmin de CADA cliente que ainda não foi atualizado.
-- Todas as instruções usam IF NOT EXISTS — seguro rodar mesmo em bancos parcialmente atualizados.
-- Se aparecer "Duplicate column name" ou "Table already exists", pode ignorar o erro
-- e continuar com as próximas instruções.
-- =============================================================================


-- =============================================================================
-- 1. NOVAS COLUNAS EM TABELAS EXISTENTES
-- (MySQL 8.0+: ADD COLUMN IF NOT EXISTS)
-- (MySQL 5.7: comente as linhas que já existirem no seu banco)
-- =============================================================================

-- Imobiliárias: flags de funcionalidades
ALTER TABLE imobiliarias
  ADD COLUMN IF NOT EXISTS landingPagesHabilitado  TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comissoesHabilitado     TINYINT(1) NOT NULL DEFAULT 0;

-- Imóveis: campos adicionados em sessões anteriores
ALTER TABLE imoveis
  ADD COLUMN IF NOT EXISTS origemWpId           INT NULL,
  ADD COLUMN IF NOT EXISTS codigoAutomatico     TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS proprietarioId       VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS captacaoOrigemId     VARCHAR(191) NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS locatarioNome        VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS locatarioTelefone    VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS locatarioEmail       VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS locatarioObs         TEXT NULL,
  ADD COLUMN IF NOT EXISTS contratoInicio       DATETIME NULL,
  ADD COLUMN IF NOT EXISTS contratoFim          DATETIME NULL,
  ADD COLUMN IF NOT EXISTS proprietarioNome     VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS proprietarioTelefone VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS proprietarioEmail    VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS proprietarioObs      TEXT NULL;

-- Usuários: recuperação de senha
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS resetToken        VARCHAR(191) NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS resetTokenExpira  DATETIME NULL;

-- Leads: observações internas + data de direcionamento
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS observacoes   TEXT NULL,
  ADD COLUMN IF NOT EXISTS direcionadoEm DATETIME NULL;

-- Corretores: WhatsApp
ALTER TABLE corretores
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(191) NULL;


-- =============================================================================
-- 2. CARACTERÍSTICAS DO CONDOMÍNIO
-- =============================================================================

CREATE TABLE IF NOT EXISTS caracteristicas_condominio (
  id    VARCHAR(191) NOT NULL,
  nome  VARCHAR(191) NOT NULL,
  icone VARCHAR(191) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY caracteristicas_condominio_nome_key (nome)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS imovel_condominio_caracteristicas (
  imovelId         VARCHAR(191) NOT NULL,
  caracteristicaId VARCHAR(191) NOT NULL,
  PRIMARY KEY (imovelId, caracteristicaId),
  KEY imovel_condominio_caract_imovelId_fkey (imovelId),
  KEY imovel_condominio_caract_caracId_fkey (caracteristicaId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 3. CAPTAÇÕES DE IMÓVEIS
-- =============================================================================

CREATE TABLE IF NOT EXISTS captacoes (
  id               VARCHAR(191) NOT NULL,
  nomeProprietario VARCHAR(191) NOT NULL,
  telefone         VARCHAR(191) NOT NULL,
  email            VARCHAR(191) NULL,
  tipoImovel       VARCHAR(191) NULL,
  finalidade       VARCHAR(191) NULL,
  endereco         VARCHAR(191) NULL,
  cidade           VARCHAR(191) NULL,
  bairro           VARCHAR(191) NULL,
  valorPretendido  VARCHAR(191) NULL,
  descricao        TEXT NULL,
  imobiliariaId    VARCHAR(191) NOT NULL,
  status           VARCHAR(191) NOT NULL DEFAULT 'novo',
  criadoEm         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY captacoes_imobiliariaId_fkey (imobiliariaId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS captacao_fotos (
  id         VARCHAR(191) NOT NULL,
  captacaoId VARCHAR(191) NOT NULL,
  url        VARCHAR(191) NOT NULL,
  criadoEm   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY captacao_fotos_captacaoId_fkey (captacaoId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 4. PROPRIETÁRIOS (cadastro formal)
-- =============================================================================

CREATE TABLE IF NOT EXISTS proprietarios (
  id            VARCHAR(191) NOT NULL,
  nome          VARCHAR(191) NOT NULL,
  telefone      VARCHAR(191) NOT NULL,
  email         VARCHAR(191) NULL,
  observacoes   TEXT NULL,
  imobiliariaId VARCHAR(191) NOT NULL,
  criadoEm      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY proprietarios_imobiliariaId_telefone_idx (imobiliariaId, telefone)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 5. AUDITORIA
-- =============================================================================

CREATE TABLE IF NOT EXISTS auditoria (
  id            VARCHAR(191) NOT NULL,
  imobiliariaId VARCHAR(191) NULL,
  usuarioId     VARCHAR(191) NULL,
  usuarioNome   VARCHAR(191) NULL,
  acao          VARCHAR(191) NOT NULL,
  entidade      VARCHAR(191) NULL,
  entidadeId    VARCHAR(191) NULL,
  detalhes      TEXT NULL,
  ip            VARCHAR(191) NULL,
  criadoEm      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY auditoria_imobiliariaId_criadoEm_idx (imobiliariaId, criadoEm)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 6. LANDING PAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS landing_pages (
  id            VARCHAR(191) NOT NULL,
  slug          VARCHAR(191) NOT NULL,
  titulo        VARCHAR(191) NULL,
  descricao     TEXT NULL,
  cta           VARCHAR(191) NULL,
  status        VARCHAR(191) NOT NULL DEFAULT 'rascunho',
  imovelId      VARCHAR(191) NOT NULL,
  imobiliariaId VARCHAR(191) NOT NULL,
  criadoEm      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY landing_pages_slug_key (slug),
  UNIQUE KEY landing_pages_imovelId_key (imovelId),
  KEY landing_pages_imobiliariaId_fkey (imobiliariaId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 7. COMISSÕES
-- =============================================================================

CREATE TABLE IF NOT EXISTS comissoes (
  id                   VARCHAR(191) NOT NULL,
  imobiliariaId        VARCHAR(191) NOT NULL,
  imovelId             VARCHAR(191) NULL,
  corretorId           VARCHAR(191) NULL,
  descricao            VARCHAR(191) NULL,
  tipo                 VARCHAR(191) NOT NULL,
  valorImovel          DECIMAL(15,2) NOT NULL,
  percentualComissao   DECIMAL(5,2) NOT NULL DEFAULT 6.00,
  valorComissao        DECIMAL(15,2) NOT NULL,
  percentualTerceiros  DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  valorTerceiros       DECIMAL(15,2) NOT NULL,
  status               VARCHAR(191) NOT NULL DEFAULT 'pendente',
  observacoes          TEXT NULL,
  dataVenda            DATETIME NULL,
  criadoEm             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY comissoes_imobiliariaId_criadoEm_idx (imobiliariaId, criadoEm)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 8. HISTÓRICO DE INTERAÇÕES COM LEADS
-- (sem constraint de FK para evitar erro de charset/collation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS interacoes_lead (
  id            VARCHAR(191) NOT NULL,
  leadId        VARCHAR(191) NOT NULL,
  imobiliariaId VARCHAR(191) NOT NULL,
  usuarioId     VARCHAR(191) NULL,
  usuarioNome   VARCHAR(191) NULL,
  tipo          VARCHAR(191) NOT NULL DEFAULT 'NOTA',
  descricao     TEXT NOT NULL,
  dataAgendada  DATETIME NULL,
  criadoEm      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY interacoes_lead_leadId_idx (leadId),
  KEY interacoes_lead_imobiliariaId_idx (imobiliariaId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 9. MENSAGENS PRÉ-DEFINIDAS PARA WHATSAPP (NOVO — esta sessão)
-- Configuradas pelos ADMINs de cada imobiliária.
-- Variáveis: {nome}, {imovel}, {telefone}
-- =============================================================================

CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
  id            VARCHAR(191) NOT NULL,
  imobiliariaId VARCHAR(191) NOT NULL,
  titulo        VARCHAR(191) NOT NULL,
  mensagem      TEXT NOT NULL,
  ativa         TINYINT(1) NOT NULL DEFAULT 1,
  criadoEm      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY mensagens_whatsapp_imobiliariaId_idx (imobiliariaId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 10. PROMOÇÕES (campanhas e ofertas especiais)
-- =============================================================================

CREATE TABLE IF NOT EXISTS promocoes (
  id              VARCHAR(191) NOT NULL,
  imobiliariaId   VARCHAR(191) NOT NULL,
  titulo          VARCHAR(191) NOT NULL,
  subtitulo       VARCHAR(191) NULL,
  descricao       TEXT NULL,
  imagemUrl       VARCHAR(191) NULL,
  imagemUrlMobile VARCHAR(191) NULL,
  tipoLink        VARCHAR(191) NULL,
  codigoImovel    VARCHAR(191) NULL,
  link            VARCHAR(191) NULL,
  captarLeads     TINYINT(1) NOT NULL DEFAULT 0,
  ordem           INT NOT NULL DEFAULT 0,
  ativo           TINYINT(1) NOT NULL DEFAULT 1,
  dataInicio      DATETIME NULL,
  dataFim         DATETIME NULL,
  criadoEm        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY promocoes_imobiliariaId_fkey (imobiliariaId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Campo de vínculo do lead com a promoção de origem
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS promocaoId VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS origem     VARCHAR(191) NOT NULL DEFAULT 'site';

-- =============================================================================
-- 11. BLOG (artigos com SEO avançado)
-- =============================================================================

CREATE TABLE IF NOT EXISTS artigos (
  id              VARCHAR(191) NOT NULL,
  imobiliariaId   VARCHAR(191) NOT NULL,
  titulo          VARCHAR(191) NOT NULL,
  slug            VARCHAR(191) NOT NULL,
  resumo          TEXT NULL,
  conteudo        LONGTEXT NOT NULL,
  imagemCapaUrl   VARCHAR(191) NULL,
  categoria       VARCHAR(191) NULL,
  autor           VARCHAR(191) NULL,
  publicadoEm     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ativo           TINYINT(1) NOT NULL DEFAULT 1,
  metaDescricao   VARCHAR(160) NULL,
  criadoEm        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY artigos_imobiliariaId_slug_key (imobiliariaId, slug),
  KEY artigos_imobiliariaId_fkey (imobiliariaId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- =============================================================================
-- 12. NOVAS COLUNAS EM IMOBILIARIAS (funcionalidades recentes)
-- =============================================================================

-- Texto do hero (banner principal da home do site público)
ALTER TABLE imobiliarias
  ADD COLUMN IF NOT EXISTS heroTitulo    VARCHAR(70)  NOT NULL DEFAULT 'Encontre o imóvel ideal para você',
  ADD COLUMN IF NOT EXISTS heroSubtitulo VARCHAR(160) NOT NULL DEFAULT 'Compra, venda e locação com atendimento próximo e imóveis selecionados.';

-- Balão flutuante de WhatsApp na vitrine pública
ALTER TABLE imobiliarias
  ADD COLUMN IF NOT EXISTS whatsappBotaoAtivo    TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsappBotaoNumero   VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS whatsappBotaoMensagem VARCHAR(160) NOT NULL DEFAULT 'Olá! Como podemos ajudar?',
  ADD COLUMN IF NOT EXISTS whatsappBotaoPosicao  VARCHAR(191) NOT NULL DEFAULT 'bottom-right',
  ADD COLUMN IF NOT EXISTS whatsappBotaoIcone    VARCHAR(191) NOT NULL DEFAULT 'whatsapp';

-- Layout da vitrine e feed XML
ALTER TABLE imobiliarias
  ADD COLUMN IF NOT EXISTS modoDestaque  VARCHAR(191) NOT NULL DEFAULT 'grade',
  ADD COLUMN IF NOT EXISTS xmlHabilitado TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xmlToken      VARCHAR(191) NULL;

-- Toggles de funcionalidades (MCMV e Blog)
ALTER TABLE imobiliarias
  ADD COLUMN IF NOT EXISTS mcmvHabilitado          TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blogMenuHabilitado      TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS blogHomepageHabilitado  TINYINT(1) NOT NULL DEFAULT 0;

-- Paginação da vitrine (caso não exista ainda)
ALTER TABLE imobiliarias
  ADD COLUMN IF NOT EXISTS itensPorPagina INT          NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS tipoPaginacao  VARCHAR(191) NOT NULL DEFAULT 'paginada';

-- Foto original sem marca d'água (armazenada internamente)
ALTER TABLE fotos
  ADD COLUMN IF NOT EXISTS urlOriginal VARCHAR(191) NULL;


-- =============================================================================
-- FIM DO SCRIPT
-- Execute no phpMyAdmin de cada cliente. Todos os comandos usam IF NOT EXISTS —
-- seguro rodar mesmo em bancos parcialmente atualizados.
-- Após rodar, reinicie o Node.js no cPanel (Setup Node.js App → Restart).
-- =============================================================================
