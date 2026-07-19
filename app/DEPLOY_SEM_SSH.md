# Como publicar o sistema no cPanel SEM usar SSH

Como o SSH não está funcionando no seu servidor, vamos fazer tudo pelo navegador: você prepara
o site no seu Mac, sobe os arquivos pelo **Gerenciador de Arquivos** do cPanel, e configura tudo
pela tela do **Setup Node.js App**. Nenhum comando precisa ser digitado dentro do servidor.

Ajustei o sistema para isso: agora, quando o site liga, ele mesmo cria as tabelas no banco e
cadastra os dados iniciais automaticamente — você só precisa apertar os botões certos no cPanel.

---

## Parte 1 — Preparar tudo no seu Mac

1. Confirme se você tem o **Node.js** instalado no Mac. Abra o **Terminal** e digite:
   ```bash
   node -v
   ```
   Se aparecer um número de versão (ex: `v20.11.0`), está instalado. Se der erro
   "command not found", baixe e instale em https://nodejs.org (botão "LTS") e repita o comando.

2. No Terminal, entre na pasta do projeto:
   ```bash
   cd "/Users/fabianoguara/Claude/Projects/Delta Imóveis/app"
   ```

3. Instale as dependências (baixa tudo que o projeto precisa):
   ```bash
   npm install
   ```
   Isso pode levar alguns minutos na primeira vez.

4. Gere a versão de produção do site:
   ```bash
   npm run build
   ```
   Se aparecer "Compiled successfully" no final, deu tudo certo.

> Você só precisa repetir esses 4 passos quando eu enviar atualizações de código.

---

## Parte 2 — Criar o banco de dados no cPanel (pelo navegador)

1. No cPanel, abra **MySQL® Databases**.
2. Em "Create New Database", digite `imobiliaria` e clique em **Create Database**.
   O nome final vai ficar `<SEU_USUARIO>_imobiliaria`.
3. Em "MySQL Users → Add New User", crie um usuário, por exemplo `imob_app`, com uma senha forte
   (anote a senha em algum lugar seguro). O usuário final vai ficar `<SEU_USUARIO>_imob_app`.
4. Em "Add User to Database", selecione esse usuário e esse banco, clique **Add**, e na tela
   seguinte marque **ALL PRIVILEGES** e confirme.
5. Anote os 3 dados finais — vamos usar na Parte 4:
   - Banco: `<SEU_USUARIO>_imobiliaria`
   - Usuário: `<SEU_USUARIO>_imob_app`
   - Senha: a que você criou

---

## Parte 3 — Enviar os arquivos para o servidor (sem terminal)

1. No Mac, ainda na pasta do projeto, crie um arquivo compactado **sem a pasta `node_modules`**
   (ela é gigante e será reconstruída no próprio servidor). No Terminal:
   ```bash
   cd "/Users/fabianoguara/Claude/Projects/Delta Imóveis/app"
   zip -r ../projeto-imobiliaria.zip . -x "node_modules/*" -x ".git/*"
   ```
   Isso cria o arquivo `projeto-imobiliaria.zip` uma pasta acima.

2. No cPanel, abra **Gerenciador de Arquivos (File Manager)**.
3. Crie uma pasta nova na raiz da sua conta (geralmente ao lado de `public_html`), chamada por
   exemplo `imobiliaria`. Para isso: clique em **+ Pasta** no menu superior, dê o nome
   `imobiliaria` e confirme.

   > Importante: essa pasta deve ficar **fora** de `public_html`. O site vai funcionar através
   > do Node.js App, não direto pela pasta pública.

4. Entre na pasta `imobiliaria` recém-criada.
5. Clique em **Upload** no menu superior, e envie o arquivo `projeto-imobiliaria.zip` que está
   no seu Mac. Aguarde a barra de progresso terminar (pode levar alguns minutos, dependendo do
   tamanho).
6. Volte para a listagem de arquivos (botão "Voltar" ou recarregue a página), clique com o botão
   direito (ou selecione e use o menu superior) no arquivo `projeto-imobiliaria.zip` e escolha
   **Extract** / **Extrair**.
7. Depois de extrair, você pode apagar o `.zip` para economizar espaço (selecione o arquivo →
   **Delete**).

---

## Parte 4 — Criar a aplicação Node.js no cPanel

1. No cPanel, abra **Setup Node.js App**.
2. Clique em **Create Application**.
3. Preencha:
   - **Node.js version**: a mais recente disponível (18 ou superior)
   - **Application mode**: `Production`
   - **Application root**: `imobiliaria` (a pasta que você criou na Parte 3)
   - **Application URL**: o domínio/subdomínio onde o site vai ficar
   - **Application startup file**: `server.js`
