# Como Acessar o Banco de Dados MedFocus

## 📍 Localização do Banco
O banco de dados SQLite está em: `backend/data/medfocus.sqlite`

---

## 🔧 Método 1: Via API REST (Recomendado)

### Passo 1: Iniciar o servidor
```bash
cd backend
npm run dev
```

O servidor iniciará em `http://localhost:4000`

### Passo 2: Acessar os dados via API

#### Listar todos os alunos:
```bash
# No navegador ou terminal:
curl http://localhost:4000/api/patients

# Ou abra no navegador:
http://localhost:4000/api/patients
```

#### Buscar aluno por email:
```bash
curl http://localhost:4000/api/patients/joao@email.com
```

#### Listar eventos de login:
```bash
curl http://localhost:4000/api/login-events
```

#### Verificar se o servidor está rodando:
```bash
curl http://localhost:4000/health
```

---

## 🖥️ Método 2: Via Ferramenta Gráfica (Mais Fácil)

### Opção A: DB Browser for SQLite (Recomendado)
1. **Baixar**: https://sqlitebrowser.org/
2. **Instalar** o programa
3. **Abrir** o arquivo: `backend/data/medfocus.sqlite`
4. **Visualizar** as tabelas `patients` e `login_events`

### Opção B: SQLite Studio
1. **Baixar**: https://sqlitestudio.pl/
2. **Instalar** o programa
3. **Adicionar** banco: `backend/data/medfocus.sqlite`
4. **Navegar** pelas tabelas

### Opção C: VS Code Extension
1. **Instalar** extensão: "SQLite Viewer" ou "SQLite" no VS Code
2. **Abrir** o arquivo: `backend/data/medfocus.sqlite`
3. **Visualizar** diretamente no editor

---

## 💻 Método 3: Via Linha de Comando

### Se você tem SQLite instalado:

```bash
# Navegar até a pasta do banco
cd backend/data

# Abrir o banco
sqlite3 medfocus.sqlite

# Dentro do SQLite, você pode executar:
.tables                    # Listar tabelas
SELECT * FROM patients;    # Ver todos os alunos
SELECT * FROM login_events; # Ver eventos de login
.quit                      # Sair
```

### Instalar SQLite no Windows:
1. Baixar: https://www.sqlite.org/download.html
2. Extrair e adicionar ao PATH do sistema

---

## 📊 Estrutura das Tabelas

### Tabela `patients` (Alunos):
- `id` - ID único
- `user_id` - ID do usuário
- `name` - Nome completo
- `email` - E-mail (único)
- `phone` - Telefone
- `plan` - Plano (free/basic/premium)
- `role` - Função (student/admin)
- `is_active` - Status ativo (1) ou inativo (0)
- `notes` - Observações
- `last_login` - Último login
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### Tabela `login_events` (Eventos de Login):
- `id` - ID único
- `user_id` - ID do usuário
- `name` - Nome
- `email` - E-mail
- `plan` - Plano
- `deck_bundle` - Bundle de flashcards
- `metadata` - Dados adicionais (JSON)
- `created_at` - Data do evento

### Tabela `flashcard_decks` (Decks de Flashcards):
- `id` - ID único (auto-incremento)
- `deck_id` - ID único do deck no sistema
- `user_id` - ID do usuário proprietário
- `name` - Nome do deck
- `description` - Descrição do deck
- `category` - Categoria (medicina, cirurgia, etc.)
- `theme` - Tema do deck
- `plan` - Plano associado
- `cards` - Array JSON com os cards do deck
- `created_at` - Data de criação
- `updated_at` - Data de atualização

---

## 🚀 Início Rápido

```bash
# 1. Entrar na pasta do backend
cd backend

# 2. Iniciar o servidor
npm run dev

# 3. Em outro terminal, testar a API
curl http://localhost:4000/api/patients
```

---

## ⚠️ Importante

- O banco é criado **automaticamente** na primeira execução do servidor
- Os dados são **permanentes** até você removê-los manualmente
- O arquivo `medfocus.sqlite` contém **todos os dados**
- Faça **backup** regularmente copiando o arquivo `backend/data/medfocus.sqlite`

---

## 🔍 Exemplos de Consultas SQL

Se estiver usando uma ferramenta gráfica ou linha de comando:

```sql
-- Ver todos os alunos
SELECT * FROM patients;

-- Ver alunos premium
SELECT * FROM patients WHERE plan = 'premium';

-- Ver alunos ativos
SELECT * FROM patients WHERE is_active = 1;

-- Contar alunos por plano
SELECT plan, COUNT(*) as total FROM patients GROUP BY plan;

-- Ver últimos logins
SELECT * FROM login_events ORDER BY created_at DESC LIMIT 10;

-- Ver todos os decks de flashcards
SELECT * FROM flashcard_decks;

-- Ver decks de um usuário específico
SELECT * FROM flashcard_decks WHERE user_id = 'user_123456';

-- Ver decks por plano
SELECT * FROM flashcard_decks WHERE plan = 'premium';
```

