# Como publicar o sistema no cPanel (passo a passo pelo Mac)

Este guia assume que você não tem experiência técnica e vai te levar do zero até o sistema
funcionando no seu domínio. Siga na ordem, sem pular etapas. Sempre que aparecer algo entre
`< >`, substitua pelo valor real (sem os sinais `< >`).

---

## Parte 1 — Pegar os dados de acesso SSH no cPanel

1. No cPanel, abra **SSH Access**.
2. Você vai precisar de três informações, que aparecem nessa tela ou na tela inicial do cPanel
   (geralmente no canto superior direito, em "Informações da Conta" / "Server Information"):
   - **Host** (geralmente algo como `seudominio.com.br` ou um endereço tipo `server123.hostgator.com.br`)
   - **Porta SSH** (na maioria das vezes é `22`, mas alguns provedores usam outra, como `2222` —
     isso aparece na própria tela de SSH Access ou em "Server Information")
   - **Usuário cPanel** (o mesmo usuário que você usa para entrar no cPanel)
3. Anote essas 3 informações. Vamos chamá-las de `<USUARIO>`, `<HOST>` e `<PORTA>` no restante
   do guia.

---

## Parte 2 — Criar uma chave SSH no seu Mac (mais seguro que senha)

1. Abra o aplicativo **Terminal** no Mac (Spotlight → digite "Terminal" → Enter).
2. Digite o comando abaixo e aperte Enter (ele cria um par de chaves de acesso):
   ```bash
   ssh-keygen -t ed25519 -C "imobiliaria-deploy"
   ```
3. Ele vai perguntar onde salvar — aperte **Enter** para aceitar o local padrão.
4. Ele vai perguntar uma senha (passphrase) — pode apertar **Enter** duas vezes para deixar
   sem senha, ou definir uma senha se preferir mais segurança.
5. Ao final, ele mostra onde salvou. O arquivo público é `~/.ssh/id_ed25519.pub`. Para ver o
   conteúdo dele, rode:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
6. Copie todo o texto que aparecer (começa com `ssh-ed25519 ...`).

7. Volte para o cPanel, em **SSH Access**, clique em **"Manage SSH Keys"**.
8. Clique em **"Import Key"**.
9. Cole a chave pública copiada no campo correspondente, dê um nome (ex: `mac-fabiano`) e salve.
10. Depois de importada, clique em **"Manage"** ao lado da chave e depois em **"Authorize"**
    (isso autoriza a chave a acessar a conta via SSH).

---

## Parte 3 — Conectar do Mac no servidor

No Terminal do Mac, digite (trocando pelos seus dados):

```bash
ssh -p <PORTA> <USUARIO>@<HOST>
```

Exemplo real:
```bash
ssh -p 22 deltaimoveis@deltaimoveispinda.com.br
```

Se aparecer uma pergunta sobre "continuar conectando" (fingerprint), digite `yes` e aperte
Enter. Se conectar com sucesso, você verá o prompt do servidor mudar (algo como
`[deltaimoveis@server ~]$`). Pronto, você está dentro do servidor.

Digite `exit` para sair, por enquanto — vamos preparar os arquivos antes.

---

## Parte 4 — Criar o banco de dados MySQL no cPanel

1. No cPanel, abra **MySQL® Databases**.
2. Em "Create New Database", digite um nome, por exemplo `imobiliaria`, e clique em **Create
   Database**. O nome final do banco vai ficar algo como `<USUARIO>_imobiliaria` (o cPanel
   sempre prefixa com seu usuário).
3. Em "MySQL Users → Add New User", crie um usuário (ex: `imob_app`) e uma senha forte
   (anote essa senha). O usuário final vai ficar `<USUARIO>_imob_app`.
4. Em "Add User to Database", selecione o usuário e o banco criados, clique em **Add**, e na
   tela seguinte marque **ALL PRIVILEGES** e confirme.
5. Anote os 3 dados finais:
   - Nome do banco: `<USUARIO>_imobiliaria`
   - Usuário: `<USUARIO>_imob_app`
   - Senha: a que você definiu

---

## Parte 5 — Enviar os arquivos do projeto para o servidor

No seu Mac, abra o Terminal **na pasta do projeto** (a pasta `app` que foi criada):

```bash
cd "/Users/fabianoguara/Claude/Projects/Delta Imóveis/app"
```

Crie um pacote compactado, excluindo o que não precisa subir:

```bash
zip -r ../projeto-imobiliaria.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"
```

Envie esse arquivo para o servidor via `scp` (cópia segura por SSH):

```bash
scp -P <PORTA> ../projeto-imobiliaria.zip <USUARIO>@<HOST>:~/
```

Isso vai colocar o arquivo `projeto-imobiliaria.zip` na pasta raiz do seu usuário no servidor.

Agora conecte de novo via SSH e descompacte:

```bash
ssh -p <PORTA> <USUARIO>@<HOST>
mkdir -p ~/imobiliaria
unzip ~/projeto-imobiliaria.zip -d ~/imobiliaria
```

A partir de agora, o projeto está em `~/imobiliaria` no servidor (caminho completo:
`/home/<USUARIO>/imobiliaria`).

> Dica: toda vez que eu (Claude) fizer atualizações no código, repita só a Parte 5 (gerar o
> zip novo e enviar) — não precisa repetir as partes 1 a 4.

---

