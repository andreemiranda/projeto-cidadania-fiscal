# Guia de Implantação (Deploy) – UNITINS Cidadania Fiscal

Este projeto está 100% preparado e homologado para implantação em produção no **Render** (com PostgreSQL gerenciado) e no **Cloudflare Pages / Vercel**.

---

## 1. Arquitetura de Persistência Dupla (PostgreSQL + Firestore)

- **PostgreSQL (via Prisma)**: Atua como fonte de verdade transacional, garantindo as restrições estritas de unicidade (`userId`, `userEmail`, `browserId`, `ipAddress`) e auditoria acadêmica.
- **Google Cloud Firestore**: Atua como camada de espelhamento assíncrono em tempo real, alimentando os dashboards administrativos via `onSnapshot` sem necessidade de recarregar a página.
- **Tabela de Reconciliação (`SyncFailure`)**: Caso o espelhamento no Firestore oscile após o voto ser computado no Postgres, a falha é registrada e pode ser resolvida pelo botão **Ressincronizar Firestore** no painel administrativo.
- **Análise Qualitativa com Gemini 2.5 Flash**: Síntese automática de respostas dissertativas no servidor via `@google/genai` e incorporação no relatório científico em PDF.

---

## 2. Implantação no Render (com Blueprint automático)

O Render executará a aplicação como um serviço web Node.js completo acoplado a um banco PostgreSQL via `render.yaml`.

### Passos:
1. Conecte seu repositório GitHub ao painel do [Render](https://dashboard.render.com/).
2. Clique em **New +** e selecione **Blueprint**.
3. Selecione o repositório deste projeto (`render.yaml` configurado).
4. O Render provisionará automaticamente:
   - Banco de Dados PostgreSQL (`unitins-fiscal-db`)
   - Web Service Next.js 15
5. Configure as Variáveis de Ambiente no painel do Render (**Environment Variables**):
   - `DATABASE_URL`: *(gerenciada automaticamente pelo Blueprint)*
   - `GEMINI_API_KEY`: *(sua chave da API Google Gemini para análise qualitativa)*
   - `NEXT_PUBLIC_ADMIN_EMAILS`: `suporte.camarapa@gmail.com`
   - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`: `false` *(em produção oficial)*
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: *(sua chave do Firebase)*
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: *(seu auth domain do Firebase)*
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: *(seu project id do Firebase)*
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: *(seu storage bucket)*
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: *(seu sender id)*
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: *(seu app id)*
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: *(seu measurement id)*

### Migração do Banco:
O script `postinstall` no `package.json` gera o cliente Prisma automaticamente. Para aplicar o schema no banco PostgreSQL:
```bash
npx prisma db push
```

---

## 3. Implantação no Cloudflare Pages / Vercel

1. Importe o repositório na plataforma.
2. Defina `DATABASE_URL` apontando para o seu banco PostgreSQL (Supabase, Neon, RDS ou Render).
3. Configure `GEMINI_API_KEY` para síntese qualitativa inteligente.
4. Execute `npm run build`.

---

## 4. Segurança e Integridade Acadêmica
- **Unicidade Tripla**: Bloqueio de respostas duplicadas por conta Google, Browser ID e IP.
- **Cookie HTTP-Only**: Previne submissões múltiplas na mesma sessão do navegador.
- **Validação de Maioridade**: Bloqueia respostas de menores de 18 anos.
- **Acesso Administrativo Restrito**: Apenas contas autorizadas em `NEXT_PUBLIC_ADMIN_EMAILS`.
- **Relatório PDF Científico**: Formatação institucional UNITINS/UAB com gráficos estatísticos e síntese qualitativa por IA.
