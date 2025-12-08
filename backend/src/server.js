import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
  insertPatient,
  getPatients,
  getPatientByEmail,
  updatePatient,
  insertLoginEvent,
  getLoginEvents,
} from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

// Rota raiz - Página inicial com informações da API
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MedFocus API - Backend</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #333;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
          color: #667eea;
          margin-bottom: 10px;
          font-size: 2.5em;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 1.1em;
        }
        .status {
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          display: inline-block;
          margin-bottom: 30px;
          font-weight: 600;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 1.5em;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        .endpoint {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        .method {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.85em;
          margin-right: 10px;
        }
        .get { background: #10b981; color: white; }
        .post { background: #3b82f6; color: white; }
        .put { background: #f59e0b; color: white; }
        .route {
          font-family: 'Courier New', monospace;
          font-size: 1.1em;
          color: #667eea;
          font-weight: 600;
        }
        .description {
          color: #666;
          margin-top: 8px;
          font-size: 0.95em;
        }
        .link {
          display: inline-block;
          margin-top: 10px;
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }
        .link:hover {
          text-decoration: underline;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #666;
          text-align: center;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏥 MedFocus API</h1>
        <p class="subtitle">Backend para gerenciamento de pacientes e eventos de login</p>
        
        <div class="status">✅ Servidor Online</div>

        <div class="section">
          <h2>📋 Rotas Disponíveis</h2>
          
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="route">/health</span>
            <div class="description">Verifica se o servidor está funcionando</div>
            <a href="/health" class="link" target="_blank">Testar →</a>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="route">/api/patients</span>
            <div class="description">Lista todos os pacientes cadastrados</div>
            <a href="/api/patients" class="link" target="_blank">Ver pacientes →</a>
          </div>

          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="route">/api/patients</span>
            <div class="description">Cria um novo paciente no banco de dados</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="route">/api/patients/:email</span>
            <div class="description">Busca um paciente específico por e-mail</div>
          </div>

          <div class="endpoint">
            <span class="method put">PUT</span>
            <span class="route">/api/patients/:id</span>
            <div class="description">Atualiza os dados de um paciente</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="route">/api/login-events</span>
            <div class="description">Lista os últimos eventos de login (máx. 200)</div>
            <a href="/api/login-events" class="link" target="_blank">Ver eventos →</a>
          </div>

          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="route">/api/login-events</span>
            <div class="description">Registra um novo evento de login</div>
          </div>
        </div>

        <div class="footer">
          <p>MedFocus Backend API v1.0</p>
          <p>Banco de dados: SQLite | Porta: ${PORT}</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/patients', async (_req, res) => {
  try {
    const patients = await getPatients();
    // Sempre retorna um array, mesmo que vazio
    res.json({ 
      data: patients || [],
      count: patients ? patients.length : 0,
      message: patients && patients.length > 0 
        ? `${patients.length} paciente(s) encontrado(s)` 
        : 'Nenhum paciente cadastrado ainda'
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({ 
      error: 'Não foi possível listar os pacientes.',
      details: error.message 
    });
  }
});

app.post('/api/patients', async (req, res) => {
  const {
    userId,
    name,
    email,
    phone,
    plan,
    role,
    isActive,
    notes,
    lastLogin,
  } = req.body ?? {};

  if (!name || !email) {
    return res
      .status(400)
      .json({ error: 'Os campos name e email são obrigatórios.' });
  }

  try {
    const patient = await insertPatient({
      userId,
      name,
      email,
      phone,
      plan,
      role,
      isActive,
      notes,
      lastLogin,
    });
    res.status(201).json({ data: patient });
  } catch (error) {
    console.error('Erro ao inserir paciente:', error);

    const isUniqueViolation = error.message?.includes('UNIQUE constraint');
    const message = isUniqueViolation
      ? 'Já existe um paciente com este e-mail ou user_id.'
      : 'Não foi possível salvar o paciente.';

    res.status(500).json({ error: message });
  }
});

app.get('/api/patients/:email', async (req, res) => {
  try {
    // Decodifica o email da URL (pode ter caracteres especiais como @, +, etc)
    const email = decodeURIComponent(req.params.email);
    const patient = await getPatientByEmail(email);
    if (!patient) {
      return res.status(404).json({ 
        error: 'Paciente não encontrado.',
        email: email 
      });
    }
    res.json({ data: patient });
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({ 
      error: 'Não foi possível buscar o paciente.',
      details: error.message 
    });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  const {
    userId,
    name,
    email,
    phone,
    plan,
    role,
    isActive,
    notes,
    lastLogin,
  } = req.body ?? {};

  try {
    const result = await updatePatient({
      id,
      userId,
      name,
      email,
      phone,
      plan,
      role,
      isActive,
      notes,
      lastLogin,
    });

    if (!result) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);

    const isUniqueViolation = error.message?.includes('UNIQUE constraint');
    const message = isUniqueViolation
      ? 'Já existe um paciente com este e-mail ou user_id.'
      : 'Não foi possível atualizar o paciente.';

    res.status(500).json({ error: message });
  }
});

app.get('/api/login-events', async (_req, res) => {
  try {
    const events = await getLoginEvents();
    // Sempre retorna um array, mesmo que vazio
    res.json({ 
      data: events || [],
      count: events ? events.length : 0,
      message: events && events.length > 0 
        ? `${events.length} evento(s) de login encontrado(s)` 
        : 'Nenhum evento de login registrado ainda'
    });
  } catch (error) {
    console.error('Erro ao listar login events:', error);
    res.status(500).json({ 
      error: 'Não foi possível listar os acessos.',
      details: error.message 
    });
  }
});

app.post('/api/login-events', async (req, res) => {
  const { userId, name, email, plan, deckBundle, metadata } = req.body ?? {};

  if (!userId || !email || !plan) {
    return res.status(400).json({
      error: 'Os campos userId, email e plan são obrigatórios.',
    });
  }

  try {
    const event = await insertLoginEvent({
      userId,
      name,
      email,
      plan,
      deckBundle,
      metadata,
    });
    res.status(201).json({ data: event });
  } catch (error) {
    console.error('Erro ao registrar login:', error);
    res.status(500).json({ error: 'Não foi possível registrar o login.' });
  }
});

const HOST = process.env.HOST ?? '0.0.0.0'; // 0.0.0.0 permite acesso de qualquer IP na rede

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Acessível na rede em http://[SEU_IP_LOCAL]:${PORT}`);
  console.log(`Para descobrir seu IP: ipconfig (Windows) ou ifconfig (Linux/Mac)`);
});