## Parte 6 — Criar a aplicação Node.js no cPanel

1. No cPanel, abra **Setup Node.js App**.
2. Clique em **Create Application**.
3. Preencha:
   - **Node.js version**: escolha a mais recente disponível (18 ou superior).
   - **Application mode**: `Production`
   - **Application root**: `imobiliaria` (a pasta que você criou na Parte 5)
   - **Application URL**: o domínio ou subdomínio onde o site vai ficar (ex:
     `deltaimoveispinda.com.br`)
   - **Application startup file**: `server.js`
4. Clique em **Create**.
5. Na tela que aparece depois de criar, o cPanel mostra um comando parecido com este (copie
   exatamente o que aparecer na sua tela, o caminho muda por servidor):
   ```bash
   source /home/<USUARIO>/nodevenv/imobiliaria/18/bin/activate && cd /home/<USUARIO>/imobiliaria
   ```
   Isso é o comando que "liga" o ambiente Node certinho antes de rodar os comandos da Parte 7.

---

## Parte 7 — Instalar dependências e configurar o sistema

Conecte via SSH novamente:
```bash
ssh -p <PORTA> <USUARIO>@<HOST>
```

Cole o comando que o cPanel te deu no final da Parte 6 (o `source ... && cd ...`) e aperte
Enter. Seu prompt deve mostrar algo como `(imobiliaria) [usuario@server imobiliaria]$`.

Agora, dentro dessa pasta, crie o arquivo de configuração:
```bash
cp .env.example .env
nano .env
```

Isso abre um editor de texto simples. Ajuste as linhas:

```
DATABASE_URL="mysql://<USUARIO>_imob_app:<SENHA_DO_BANCO>@localhost:3306/<USUARIO>_imobiliaria"
JWT_SECRET="<gere-uma-frase-aleatoria-longa-aqui>"
NEXT_PUBLIC_SITE_URL="https://deltaimoveispinda.com.br"
UPLOADS_DIR="/home/<USUARIO>/imobiliaria/public/uploads"
DEFAULT_TENANT_SLUG="delta-imoveis-pinda"
```

Para salvar no `nano`: aperte `Ctrl+O`, depois `Enter`, depois `Ctrl+X` para sair.

Crie a pasta de uploads:
```bash
mkdir -p public/uploads
```

Agora instale as dependências (isso pode levar alguns minutos):
```bash
npm install
```

Crie as tabelas no banco de dados:
```bash
npx prisma migrate deploy
npx prisma generate
```

Se for a *primeira instalação* e o comando acima reclamar que não existe migration, use:
```bash
npx prisma migrate dev --name inicial
```

Popule os dados iniciais (cria a imobiliária, usuário admin e catálogo de características):
```bash
npm run seed
```

Gere a versão de produção do site:
```bash
npm run build
```

---

## Parte 8 — Iniciar o site

1. Volte para **Setup Node.js App** no cPanel.
2. Encontre sua aplicação na lista e clique em **Restart** (ou **Start**, se for a primeira
   vez).
3. Acesse `https://seudominio.com.br` no navegador — deve aparecer a página inicial.
4. Acesse `https://seudominio.com.br/admin/login` e entre com:
   - E-mail: `admin@deltaimoveispinda.com.br`
   - Senha: `delta2026`
5. **Troque essa senha o quanto antes** (a tela de troca de senha será adicionada em uma
   próxima etapa do projeto — por enquanto, me avise se quiser que eu já gere uma senha nova
   diretamente no banco).

---

## Solução de problemas comuns

- **Página em branco ou erro 503**: volte em "Setup Node.js App", clique em "Restart" e depois
  abra os logs (botão de log da aplicação) para ver a mensagem de erro exata. Me envie o texto
  do erro e eu te ajudo a resolver.
- **Erro relacionado a "Prisma Client" ou "Query Engine"**: rode novamente
  `npx prisma generate` dentro da pasta do projeto (com o ambiente Node ativado, igual na
  Parte 7) e depois reinicie a aplicação no cPanel.
- **Erro de conexão com o banco**: confira se o usuário foi mesmo adicionado ao banco com todos
  os privilégios (Parte 4) e se a `DATABASE_URL` no `.env` está exatamente igual ao que você
  anotou (sem espaços extras).
- **Fotos não aparecem depois do upload**: confirme que a pasta `public/uploads` existe e que o
  usuário do cPanel tem permissão de escrita nela (`chmod -R 755 public/uploads`).

---

## Resumo do que rodar a cada atualização de código

Sempre que eu enviar uma nova versão do código, no seu Mac:
```bash
cd "/Users/fabianoguara/Claude/Projects/Delta Imóveis/app"
zip -r ../projeto-imobiliaria.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"
scp -P <PORTA> ../projeto-imobiliaria.zip <USUARIO>@<HOST>:~/
```

No servidor (via SSH, com o ambiente Node ativado):
```bash
rm -rf ~/imobiliaria_old && mv ~/imobiliaria ~/imobiliaria_old
unzip ~/projeto-imobiliaria.zip -d ~/imobiliaria
cp ~/imobiliaria_old/.env ~/imobiliaria/.env
cp -r ~/imobiliaria_old/public/uploads ~/imobiliaria/public/uploads
cd ~/imobiliaria
npm install
npx prisma migrate deploy
npm run build
```
E reiniciar a aplicação em **Setup Node.js App** no cPanel.