4. Role até **"Environment variables"** (ou "Variáveis de Ambiente") — é aqui que vamos
   configurar o sistema, sem precisar editar nenhum arquivo `.env` manualmente. Clique em
   **"Add Variable"** e adicione, uma por uma:

   | Nome (Key)              | Valor (Value) |
   |--------------------------|---------------|
   | `DATABASE_URL`           | `mysql://<SEU_USUARIO>_imob_app:<SENHA_DO_BANCO>@localhost:3306/<SEU_USUARIO>_imobiliaria` |
   | `JWT_SECRET`             | uma frase aleatória bem longa, ex: `delta-pinda-2026-x9k2-segredo-troque-isso` |
   | `NEXT_PUBLIC_SITE_URL`   | `https://seudominio.com.br` |
   | `UPLOADS_DIR`            | `/home/<SEU_USUARIO>/imobiliaria/public/uploads` |
   | `DEFAULT_TENANT_SLUG`    | `delta-imoveis-pinda` |

   Troque `<SEU_USUARIO>`, `<SENHA_DO_BANCO>` e `seudominio.com.br` pelos seus valores reais.

5. Clique em **Create** (ou **Save**) para criar a aplicação.

---

## Parte 5 — Instalar as dependências (botão, sem terminal)

1. Ainda na tela do **Setup Node.js App**, encontre a aplicação que você acabou de criar na
   lista e clique para abrir os detalhes dela.
2. Procure o botão **"Run NPM Install"**. Clique nele e aguarde — essa é a etapa que monta o
   `node_modules` certinho para o servidor (mesmo que você já tenha rodado `npm install` no
   Mac, isso aqui é obrigatório porque o servidor é Linux e seu Mac não é).
3. Quando terminar (geralmente aparece uma mensagem de sucesso), volte para a tela principal da
   aplicação.

> Se você não encontrar o botão "Run NPM Install" na sua versão de cPanel, me avise — existe
> uma forma alternativa usando o terminal web do próprio cPanel (diferente do SSH), e eu te
> passo o caminho.

---

## Parte 6 — Criar a pasta de uploads

1. Volte ao **Gerenciador de Arquivos**, entre na pasta `imobiliaria` → `public`.
2. Crie uma nova pasta chamada `uploads` (botão **+ Pasta**).
3. Selecione essa pasta, clique em **Permissions** (botão do menu, ou botão direito →
   "Change Permissions"), e marque todas as caixas de **Leitura, Gravação e Execução** para o
   "Owner" (deixe pelo menos leitura/execução para Group e World). Confirme.

---

## Parte 7 — Iniciar o site

1. Volte para **Setup Node.js App**, encontre sua aplicação e clique em **Restart**
   (ou **Start**, se for a primeira vez ligando).
2. Espere uns 10-20 segundos (na primeira vez, o sistema vai criar as tabelas do banco e os
   dados iniciais automaticamente nesse momento).
3. Acesse `https://seudominio.com.br` no navegador — deve aparecer a página inicial do sistema.
4. Acesse `https://seudominio.com.br/admin/login` e entre com:
   - E-mail: `admin@deltaimoveispinda.com.br`
   - Senha: `delta2026`
5. Se conseguir entrar e ver o Dashboard, está tudo funcionando! Troque essa senha o quanto
   antes (me avise que eu já preparo a tela de troca de senha na próxima etapa).

---

## Como ver se algo deu errado

1. Em **Setup Node.js App**, abra os detalhes da sua aplicação.
2. Procure por um link/botão de **"Errors Log"** ou ícone de log — ele mostra o que aconteceu
   quando o site tentou ligar (por exemplo, se a senha do banco estiver errada, vai aparecer
   uma mensagem sobre conexão com o MySQL).
3. Copie o texto do erro e me envie — eu te digo exatamente o que ajustar.

Erros mais comuns:
- **"Access denied for user"** → a `DATABASE_URL` está com usuário/senha errados (revise a
  Parte 4).
- **Página em branco / 503** → clique em "Restart" de novo; se persistir, veja o log de erros.
- **Fotos não aparecem** → confira se a pasta `public/uploads` foi criada e tem permissão de
  escrita (Parte 6).

---

## Atualizações futuras (quando eu enviar código novo)

1. Repita a **Parte 1** no Mac (`npm install` + `npm run build`).
2. Gere um novo `.zip` (Parte 3, passo 1).
3. No Gerenciador de Arquivos, dentro da pasta `imobiliaria`, apague os arquivos antigos do
   projeto (mas **não apague** a pasta `public/uploads` nem o `node_modules`, se quiser manter
   as fotos e evitar reinstalar tudo) e suba/extraia o novo zip no lugar.
4. Clique em **Restart** na aplicação dentro de **Setup Node.js App**.
