# Guia Completo de Implantação (Deploy) – Pesquisa de Cidadania Fiscal UNITINS

Este projeto foi estruturado em **Next.js 15, React 19, TypeScript e Tailwind CSS**, com autenticação Google via **Firebase Auth**, banco transacional **PostgreSQL (Prisma)**, sincronização em tempo real **Firestore**, síntese qualitativa com **Google Gemini 2.5 Flash** e geração de relatórios científicos em PDF via **jsPDF**.

---

## 1. Variáveis de Ambiente (Environment Variables)

Para o perfeito funcionamento da aplicação em produção, as seguintes variáveis de ambiente devem ser configuradas na plataforma de hospedagem:

| Variável | Descrição | Exemplo / Obrigatoriedade |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@host:5432/cidadania_fiscal?schema=public` (Obrigatória) |
| `GEMINI_API_KEY` | Chave de API do Google Gemini para síntese cognitiva qualitativa | `AIzaSy...` (Opcional, com fallback estatístico elegante) |
| `NEXT_PUBLIC_APP_URL` | URL pública da sua aplicação | `https://meu-app.onrender.com` |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | Habilita botões de demonstração para testes | `false` em produção |
| `NEXT_PUBLIC_ADMIN_EMAILS` | E-mails com acesso ao painel de controle | `suporte.camarapa@gmail.com,admin@unitins.br` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Chave pública do Firebase | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação do Firebase | `projeto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID do projeto no Firebase | `meu-projeto-unitins` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de armazenamento do Firebase | `meu-projeto.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente de mensagens | `1234567890` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID do aplicativo Web no Firebase | `1:1234567890:web:...` |

---

## 2. Configuração do Banco de Dados PostgreSQL (Prisma)

Antes de iniciar a aplicação em produção, certifique-se de que a estrutura das tabelas está sincronizada:

```bash
# Aplica o schema Prisma no banco PostgreSQL
npx prisma db push

# Gera os tipos TypeScript do Prisma Client
npx prisma generate
```

O `package.json` já inclui um script `postinstall` configurado para executar `prisma generate` automaticamente em cada `npm install`.

---

## 3. Implantação na Render.com

A [Render](https://render.com) é ideal para hospedar a aplicação e o banco PostgreSQL integrados.

### Método Automático: Blueprint com `render.yaml`
1. Conecte sua conta do GitHub na plataforma Render.
2. No painel (Dashboard), clique em **New +** e selecione **Blueprint**.
3. Selecione o repositório deste projeto.
4. O Render lerá o arquivo `render.yaml`, criando o banco PostgreSQL e o Web Service configurados.
5. Preencha as variáveis de ambiente sensíveis (`GEMINI_API_KEY`, Firebase keys) e clique em **Apply**.

---

## 4. Recursos de Integridade Acadêmica Implementados
- **Persistência Dupla**: PostgreSQL como fonte transacional oficial e Firestore como camada de cache e tempo real.
- **Ressincronização sob Demanda**: Botão no painel administrativo para verificar e espelhar dados ausentes no Firestore.
- **Prevenção de Fraudes**: Verificação simultânea de e-mail Google, fingerprint de hardware (Browser ID), IP e cookie HTTP-only.
- **Inteligência Artificial (Gemini 2.5)**: Análise temática e percepção dos cidadãos incorporada ao relatório acadêmico em PDF.
