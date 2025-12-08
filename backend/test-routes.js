// Script de teste para verificar todas as rotas da API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRoute(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      log(`✅ ${method} ${endpoint} - OK (${response.status})`, 'green');
      return { success: true, data, status: response.status };
    } else {
      log(`❌ ${method} ${endpoint} - ERRO (${response.status})`, 'red');
      log(`   Resposta: ${JSON.stringify(data)}`, 'yellow');
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    log(`❌ ${method} ${endpoint} - ERRO DE CONEXÃO`, 'red');
    log(`   ${error.message}`, 'yellow');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🧪 Iniciando testes das rotas da API...\n', 'blue');

  // Teste 1: Health check
  log('1. Testando /health', 'blue');
  await testRoute('GET', '/health');
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Teste 2: Listar pacientes (deve retornar array vazio se não houver dados)
  log('\n2. Testando GET /api/patients', 'blue');
  const patientsResult = await testRoute('GET', '/api/patients');
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Teste 3: Criar paciente de teste
  log('\n3. Testando POST /api/patients', 'blue');
  const newPatient = {
    userId: 'test_user_' + Date.now(),
    name: 'Teste Usuário',
    email: `teste${Date.now()}@example.com`,
    phone: '(11) 99999-9999',
    plan: 'premium',
    role: 'student',
    isActive: true,
  };
  const createResult = await testRoute('POST', '/api/patients', newPatient);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Teste 4: Listar pacientes novamente (deve ter pelo menos 1)
  log('\n4. Testando GET /api/patients (após criar)', 'blue');
  await testRoute('GET', '/api/patients');
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Teste 5: Buscar paciente por email
  if (createResult.success && createResult.data?.data?.email) {
    log('\n5. Testando GET /api/patients/:email', 'blue');
    const email = encodeURIComponent(createResult.data.data.email);
    await testRoute('GET', `/api/patients/${email}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Teste 6: Listar eventos de login
  log('\n6. Testando GET /api/login-events', 'blue');
  await testRoute('GET', '/api/login-events');
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Teste 7: Criar evento de login
  log('\n7. Testando POST /api/login-events', 'blue');
  const loginEvent = {
    userId: 'test_user_' + Date.now(),
    name: 'Teste Login',
    email: `login${Date.now()}@example.com`,
    plan: 'premium',
    deckBundle: 'test_bundle',
    metadata: { test: true },
  };
  await testRoute('POST', '/api/login-events', loginEvent);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Teste 8: Listar eventos novamente
  log('\n8. Testando GET /api/login-events (após criar)', 'blue');
  await testRoute('GET', '/api/login-events');

  log('\n✅ Testes concluídos!\n', 'green');
}

// Verificar se o servidor está rodando
fetch(`${BASE_URL}/health`)
  .then(() => {
    runTests().catch((error) => {
      log(`\n❌ Erro ao executar testes: ${error.message}`, 'red');
      process.exit(1);
    });
  })
  .catch(() => {
    log('\n❌ Servidor não está rodando!', 'red');
    log('   Inicie o servidor com: npm run dev', 'yellow');
    process.exit(1);
  });

