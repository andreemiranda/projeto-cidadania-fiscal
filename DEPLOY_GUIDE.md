# Guia Completo de Implantação (Deploy) – Pesquisa de Cidadania Fiscal UNITINS

Este projeto foi estruturado em **Next.js 15, React 19, TypeScript e Tailwind CSS**, com suporte a autenticação Google via **Firebase Auth**, banco de dados **Firestore** e geração de relatórios científicos em PDF via **jsPDF**.

---

## 1. Variáveis de Ambiente (Environment Variables)

Para o perfeito funcionamento da aplicação em produção, as seguintes variáveis de ambiente devem ser configuradas na plataforma de hospedagem:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | URL pública da sua aplicação | `https://meu-app.onrender.com` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Chave de API pública do Firebase | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação do Firebase | `projeto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID do projeto no Firebase Console | `meu-projeto-unitins` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de armazenamento do Firebase | `meu-projeto.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente de mensagens | `1234567890` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID do aplicativo Web no Firebase | `1:1234567890:web:...` |
| `NEXT_PUBLIC_ADMIN_EMAILS` | E-mails autorizados para acesso restrito (separados por vírgula) | `seu.email@gmail.com,admin@unitins.br` |

---

## 2. Implantação na Render.com

A [Render](https://render.com) é ideal para hospedar o backend/SSR do Next.js sem dificuldades.

### Método 1: Utilizando Blueprint (Automático)
O projeto já conta com um arquivo `render.yaml` na raiz para configuração automática:
1. Conecte sua conta do GitHub na plataforma Render.
2. No painel (Dashboard), clique em **New +** e selecione **Blueprint**.
3. Selecione o repositório deste projeto.
4. O Render lerá o `render.yaml` automaticamente. Confirme e preencha as Variáveis de Ambiente solicitadas.
5. Clique em **Apply** e aguarde a finalização.

### Método 2: Configuração Manual (Web Service)
1. No painel da Render, clique em **New +** e escolha **Web Service**.
2. Selecione seu repositório no GitHub.
3. Configure os seguintes parâmetros fundamentais:
   - **Environment / Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Vá em **Environment Variables** (ou Advanced) e insira todas as variáveis listadas no passo 1.
5. Clique em **Create Web Service** e o deploy será iniciado.

---

## 3. Implantação no Cloudflare Pages / Workers

O Cloudflare possui excelente suporte para as rotas e SSR do Next.js utilizando o adaptador `@cloudflare/next-on-pages` de maneira transparente.

### Configurando o Deploy
1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com) e clique na seção **Workers & Pages**.
2. Clique no botão **Create Application**.
3. Selecione a aba **Pages** e depois **Connect to Git**.
4. Autorize a conta e selecione este repositório.
5. Na tela de Configurações de Build (*Set up builds and deployments*):
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages@1`
   - **Build output directory**: `.vercel/output/static`
6. Expanda a seção **Environment variables (advanced)** e adicione todas as variáveis do Firebase e Admin listadas no início deste guia. (Adicione também `NODE_VERSION = 20` se necessário).
7. Clique em **Save and Deploy**. O Cloudflare irá processar o build do Next.js para a rede Edge.

**Atenção Cloudflare Next.js:** O arquivo `wrangler.jsonc` incluído no projeto pode ser utilizado para testar localmente via `npm run dev` com o ambiente do Cloudflare.

---

## 4. Configuração no Firebase (Google Sign-In e Firestore)

Para que o login Google e os salvamentos funcionem no seu novo domínio, você precisa autorizar a sua URL:

1. Acesse o [Firebase Console](https://console.firebase.google.com).
2. Vá em **Authentication** > **Settings** (Configurações) > **Authorized domains** (Domínios autorizados).
3. Adicione o domínio final do seu app (ex: `meu-app.onrender.com` ou `meu-app.pages.dev`).
4. Se o banco de dados falhar devido a permissões de acesso (Firestore Rules), vá em **Firestore Database** > **Rules** e configure-as conforme seu ambiente (ex: `allow read, write: if request.auth != null;` para usuários autenticados).

---

## 5. Manutenção e Comandos Locais

Durante o desenvolvimento na sua máquina local, os comandos base são:
- Instalar dependências: `npm install`
- Iniciar ambiente local: `npm run dev`
- Simular build produtivo: `npm run build`
- Iniciar simulação produtiva: `npm run start`
