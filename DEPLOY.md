# Guia de Implantação (Deploy) – UNITINS Cidadania Fiscal

Este projeto está 100% preparado e homologado para implantação em produção no **Render** e no **Cloudflare Pages / Workers**.

---

## 1. Implantação no Render (Web Service)

O Render executará a aplicação como um serviço web Node.js completo via `npm run build` e `npm run start`.

### Passos:
1. Conecte seu repositório GitHub ao painel do [Render](https://dashboard.render.com/).
2. Clique em **New +** e selecione **Web Service** (ou utilize o arquivo `render.yaml` via Blueprint).
3. Defina as seguintes configurações:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Node Version**: `20` ou superior.
4. Adicione as Variáveis de Ambiente no painel do Render (**Environment Variables**):
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_ADMIN_EMAILS`: `suporte.camarapa@gmail.com`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: *(sua chave do Firebase)*
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: *(seu auth domain do Firebase)*
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: *(seu project id do Firebase)*
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: *(seu storage bucket)*
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: *(seu sender id)*
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: *(seu app id)*
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: *(seu measurement id)*

---

## 2. Implantação no Cloudflare Pages / Worker

O projeto possui compatibilidade com Cloudflare Pages com flags `nodejs_compat`.

### Passos via Painel do Cloudflare Pages:
1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Selecione o repositório do projeto.
3. Configure os parâmetros de build:
   - **Framework preset**: `Next.js`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
4. Em **Environment variables**, insira as variáveis idênticas listadas no passo do Render.
5. Em **Compatibility Flags**, certifique-se de ativar: `nodejs_compat`.
6. Clique em **Save and Deploy**.

### Passos via CLI (Wrangler):
```bash
npm install -g wrangler
npx wrangler pages deploy .next
```
---

## 3. Segurança e Auditoria Integrada
- **Unicidade por Conta Google**: Bloqueia respostas duplicadas pelo mesmo e-mail Google.
- **Unicidade por Dispositivo (Browser ID)**: Identifica e bloqueia múltiplas respostas a partir do mesmo dispositivo físico.
- **Validação de Maioridade**: Impede preenchimento de menores de 18 anos.
- **Acesso Restrito às Configurações**: Restrito a contas registradas como administradoras (`suporte.camarapa@gmail.com`).
- **Relatório PDF Científico**: Emissão de relatório técnico completo no padrão ABNT com gráficos e lista nominal de participantes.
