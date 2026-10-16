# MedFocus

Plataforma de estudos para Medicina com flashcards de repetição espaçada (**SM-2**), simulados cronometrados e estatísticas detalhadas.

## Estrutura do Projeto

```text
MedFocus_Original/
├── frontend/          # Aplicação React 19 + Vite + Tailwind CSS v4
│   ├── public/        # Assets estáticos e _redirects (Netlify/Render)
│   ├── src/           # Componentes, páginas, hooks, contexts e utilitários
│   ├── index.html
│   ├── vercel.json    # Rewrites de SPA para Vercel
│   └── vite.config.js
├── backend/           # API REST Express + Drizzle ORM + Neon Postgres
│   └── src/
│       ├── config/    # Validação de variáveis de ambiente (Zod) e planos
│       ├── db/        # Conexão Postgres, schema Drizzle e migrações SQL
│       ├── middleware/# Autenticação Neon Auth (JWKS/EdDSA) e tratamento de erros
│       ├── routes/    # /api/me, /api/decks, /api/quizzes, /api/stats, /api/admin
│       ├── services/  # Provisionamento de perfis e algoritmo SM-2
│       └── server.js
└── package.json       # Workspaces npm (frontend + backend)
```

## Configuração Local

1. **Instale as dependências** na raiz:
   ```bash
   npm install
   ```
2. **Ative o Neon Auth** no [Console do Neon](https://console.neon.tech) (**Branch → Better Auth → Enable Auth**) e copie a **Auth Base URL**.
3. **Configure os arquivos `.env`** (nunca comitados no Git):
   - Copie `backend/.env.example` para `backend/.env` e preencha `DATABASE_URL`, `NEON_AUTH_URL`, `CORS_ORIGINS` e `ADMIN_EMAILS`.
   - Copie `frontend/.env.example` para `frontend/.env` e preencha `VITE_API_URL` e `VITE_NEON_AUTH_URL`.
4. **Inicie em desenvolvimento**:
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

## Formatos de Importação (.txt)

- **Flashcards** (1 por linha, separados por `|`):
  ```text
  Pergunta | Resposta | Explicação opcional | tag1, tag2
  ```
- **Simulados** (1 por linha, separados por `;` ou `|`):
  ```text
  Pergunta; Opção A; Opção B; Opção C; Opção D; B; Explicação opcional
  ```
