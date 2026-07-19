# Deploy — Plataforma Imobiliária SaaS

## Build + ZIP (rodar no seu Mac, dentro da pasta `app/`)

```bash
cd app
npm run build
```

Após a build sem erros:

```bash
cd /Users/fabianoguara/Claude/Projects/saas_imob_completo/app && zip -r ../deploy.zip .next prisma/schema.prisma package.json package-lock.json node_modules/.prisma -x ".next/cache/*"
```

O `deploy.zip` conterá (~30–80 MB):
- `.next/` — build compilada
- `prisma/schema.prisma` — schema atualizado
- `package.json` + `package-lock.json`
- `node_modules/.prisma` — Prisma Client pré-compilado com binários Linux (evita falha do NPM Install)

---

## Upload no cPanel

1. Acesse o File Manager → pasta do site
2. **Delete** (ou renomeie) a pasta `.next` antiga
3. **Upload** o `deploy.zip` e clique **Extract** na pasta raiz do projeto
4. Acesse **Node.js** → clique **"Run NPM Install"** (necessário sempre que o schema.prisma muda)
5. Clique **Restart** na aplicação Node.js

> ⚠️ **Não inclua `node_modules`** no ZIP — o cPanel recria via NPM Install.

---

## SQL — Atualizar o banco de dados

Rode o arquivo `SQL_ATUALIZACAO_COMPLETA.sql` em cada cliente via phpMyAdmin:

1. phpMyAdmin → selecione o banco do cliente
2. Aba **SQL** → cole o conteúdo do arquivo → **Executar**
3. Erros "Table already exists" ou "Duplicate column" podem ser ignorados (colunas/tabelas já existiam)

---

## Checklist por cliente

- [ ] Rodar `SQL_ATUALIZACAO_COMPLETA.sql` no phpMyAdmin
- [ ] Fazer upload do `deploy.zip`
- [ ] Extrair na pasta correta
- [ ] Run NPM Install no painel Node.js
- [ ] Restart da aplicação
- [ ] Testar login e navegação
