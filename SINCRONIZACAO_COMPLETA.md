# 🔄 Sincronização Completa com Banco de Dados

## ✅ Funcionalidades Implementadas

O sistema agora está totalmente integrado com o banco de dados SQLite, permitindo que dados criados em qualquer dispositivo (celular, tablet, computador) sejam automaticamente sincronizados e visíveis no banco de dados.

### 📊 Dados Sincronizados

1. **Perfil do Usuário**
   - Nome
   - Email
   - Telefone
   - Plano (free/basic/premium)
   - Status ativo/inativo
   - Último login

2. **Flashcards/Decks**
   - Todos os decks criados pelo usuário
   - Cards dentro de cada deck
   - Categoria, tema e descrição dos decks
   - Metadados do plano associado

3. **Eventos de Login**
   - Registro de cada login
   - Bundle de flashcards associado ao plano
   - Metadados do login

## 🗄️ Estrutura do Banco de Dados

### Tabela `patients`
Armazena informações dos usuários/alunos:
- `id` - ID único (auto-incremento)
- `user_id` - ID do usuário no sistema
- `name` - Nome completo
- `email` - Email (único)
- `phone` - Telefone
- `plan` - Plano (free/basic/premium)
- `role` - Função (student/admin)
- `is_active` - Status ativo (1) ou inativo (0)
- `notes` - Observações
- `last_login` - Data do último login
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### Tabela `flashcard_decks`
Armazena os decks de flashcards de cada usuário:
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

### Tabela `login_events`
Registra eventos de login:
- `id` - ID único (auto-incremento)
- `user_id` - ID do usuário
- `name` - Nome do usuário
- `email` - Email do usuário
- `plan` - Plano no momento do login
- `deck_bundle` - Bundle de flashcards associado
- `metadata` - Metadados adicionais (JSON)
- `created_at` - Data do evento

## 🔄 Quando a Sincronização Acontece

### Sincronização Automática

1. **Ao Criar uma Conta**
   - Quando você cria uma conta no celular e escolhe o plano premium
   - O perfil é sincronizado com o banco
   - Os flashcards padrão do plano são registrados

2. **Ao Fazer Login**
   - Perfil é atualizado (último login)
   - Todos os flashcards do usuário são sincronizados
   - Evento de login é registrado

3. **Ao Criar um Novo Deck**
   - O deck é salvo localmente
   - Automaticamente sincronizado com o banco de dados

4. **Na Inicialização do App**
   - Após 1 segundo, todos os usuários são sincronizados
   - Se houver usuário logado, seus flashcards também são sincronizados

5. **Ao Atualizar o Plano**
   - Quando o plano é alterado pelo admin
   - Perfil e flashcards são atualizados no banco

## 📱 Exemplo de Uso: Criar Conta no Celular

1. **Acesse o site no seu celular**
2. **Crie uma conta** preenchendo:
   - Nome
   - Email
   - Telefone
   - Senha
   - **Escolha o plano: Premium**
3. **Clique em "Criar Conta"**

### O que acontece automaticamente:

✅ Conta criada no localStorage  
✅ Perfil sincronizado com o banco de dados (`patients` table)  
✅ Evento de login registrado (`login_events` table)  
✅ Bundle de flashcards do plano premium associado  

### Verificar no Banco de Dados:

```bash
# No terminal, acesse o backend
cd backend
npm run dev

# Em outro terminal ou no navegador:
# Ver usuários cadastrados
curl http://localhost:4000/api/patients

# Ver eventos de login
curl http://localhost:4000/api/login-events

# Ver flashcards de um usuário específico
curl http://localhost:4000/api/flashcards/user/USER_ID
```

## 🔍 Como Verificar os Dados

### 1. Via API REST

```bash
# Listar todos os pacientes
curl http://localhost:4000/api/patients

# Buscar paciente por email
curl http://localhost:4000/api/patients/email@exemplo.com

# Listar todos os decks de flashcards
curl http://localhost:4000/api/flashcards

# Listar decks de um usuário específico
curl http://localhost:4000/api/flashcards/user/user_123456

# Ver eventos de login
curl http://localhost:4000/api/login-events
```

### 2. Via Interface Web

Acesse no navegador:
- `http://localhost:4000/` - Página inicial da API
- `http://localhost:4000/api/patients` - Lista de pacientes (JSON)
- `http://localhost:4000/api/flashcards` - Lista de decks (JSON)

