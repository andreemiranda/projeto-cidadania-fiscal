# Guia de Implantação (Deploy) – Pesquisa de Cidadania Fiscal UNITINS

Este projeto foi estruturado em **Next.js 15, React 19, TypeScript e Tailwind CSS**, com suporte a autenticação Google via **Firebase Auth**, banco de dados **Firestore** e geração de relatórios científicos em PDF via **jsPDF**.

---

## 1. Variáveis de Ambiente Necessárias (Secrets)

Configure as seguintes variáveis no painel da sua plataforma de hospedagem (Render, Cloudflare, Vercel ou no arquivo `.env.local`):

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | URL pública de produção ou desenvolvimento do app | `https://meu-app.onrender.com` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Chave de API pública do Firebase | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação do Firebase | `projeto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID do projeto no Firebase Console | `meu-projeto-unitins` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de armazenamento do Firebase | `meu-projeto.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente de mensagens | `1234567890` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID do aplicativo Web no Firebase | `1:1234567890:web:...` |
| `NEXT_PUBLIC_ADMIN_EMAILS` | E-mails autorizados para a área restrita de configurações (separados por vírgula) | `suporte.camarapa@gmail.com,admin@unitins.br` |

---

## 2. Implantação na Render.com

O projeto já inclui o arquivo `render.yaml` pronto para Blueprint.

### Passos:
1. Acesse [Render Dashboard](https://dashboard.render.com).
2. Clique em **New +** e selecione **Blueprint** (ou **Web Service**).
3. Conecte o repositório do GitHub.
4. Parâmetros de build:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Na aba **Environment**, cadastre as variáveis listadas acima.
6. Clique em **Deploy**.

---

## 3. Implantação no Cloudflare Pages / Workers

O projeto inclui o arquivo `wrangler.jsonc` compatível com Cloudflare.

### Passos:
1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages**.
2. Clique em **Create Application** > **Pages** > **Connect to Git**.
3. Selecione seu repositório.
4. Na configuração da build:
   - **Framework preset**: `Next.js`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
5. Em **Environment Variables**, adicione todas as variáveis de ambiente mencionadas acima.
6. Salve e implante (**Save and Deploy**).

---

## 4. Configuração no Firebase Console (Google Sign-In)

Para que o login com conta Google funcione em produção:
1. Acesse o [Firebase Console](https://console.firebase.google.com).
2. Vá em **Authentication** > **Sign-in method** e ative o provedor **Google**.
3. Vá na aba **Settings** > **Authorized domains** (Domínios autorizados) e adicione o domínio do seu aplicativo:
   - Exemplo Render: `pesquisa-cidadania-fiscal-unitins.onrender.com`
   - Exemplo Cloudflare: `pesquisa-cidadania-fiscal-unitins.pages.dev`
   - Exemplo AI Studio: O domínio `run.app` fornecido no ambiente de desenvolvimento.

---

## 5. Substituição da Imagem da Logomarca (Placeholder)

A logomarca está localizada no arquivo:
- `/public/banner-header.png` (e `/public/logo.png`)
- **Tamanho e proporção recomendada:** 1200px de largura por 196px de altura, formato PNG ou JPG em orientação paisagem.
- Para alterar, basta substituir este arquivo na pasta `public/` mantendo o mesmo nome ou o nome desejado.
