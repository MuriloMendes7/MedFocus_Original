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
  insertFlashcardDeck,
  getFlashcardDecksByUserId,
  getFlashcardDeckByDeckId,
  updateFlashcardDeck,
  deleteFlashcardDeck,
  getAllFlashcardDecks,
} from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

// Função auxiliar para escapar HTML (segurança)
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Rota para visualização de pacientes (HTML formatado)
app.get('/view/patients', async (_req, res) => {
  try {
    const patients = await getPatients();
    const html = generatePatientsViewHTML(patients);
    res.send(html);
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Erro</title></head>
      <body><h1>Erro ao carregar pacientes</h1><p>${error.message}</p></body>
      </html>
    `);
  }
});

// Rota para visualização de flashcards (HTML formatado)
app.get('/view/flashcards', async (_req, res) => {
  try {
    const decks = await getAllFlashcardDecks();
    const html = generateFlashcardsViewHTML(decks);
    res.send(html);
  } catch (error) {
    console.error('Erro ao carregar flashcards:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Erro</title></head>
      <body><h1>Erro ao carregar flashcards</h1><p>${error.message}</p></body>
      </html>
    `);
  }
});

// Função para gerar HTML de visualização de pacientes
function generatePatientsViewHTML(patients) {
  const patientsList = Array.isArray(patients) ? patients : [];
  const planColors = {
    free: '#6b7280',
    basic: '#3b82f6',
    premium: '#f59e0b'
  };
  const planLabels = {
    free: 'Gratuito',
    basic: 'Básico',
    premium: 'Premium'
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MedFocus - Visualização de Pacientes</title>
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
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        h1 {
          color: #667eea;
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 1.1em;
        }
        .stats {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          flex: 1;
          min-width: 200px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
          font-size: 0.9em;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        .stat-card .value {
          font-size: 2em;
          font-weight: bold;
        }
        .search-bar {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }
        .search-bar input {
          flex: 1;
          padding: 12px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1em;
          transition: border-color 0.2s;
        }
        .search-bar input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .search-bar button {
          transition: all 0.2s;
        }
        .search-bar button:hover {
          background: #d1d5db !important;
          transform: scale(1.05);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        thead {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        tbody tr:hover {
          background: #f8f9fa;
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        .badge {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.85em;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-free {
          background: #e5e7eb;
          color: #6b7280;
        }
        .badge-basic {
          background: #dbeafe;
          color: #3b82f6;
        }
        .badge-premium {
          background: #fef3c7;
          color: #f59e0b;
        }
        .badge-active {
          background: #d1fae5;
          color: #059669;
        }
        .badge-inactive {
          background: #fee2e2;
          color: #dc2626;
        }
        .badge-admin {
          background: #e0e7ff;
          color: #6366f1;
        }
        .badge-student {
          background: #f3e8ff;
          color: #9333ea;
        }
        .actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .btn-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 5px;
          transition: background 0.2s;
        }
        .btn-link:hover {
          background: #f3f4f6;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }
        .empty-state svg {
          width: 100px;
          height: 100px;
          margin-bottom: 20px;
          opacity: 0.3;
        }
        .nav-links {
          display: flex;
          gap: 15px;
          margin-bottom: 30px;
        }
        .nav-link {
          padding: 10px 20px;
          background: #f3f4f6;
          color: #667eea;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .nav-link:hover {
          background: #667eea;
          color: white;
        }
        .nav-link.active {
          background: #667eea;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>👥 Pacientes Cadastrados</h1>
            <p class="subtitle">Visualização completa dos alunos do sistema MedFocus</p>
          </div>
        </div>

        <div class="nav-links">
          <a href="/view/patients" class="nav-link active">Pacientes</a>
          <a href="/view/flashcards" class="nav-link">Flashcards</a>
          <a href="/" class="nav-link">API Docs</a>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>Total de Pacientes</h3>
            <div class="value">${patientsList.length}</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <h3>Pacientes Premium</h3>
            <div class="value">${patientsList.filter(p => p.plan === 'premium').length}</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
            <h3>Pacientes Básicos</h3>
            <div class="value">${patientsList.filter(p => p.plan === 'basic').length}</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
            <h3>Pacientes Gratuitos</h3>
            <div class="value">${patientsList.filter(p => p.plan === 'free').length}</div>
          </div>
        </div>

        <div class="export-buttons">
          <button class="btn-export" onclick="exportToCSV()">📥 Exportar CSV</button>
          <button class="btn-export" onclick="exportToJSON()">📥 Exportar JSON</button>
          <button class="btn-export" onclick="window.print()">🖨️ Imprimir</button>
          <button class="btn-export" style="background:#6366f1;" onclick="document.getElementById('importPatientsFile').click()">📤 Importar JSON</button>
        </div>
        <input type="file" id="importPatientsFile" accept="application/json" style="display:none" onchange="importPatientsFromFile(event)">

        <div class="filters">
          <select class="filter-select" id="filterPlan" onchange="applyFilters()">
            <option value="">Todos os Planos</option>
            <option value="free">Gratuito</option>
            <option value="basic">Básico</option>
            <option value="premium">Premium</option>
          </select>
          <select class="filter-select" id="filterRole" onchange="applyFilters()">
            <option value="">Todas as Funções</option>
            <option value="student">Aluno</option>
            <option value="admin">Admin</option>
          </select>
          <select class="filter-select" id="filterStatus" onchange="applyFilters()">
            <option value="">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        <div class="search-bar">
          <input type="text" id="searchInput" placeholder="🔍 Buscar por nome, email, telefone ou plano..." onkeyup="filterTable()" autocomplete="off">
          <button onclick="clearSearch()" style="padding: 12px 20px; background: #e5e7eb; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; color: #666;">Limpar</button>
        </div>
        <div id="resultsCount" style="margin-bottom: 10px; color: #666; font-size: 0.9em;"></div>

        ${patientsList.length === 0 ? `
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h2>Nenhum paciente cadastrado ainda</h2>
            <p>Os pacientes aparecerão aqui quando forem cadastrados no sistema.</p>
          </div>
        ` : `
          <table id="patientsTable">
            <thead>
              <tr>
                <th onclick="sortTable(0)" style="cursor: pointer; user-select: none;">ID <span class="sort-icon">⇅</span></th>
                <th onclick="sortTable(1)" style="cursor: pointer; user-select: none;">Nome <span class="sort-icon">⇅</span></th>
                <th onclick="sortTable(2)" style="cursor: pointer; user-select: none;">Email <span class="sort-icon">⇅</span></th>
                <th>Telefone</th>
                <th onclick="sortTable(4)" style="cursor: pointer; user-select: none;">Plano <span class="sort-icon">⇅</span></th>
                <th onclick="sortTable(5)" style="cursor: pointer; user-select: none;">Função <span class="sort-icon">⇅</span></th>
                <th onclick="sortTable(6)" style="cursor: pointer; user-select: none;">Status <span class="sort-icon">⇅</span></th>
                <th onclick="sortTable(7)" style="cursor: pointer; user-select: none;">Último Login <span class="sort-icon">⇅</span></th>
                <th onclick="sortTable(8)" style="cursor: pointer; user-select: none;">Cadastrado em <span class="sort-icon">⇅</span></th>
              </tr>
            </thead>
            <tbody>
              ${patientsList.map(patient => {
                const plan = patient.plan || 'free';
                const role = patient.role || 'student';
                const isActive = patient.isActive !== false;
                const lastLogin = patient.last_login ? new Date(patient.last_login).toLocaleDateString('pt-BR') + ' ' + new Date(patient.last_login).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '-';
                const createdAt = patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR') + ' ' + new Date(patient.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '-';
                return `
                <tr>
                  <td>${patient.id}</td>
                  <td><strong>${escapeHtml(patient.name || 'N/A')}</strong></td>
                  <td><a href="mailto:${escapeHtml(patient.email || '')}" style="color: #667eea; text-decoration: none;">${escapeHtml(patient.email || 'N/A')}</a></td>
                  <td>${escapeHtml(patient.phone || '-')}</td>
                  <td><span class="badge badge-${plan}">${planLabels[plan] || 'Gratuito'}</span></td>
                  <td><span class="badge badge-${role}">${role === 'admin' ? 'Admin' : 'Aluno'}</span></td>
                  <td><span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">${isActive ? 'Ativo' : 'Inativo'}</span></td>
                  <td>${lastLogin}</td>
                  <td>${createdAt}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>

      <script>
        let sortDirection = {};
        
        function filterTable() {
          applyFilters();
        }
        
        function applyFilters() {
          const searchInput = document.getElementById('searchInput');
          const filterPlan = document.getElementById('filterPlan').value;
          const filterRole = document.getElementById('filterRole').value;
          const filterStatus = document.getElementById('filterStatus').value;
          const searchFilter = (searchInput ? searchInput.value.toLowerCase() : '');
          
          const table = document.getElementById('patientsTable');
          if (!table) return;
          
          const tr = table.getElementsByTagName('tr');
          let visibleCount = 0;
          
          for (let i = 1; i < tr.length; i++) {
            const td = tr[i].getElementsByTagName('td');
            let shouldShow = true;
            
            // Filtro de busca
            if (searchFilter) {
              let found = false;
              for (let j = 0; j < td.length; j++) {
                if (td[j]) {
                  const txtValue = td[j].textContent || td[j].innerText;
                  if (txtValue.toLowerCase().indexOf(searchFilter) > -1) {
                    found = true;
                    break;
                  }
                }
              }
              if (!found) shouldShow = false;
            }
            
            // Filtro de plano
            if (filterPlan && shouldShow) {
              const planText = td[4] ? td[4].textContent.toLowerCase() : '';
              if (!planText.includes(filterPlan.toLowerCase())) {
                shouldShow = false;
              }
            }
            
            // Filtro de função
            if (filterRole && shouldShow) {
              const roleText = td[5] ? td[5].textContent.toLowerCase() : '';
              if (filterRole === 'student' && !roleText.includes('aluno')) shouldShow = false;
              if (filterRole === 'admin' && !roleText.includes('admin')) shouldShow = false;
            }
            
            // Filtro de status
            if (filterStatus && shouldShow) {
              const statusText = td[6] ? td[6].textContent.toLowerCase() : '';
              if (filterStatus === 'active' && !statusText.includes('ativo')) shouldShow = false;
              if (filterStatus === 'inactive' && !statusText.includes('inativo')) shouldShow = false;
            }
            
            tr[i].style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
          }
          
          // Atualizar contador
          const counter = document.getElementById('resultsCount');
          if (counter) {
            counter.textContent = \`Mostrando \${visibleCount} de \${tr.length - 1} pacientes\`;
          }
        }
        
        function sortTable(columnIndex) {
          const table = document.getElementById('patientsTable');
          if (!table) return;
          
          const tbody = table.querySelector('tbody');
          const rows = Array.from(tbody.querySelectorAll('tr'));
          const isAsc = !sortDirection[columnIndex];
          sortDirection[columnIndex] = isAsc;
          
          rows.sort((a, b) => {
            const aText = a.cells[columnIndex] ? a.cells[columnIndex].textContent.trim() : '';
            const bText = b.cells[columnIndex] ? b.cells[columnIndex].textContent.trim() : '';
            
            // Tentar converter para número se possível
            const aNum = parseFloat(aText);
            const bNum = parseFloat(bText);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return isAsc ? aNum - bNum : bNum - aNum;
            }
            
            // Comparação de texto
            return isAsc ? aText.localeCompare(bText) : bText.localeCompare(aText);
          });
          
          rows.forEach(row => tbody.appendChild(row));
          
          // Atualizar ícones de ordenação
          const headers = table.querySelectorAll('th');
          headers.forEach((header, index) => {
            if (index === columnIndex) {
              header.querySelector('.sort-icon').textContent = isAsc ? ' ↑' : ' ↓';
            } else {
              header.querySelector('.sort-icon').textContent = ' ⇅';
            }
          });
        }
        
        function exportToCSV() {
          const table = document.getElementById('patientsTable');
          if (!table) return;
          
          let csv = [];
          const rows = table.querySelectorAll('tr');
          
          for (let i = 0; i < rows.length; i++) {
            const row = [];
            const cols = rows[i].querySelectorAll('th, td');
            for (let j = 0; j < cols.length; j++) {
              let data = cols[j].textContent.replace(/,/g, ';');
              row.push(data);
            }
            csv.push(row.join(','));
          }
          
          const csvContent = csv.join('\\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'pacientes_' + new Date().toISOString().split('T')[0] + '.csv';
          link.click();
        }
        
        function exportToJSON() {
          const table = document.getElementById('patientsTable');
          if (!table) return;
          
          const rows = table.querySelectorAll('tbody tr');
          const data = [];
          const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim().replace(/\s*⇅.*$/, ''));
          
          rows.forEach(row => {
            if (row.style.display !== 'none') {
              const obj = {};
              const cols = row.querySelectorAll('td');
              headers.forEach((header, index) => {
                obj[header] = cols[index] ? cols[index].textContent.trim() : '';
              });
              data.push(obj);
            }
          });
          
          const jsonContent = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'pacientes_' + new Date().toISOString().split('T')[0] + '.json';
          link.click();
        }

        async function importPatientsFromFile(event) {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            const json = JSON.parse(text);
            const patients = json.patients || json.data || json;
            if (!Array.isArray(patients)) {
              alert('Arquivo inválido: esperado array de pacientes ou objeto { patients: [] }.');
              return;
            }
            const res = await fetch('/import/patients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ patients })
            });
            const result = await res.json();
            if (!res.ok) {
              throw new Error(result.error || 'Falha ao importar');
            }
            alert('Importação concluída. Importados: ' + result.imported + ', Atualizados: ' + result.updated);
            window.location.reload();
          } catch (err) {
            console.error('Erro ao importar pacientes:', err);
            alert('Erro ao importar pacientes: ' + err.message);
          } finally {
            event.target.value = '';
          }
        }
        
        function clearSearch() {
          document.getElementById('searchInput').value = '';
          document.getElementById('filterPlan').value = '';
          document.getElementById('filterRole').value = '';
          document.getElementById('filterStatus').value = '';
          applyFilters();
        }
        
        // Inicialização
        document.addEventListener('DOMContentLoaded', function() {
          applyFilters();
          const input = document.getElementById('searchInput');
          if (input) {
            input.addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                applyFilters();
              }
            });
          }
        });
      </script>
    </body>
    </html>
  `;
}

// Função para gerar HTML de visualização de flashcards
function generateFlashcardsViewHTML(decks) {
  const decksList = Array.isArray(decks) ? decks : [];
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MedFocus - Visualização de Flashcards</title>
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
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        h1 {
          color: #667eea;
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 1.1em;
        }
        .stats {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          flex: 1;
          min-width: 200px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
          font-size: 0.9em;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        .stat-card .value {
          font-size: 2em;
          font-weight: bold;
        }
        .search-bar {
          margin-bottom: 20px;
        }
        .search-bar input {
          width: 100%;
          padding: 12px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1em;
        }
        .search-bar input:focus {
          outline: none;
          border-color: #667eea;
        }
        .export-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .btn-export {
          padding: 10px 20px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .btn-export:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-select {
          padding: 10px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.95em;
          background: white;
          cursor: pointer;
        }
        .filter-select:focus {
          outline: none;
          border-color: #667eea;
        }
        .decks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .deck-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .deck-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
          border-color: #667eea;
        }
        .deck-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
        }
        .deck-title {
          font-size: 1.3em;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .deck-meta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .badge {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.85em;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-category {
          background: #e0e7ff;
          color: #6366f1;
        }
        .badge-premium {
          background: #fef3c7;
          color: #f59e0b;
        }
        .badge-basic {
          background: #dbeafe;
          color: #3b82f6;
        }
        .badge-free {
          background: #e5e7eb;
          color: #6b7280;
        }
        .deck-info {
          color: #666;
          font-size: 0.9em;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
        .deck-info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .deck-description {
          color: #666;
          margin-top: 10px;
          font-size: 0.95em;
          line-height: 1.5;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }
        .empty-state svg {
          width: 100px;
          height: 100px;
          margin-bottom: 20px;
          opacity: 0.3;
        }
        .nav-links {
          display: flex;
          gap: 15px;
          margin-bottom: 30px;
        }
        .nav-link {
          padding: 10px 20px;
          background: #f3f4f6;
          color: #667eea;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .nav-link:hover {
          background: #667eea;
          color: white;
        }
        .nav-link.active {
          background: #667eea;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>📚 Decks de Flashcards</h1>
            <p class="subtitle">Visualização completa dos decks cadastrados no sistema</p>
          </div>
        </div>

        <div class="nav-links">
          <a href="/view/patients" class="nav-link">Pacientes</a>
          <a href="/view/flashcards" class="nav-link active">Flashcards</a>
          <a href="/" class="nav-link">API Docs</a>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>Total de Decks</h3>
            <div class="value">${decksList.length}</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <h3>Total de Cards</h3>
            <div class="value">${decksList.reduce((total, deck) => total + (Array.isArray(deck.cards) ? deck.cards.length : 0), 0)}</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <h3>Decks Premium</h3>
            <div class="value">${decksList.filter(d => d.plan === 'premium').length}</div>
          </div>
        </div>

        <div class="export-buttons" style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button class="btn-export" onclick="exportDecksToCSV()">📥 Exportar CSV</button>
          <button class="btn-export" onclick="exportDecksToJSON()">📥 Exportar JSON</button>
          <button class="btn-export" onclick="window.print()">🖨️ Imprimir</button>
          <button class="btn-export" style="background:#6366f1;" onclick="document.getElementById('importDecksFile').click()">📤 Importar JSON</button>
        </div>
        <input type="file" id="importDecksFile" accept="application/json" style="display:none" onchange="importDecksFromFile(event)">

        <div class="filters" style="display: flex; gap: 10px; margin-bottom: 20px;">
          <select class="filter-select" id="filterDeckPlan" onchange="applyDeckFilters()">
            <option value="">Todos os Planos</option>
            <option value="free">Gratuito</option>
            <option value="basic">Básico</option>
            <option value="premium">Premium</option>
          </select>
          <select class="filter-select" id="filterDeckCategory" onchange="applyDeckFilters()">
            <option value="">Todas as Categorias</option>
            <option value="medicina">Medicina</option>
            <option value="cirurgia">Cirurgia</option>
            <option value="pediatria">Pediatria</option>
            <option value="ginecologia">Ginecologia</option>
            <option value="psiquiatria">Psiquiatria</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        <div class="search-bar" style="display: flex; gap: 10px;">
          <input type="text" id="searchInput" placeholder="🔍 Buscar por nome, categoria, tema ou usuário..." onkeyup="filterDecks()" autocomplete="off" style="flex: 1;">
          <button onclick="clearDeckSearch()" style="padding: 12px 20px; background: #e5e7eb; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; color: #666;">Limpar</button>
        </div>
        <div id="deckResultsCount" style="margin-bottom: 20px; color: #666; font-size: 0.9em;"></div>

        ${decksList.length === 0 ? `
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <h2>Nenhum deck cadastrado ainda</h2>
            <p>Os decks aparecerão aqui quando forem criados no sistema.</p>
          </div>
        ` : `
          <div class="decks-grid" id="decksGrid">
            ${decksList.map(deck => {
              const cardsCount = Array.isArray(deck.cards) ? deck.cards.length : 0;
              return `
                <div class="deck-card">
                  <div class="deck-header">
                    <div>
                      <div class="deck-title">${escapeHtml(deck.name || 'Deck sem nome')}</div>
                      <div class="deck-meta">
                        ${deck.category ? `<span class="badge badge-category">${escapeHtml(deck.category)}</span>` : ''}
                        ${deck.plan ? `<span class="badge badge-${deck.plan}">${deck.plan === 'premium' ? 'Premium' : deck.plan === 'basic' ? 'Básico' : 'Gratuito'}</span>` : ''}
                      </div>
                    </div>
                  </div>
                  ${deck.description ? `<div class="deck-description">${escapeHtml(deck.description)}</div>` : ''}
                  <div class="deck-info">
                    <div class="deck-info-item">
                      <span>📊 Cards:</span>
                      <strong>${cardsCount}</strong>
                    </div>
                    <div class="deck-info-item">
                      <span>👤 Usuário:</span>
                      <span>${escapeHtml(deck.user_id || 'N/A')}</span>
                    </div>
                    <div class="deck-info-item">
                      <span>📅 Criado:</span>
                      <span>${deck.created_at ? new Date(deck.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <script>
        const decksData = ${JSON.stringify(decksList)};
        
        function applyDeckFilters() {
          filterDecks();
        }
        
        function filterDecks() {
          const searchInput = document.getElementById('searchInput');
          const filterPlan = document.getElementById('filterDeckPlan') ? document.getElementById('filterDeckPlan').value : '';
          const filterCategory = document.getElementById('filterDeckCategory') ? document.getElementById('filterDeckCategory').value : '';
          const searchFilter = (searchInput ? searchInput.value.toLowerCase() : '');
          
          const grid = document.getElementById('decksGrid');
          if (!grid) return;
          
          const cards = grid.getElementsByClassName('deck-card');
          let visibleCount = 0;
          
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            let shouldShow = true;
            const txtValue = card.textContent || card.innerText;
            
            // Filtro de busca
            if (searchFilter && !txtValue.toLowerCase().includes(searchFilter)) {
              shouldShow = false;
            }
            
            // Filtro de plano
            if (filterPlan && shouldShow) {
              if (!txtValue.toLowerCase().includes(filterPlan.toLowerCase())) {
                shouldShow = false;
              }
            }
            
            // Filtro de categoria
            if (filterCategory && shouldShow) {
              if (!txtValue.toLowerCase().includes(filterCategory.toLowerCase())) {
                shouldShow = false;
              }
            }
            
            card.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
          }
          
          // Atualizar contador
          const counter = document.getElementById('deckResultsCount');
          if (counter) {
            counter.textContent = \`Mostrando \${visibleCount} de \${cards.length} decks\`;
          }
        }
        
        function exportDecksToCSV() {
          const grid = document.getElementById('decksGrid');
          if (!grid) return;
          
          let csv = ['Nome,Categoria,Tema,Plano,Cards,Usuário,Criado em'];
          const cards = grid.getElementsByClassName('deck-card');
          
          for (let i = 0; i < cards.length; i++) {
            if (cards[i].style.display !== 'none') {
              const title = cards[i].querySelector('.deck-title')?.textContent || '';
              const category = cards[i].textContent.match(/Categoria[^:]*:([^\\n]*)/)?.[1]?.trim() || '';
              const plan = cards[i].textContent.match(/Premium|Básico|Gratuito/)?.[0] || '';
              const cardsCount = cards[i].textContent.match(/Cards:[^0-9]*(\\d+)/)?.[1] || '0';
              const user = cards[i].textContent.match(/Usuário:[^\\n]*:([^\\n]*)/)?.[1]?.trim() || '';
              const created = cards[i].textContent.match(/Criado:[^\\n]*:([^\\n]*)/)?.[1]?.trim() || '';
              
              csv.push(\`"\${title}","\${category}","","\${plan}","\${cardsCount}","\${user}","\${created}"\`);
            }
          }
          
          const csvContent = csv.join('\\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'decks_' + new Date().toISOString().split('T')[0] + '.csv';
          link.click();
        }
        
        function exportDecksToJSON() {
          const visibleDecks = [];
          const grid = document.getElementById('decksGrid');
          if (!grid) return;
          
          const cards = grid.getElementsByClassName('deck-card');
          for (let i = 0; i < cards.length; i++) {
            if (cards[i].style.display !== 'none' && decksData[i]) {
              visibleDecks.push(decksData[i]);
            }
          }
          
          const jsonContent = JSON.stringify(visibleDecks, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'decks_' + new Date().toISOString().split('T')[0] + '.json';
          link.click();
        }

        async function importDecksFromFile(event) {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            const json = JSON.parse(text);
            const decks = json.decks || json.data || json;
            if (!Array.isArray(decks)) {
              alert('Arquivo inválido: esperado array de decks ou objeto { decks: [] }.');
              return;
            }
            const res = await fetch('/import/flashcards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ decks })
            });
            const result = await res.json();
            if (!res.ok) {
              throw new Error(result.error || 'Falha ao importar');
            }
            alert('Importação concluída. Importados: ' + result.imported + ', Atualizados: ' + result.updated);
            window.location.reload();
          } catch (err) {
            console.error('Erro ao importar decks:', err);
            alert('Erro ao importar decks: ' + err.message);
          } finally {
            event.target.value = '';
          }
        }
        
        function clearDeckSearch() {
          document.getElementById('searchInput').value = '';
          if (document.getElementById('filterDeckPlan')) document.getElementById('filterDeckPlan').value = '';
          if (document.getElementById('filterDeckCategory')) document.getElementById('filterDeckCategory').value = '';
          applyDeckFilters();
        }
        
        // Inicialização
        document.addEventListener('DOMContentLoaded', function() {
          const grid = document.getElementById('decksGrid');
          const counter = document.getElementById('deckResultsCount');
          if (grid && counter) {
            const cards = grid.getElementsByClassName('deck-card');
            counter.textContent = \`Total: \${cards.length} decks\`;
          }
          
          const input = document.getElementById('searchInput');
          if (input) {
            input.addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                filterDecks();
              }
            });
          }
        });
      </script>
    </body>
    </html>
  `;
}


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

          <div class="endpoint" style="background: #fff3cd; border-left: 4px solid #ffc107;">
            <span class="method get">GET</span>
            <span class="route">/view/patients</span>
            <div class="description">✨ Visualização formatada e apresentável de todos os pacientes</div>
            <a href="/view/patients" class="link" target="_blank">Ver visualização →</a>
          </div>

          <div class="endpoint" style="background: #fff3cd; border-left: 4px solid #ffc107;">
            <span class="method get">GET</span>
            <span class="route">/view/flashcards</span>
            <div class="description">✨ Visualização formatada e apresentável de todos os decks de flashcards</div>
            <a href="/view/flashcards" class="link" target="_blank">Ver visualização →</a>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="route">/api/flashcards</span>
            <div class="description">Lista todos os decks de flashcards</div>
            <a href="/api/flashcards" class="link" target="_blank">Ver decks →</a>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="route">/api/flashcards/user/:userId</span>
            <div class="description">Lista todos os decks de um usuário específico</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="route">/api/flashcards/:deckId</span>
            <div class="description">Busca um deck específico por ID</div>
          </div>

          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="route">/api/flashcards</span>
            <div class="description">Cria ou atualiza um deck de flashcards</div>
          </div>

          <div class="endpoint">
            <span class="method put">PUT</span>
            <span class="route">/api/flashcards/:deckId</span>
            <div class="description">Atualiza um deck de flashcards existente</div>
          </div>

          <div class="endpoint">
            <span class="method delete">DELETE</span>
            <span class="route">/api/flashcards/:deckId</span>
            <div class="description">Deleta um deck de flashcards</div>
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

// Rotas para Flashcards
app.get('/api/flashcards', async (_req, res) => {
  try {
    const decks = await getAllFlashcardDecks();
    res.json({
      data: decks || [],
      count: decks ? decks.length : 0,
      message: decks && decks.length > 0
        ? `${decks.length} deck(s) encontrado(s)`
        : 'Nenhum deck cadastrado ainda'
    });
  } catch (error) {
    console.error('Erro ao listar flashcards:', error);
    res.status(500).json({
      error: 'Não foi possível listar os decks.',
      details: error.message
    });
  }
});

app.get('/api/flashcards/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const decks = await getFlashcardDecksByUserId(userId);
    res.json({
      data: decks || [],
      count: decks ? decks.length : 0,
      message: decks && decks.length > 0
        ? `${decks.length} deck(s) encontrado(s) para este usuário`
        : 'Nenhum deck cadastrado para este usuário'
    });
  } catch (error) {
    console.error('Erro ao buscar flashcards do usuário:', error);
    res.status(500).json({
      error: 'Não foi possível buscar os decks do usuário.',
      details: error.message
    });
  }
});

app.get('/api/flashcards/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;
    const deck = await getFlashcardDeckByDeckId(deckId);
    if (!deck) {
      return res.status(404).json({
        error: 'Deck não encontrado.',
        deckId: deckId
      });
    }
    res.json({ data: deck });
  } catch (error) {
    console.error('Erro ao buscar deck:', error);
    res.status(500).json({
      error: 'Não foi possível buscar o deck.',
      details: error.message
    });
  }
});

app.post('/api/flashcards', async (req, res) => {
  const {
    deckId,
    userId,
    name,
    description,
    category,
    theme,
    plan,
    cards,
  } = req.body ?? {};

  if (!deckId || !userId || !name || !cards) {
    return res.status(400).json({
      error: 'Os campos deckId, userId, name e cards são obrigatórios.',
    });
  }

  try {
    // Verifica se o deck já existe
    const existingDeck = await getFlashcardDeckByDeckId(deckId);
    if (existingDeck) {
      // Se existe, atualiza
      const updated = await updateFlashcardDeck({
        deckId,
        userId,
        name,
        description,
        category,
        theme,
        plan,
        cards,
      });
      return res.json({ data: updated, message: 'Deck atualizado com sucesso' });
    }

    // Se não existe, cria novo
    const deck = await insertFlashcardDeck({
      deckId,
      userId,
      name,
      description,
      category,
      theme,
      plan,
      cards,
    });
    res.status(201).json({ data: deck, message: 'Deck criado com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar deck:', error);
    const isUniqueViolation = error.message?.includes('UNIQUE constraint');
    const message = isUniqueViolation
      ? 'Já existe um deck com este deckId.'
      : 'Não foi possível salvar o deck.';
    res.status(500).json({ error: message, details: error.message });
  }
});

app.put('/api/flashcards/:deckId', async (req, res) => {
  const { deckId } = req.params;
  const {
    userId,
    name,
    description,
    category,
    theme,
    plan,
    cards,
  } = req.body ?? {};

  try {
    const result = await updateFlashcardDeck({
      deckId,
      userId,
      name,
      description,
      category,
      theme,
      plan,
      cards,
    });

    if (!result) {
      return res.status(404).json({ error: 'Deck não encontrado.' });
    }

    res.json({ data: result, message: 'Deck atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar deck:', error);
    res.status(500).json({
      error: 'Não foi possível atualizar o deck.',
      details: error.message
    });
  }
});

app.delete('/api/flashcards/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;
    const result = await deleteFlashcardDeck(deckId);

    if (!result || result.changes === 0) {
      return res.status(404).json({ error: 'Deck não encontrado.' });
    }

    res.json({ data: result, message: 'Deck deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar deck:', error);
    res.status(500).json({
      error: 'Não foi possível deletar o deck.',
      details: error.message
    });
  }
});

// Exportação simples em JSON
app.get('/export/patients.json', async (_req, res) => {
  try {
    const patients = await getPatients();
    res.json({ data: patients || [] });
  } catch (error) {
    console.error('Erro ao exportar pacientes:', error);
    res.status(500).json({ error: 'Não foi possível exportar pacientes.' });
  }
});

app.get('/export/flashcards.json', async (_req, res) => {
  try {
    const decks = await getAllFlashcardDecks();
    res.json({ data: decks || [] });
  } catch (error) {
    console.error('Erro ao exportar flashcards:', error);
    res.status(500).json({ error: 'Não foi possível exportar flashcards.' });
  }
});

// Importação em lote de pacientes (JSON)
app.post('/import/patients', async (req, res) => {
  const patients = req.body?.patients;
  if (!Array.isArray(patients)) {
    return res.status(400).json({ error: 'Envie um array "patients" no corpo do JSON.' });
  }

  let imported = 0;
  let updated = 0;
  const errors = [];

  for (const p of patients) {
    try {
      const email = p.email;
      if (!email || !p.name) {
        throw new Error('Campos name e email são obrigatórios');
      }
      const existing = await getPatientByEmail(email);
      if (existing) {
        await updatePatient({
          id: existing.id,
          userId: p.userId ?? existing.user_id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          plan: p.plan,
          role: p.role,
          isActive: p.isActive,
          notes: p.notes,
          lastLogin: p.lastLogin,
        });
        updated += 1;
      } else {
        await insertPatient({
          userId: p.userId,
          name: p.name,
          email: p.email,
          phone: p.phone,
          plan: p.plan,
          role: p.role,
          isActive: p.isActive,
          notes: p.notes,
          lastLogin: p.lastLogin,
        });
        imported += 1;
      }
    } catch (err) {
      errors.push({ email: p?.email, error: err.message });
    }
  }

  res.json({ imported, updated, errors });
});

// Importação em lote de decks (JSON)
app.post('/import/flashcards', async (req, res) => {
  const decks = req.body?.decks;
  if (!Array.isArray(decks)) {
    return res.status(400).json({ error: 'Envie um array "decks" no corpo do JSON.' });
  }

  let imported = 0;
  let updated = 0;
  const errors = [];

  for (const d of decks) {
    try {
      const deckId = d.deckId || d.deck_id || d.id;
      if (!deckId || !d.name || !d.userId) {
        throw new Error('Campos deckId, name e userId são obrigatórios');
      }
      const existing = await getFlashcardDeckByDeckId(deckId);
      if (existing) {
        await updateFlashcardDeck({
          deckId,
          userId: d.userId,
          name: d.name,
          description: d.description,
          category: d.category,
          theme: d.theme,
          plan: d.plan,
          cards: d.cards,
        });
        updated += 1;
      } else {
        await insertFlashcardDeck({
          deckId,
          userId: d.userId,
          name: d.name,
          description: d.description,
          category: d.category,
          theme: d.theme,
          plan: d.plan,
          cards: d.cards || [],
        });
        imported += 1;
      }
    } catch (err) {
      errors.push({ deckId: d?.deckId ?? d?.id, error: err.message });
    }
  }

  res.json({ imported, updated, errors });
});

const HOST = process.env.HOST ?? '0.0.0.0'; // 0.0.0.0 permite acesso de qualquer IP na rede

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Acessível na rede em http://[SEU_IP_LOCAL]:${PORT}`);
  console.log(`Para descobrir seu IP: ipconfig (Windows) ou ifconfig (Linux/Mac)`);
});