### 3. Via Ferramenta Gráfica

Use **DB Browser for SQLite** ou **SQLite Studio**:
1. Abra o arquivo: `backend/data/medfocus.sqlite`
2. Visualize as tabelas:
   - `patients` - Ver todos os usuários
   - `flashcard_decks` - Ver todos os decks
   - `login_events` - Ver histórico de logins

## 🔧 Endpoints da API

### Pacientes

- `GET /api/patients` - Lista todos os pacientes
- `GET /api/patients/:email` - Busca paciente por email
- `POST /api/patients` - Cria novo paciente
- `PUT /api/patients/:id` - Atualiza paciente

### Flashcards

- `GET /api/flashcards` - Lista todos os decks
- `GET /api/flashcards/user/:userId` - Lista decks de um usuário
- `GET /api/flashcards/:deckId` - Busca deck específico
- `POST /api/flashcards` - Cria ou atualiza deck
- `PUT /api/flashcards/:deckId` - Atualiza deck
- `DELETE /api/flashcards/:deckId` - Deleta deck

### Eventos de Login

- `GET /api/login-events` - Lista eventos de login
- `POST /api/login-events` - Registra novo evento

## 🎯 Atribuir Conteúdos para Cada Aluno

Agora você pode:

1. **Ver todos os alunos no banco de dados**
   ```sql
   SELECT * FROM patients;
   ```

2. **Ver alunos por plano**
   ```sql
   SELECT * FROM patients WHERE plan = 'premium';
   ```

3. **Ver flashcards de cada aluno**
   ```sql
   SELECT * FROM flashcard_decks WHERE user_id = 'USER_ID';
   ```

4. **Atribuir conteúdos baseado no plano**
   - Alunos premium têm acesso a mais flashcards
   - O sistema já associa automaticamente os bundles corretos

## 🔐 Configuração

### Backend URL

O backend está configurado para rodar em:
- **Local**: `http://localhost:4000`
- **Rede local**: `http://[SEU_IP_LOCAL]:4000`

Para usar de outros dispositivos na mesma rede:
1. Descubra seu IP local: `ipconfig` (Windows) ou `ifconfig` (Linux/Mac)
2. Configure no frontend (se necessário):
   ```javascript
   window.MEDFOCUS_BACKEND_URL = 'http://192.168.1.100:4000';
   ```

### Porta

A porta padrão é **4000**. Para alterar, configure no arquivo `.env`:
```
PORT=4000
HOST=0.0.0.0
```

## ✅ Checklist de Funcionamento

- [x] Criação de conta sincroniza com banco
- [x] Escolha de plano é salva no banco
- [x] Flashcards são sincronizados automaticamente
- [x] Login sincroniza dados atualizados
- [x] Criação de novos decks sincroniza automaticamente
- [x] Atualização de plano sincroniza flashcards
- [x] Dados visíveis no banco SQLite
- [x] API REST funcionando
- [x] Sincronização funciona de qualquer dispositivo

## 🐛 Solução de Problemas

### Dados não aparecem no banco

1. **Verifique se o backend está rodando:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verifique os logs do console (F12 no navegador)**
   - Procure por mensagens de erro
   - Verifique se há erros de conexão

3. **Verifique a URL do backend:**
   - Deve ser `http://localhost:4000` para desenvolvimento local
   - Para outros dispositivos, use o IP da rede local

### Sincronização não funciona

1. **Verifique se o backend está acessível:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Verifique erros no console do navegador (F12)**

3. **Tente sincronizar manualmente:**
   - Acesse o Painel Admin
   - Clique em "Sincronizar" na aba Usuários

## 📝 Notas Importantes

- O banco de dados SQLite é criado automaticamente na primeira execução
- Os dados são permanentes até serem removidos manualmente
- Faça backup regular do arquivo `backend/data/medfocus.sqlite`
- A sincronização é automática e em tempo real
- Dados criados em qualquer dispositivo aparecem no banco

## 🎉 Resultado

Agora você pode:
- ✅ Criar uma conta no celular
- ✅ Escolher o plano premium
- ✅ Ver todas as informações no banco de dados
- ✅ Ver os flashcards associados
- ✅ Atribuir conteúdos corretos para cada aluno
- ✅ Gerenciar tudo de forma centralizada

Tudo funcionando! 🚀

