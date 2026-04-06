import pg from 'pg';
import dotenv from 'dotenv';

// No Render, as variáveis já vêm prontas, não precisa de caminhos complexos
dotenv.config(); 

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ AVISO: Variável DATABASE_URL não encontrada no arquivo .env!');
  console.warn('⚠️ O backend tentará conectar ao banco PostgreSQL local (se houver).');
}

const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {});

export default pool;

// Testa a conexão ao iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar no Neon:', err.stack);
  } else {
    console.log('✅ App conectado ao Neon com sucesso!');
    release();
  }
});

// ==========================================
// FUNÇÕES DE PACIENTES COMEÇAM AQUI PARA BAIXO...
// ==========================================
  
export const insertPatient = async ({ userId, name, email, phone, plan, role, isActive, notes, lastLogin }) => {
  const stmt = `
    INSERT INTO patients (user_id, name, email, phone, plan, role, is_active, notes, last_login, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
    RETURNING id
  `;
  const values = [
    userId ?? null, name, email, phone ?? null, plan ?? 'free', role ?? 'student',
    isActive !== undefined ? (isActive ? 1 : 0) : 1, notes ?? null, lastLogin ?? null
  ];

  const res = await pool.query(stmt, values);
  return {
    id: res.rows[0].id, userId, name, email, phone, plan: plan ?? 'free', role: role ?? 'student',
    isActive: isActive !== undefined ? isActive : true, notes, lastLogin,
  };
};

export const getPatients = async () => {
  const res = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
  if (!res.rows || res.rows.length === 0) return [];
  return res.rows.map((row) => ({
    ...row,
    isActive: row.is_active === 1 || row.is_active === '1',
    is_active: undefined,
  }));
};

export const getPatientByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM patients WHERE email = $1', [email]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    ...row,
    isActive: row.is_active === 1 || row.is_active === '1',
    is_active: undefined,
  };
};

export const updatePatient = async ({ id, userId, name, email, phone, plan, role, isActive, notes, lastLogin }) => {
  const updates = [];
  const values = [];
  let i = 1;

  if (userId !== undefined) { updates.push(`user_id = $${i++}`); values.push(userId); }
  if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
  if (email !== undefined) { updates.push(`email = $${i++}`); values.push(email); }
  if (phone !== undefined) { updates.push(`phone = $${i++}`); values.push(phone); }
  if (plan !== undefined) { updates.push(`plan = $${i++}`); values.push(plan); }
  if (role !== undefined) { updates.push(`role = $${i++}`); values.push(role); }
  if (isActive !== undefined) { updates.push(`is_active = $${i++}`); values.push(isActive ? 1 : 0); }
  if (notes !== undefined) { updates.push(`notes = $${i++}`); values.push(notes); }
  if (lastLogin !== undefined) { updates.push(`last_login = $${i++}`); values.push(lastLogin); }

  if (updates.length === 0) return null;

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id); 
  
  const stmt = `UPDATE patients SET ${updates.join(', ')} WHERE id = $${i} RETURNING id`;
  const res = await pool.query(stmt, values);

  if (res.rowCount === 0) return null;
  return { id, changes: res.rowCount };
};

// ==========================================
// FUNÇÕES DE LOGIN EVENTS
// ==========================================

export const insertLoginEvent = async ({ userId, name, email, plan, deckBundle, metadata }) => {
  const stmt = `
    INSERT INTO login_events (user_id, name, email, plan, deck_bundle, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  const values = [userId, name ?? null, email, plan, deckBundle ?? null, metadata ? JSON.stringify(metadata) : null];
  const res = await pool.query(stmt, values);
  return { id: res.rows[0].id, userId, email, plan, deckBundle };
};

export const getLoginEvents = async () => {
  const res = await pool.query('SELECT * FROM login_events ORDER BY created_at DESC LIMIT 200');
  if (!res.rows || res.rows.length === 0) return [];
  return res.rows.map((row) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));
};

// ==========================================
// FUNÇÕES DE FLASHCARDS
// ==========================================

export const insertFlashcardDeck = async ({ deckId, userId, name, description, category, theme, plan, cards }) => {
  const stmt = `
    INSERT INTO flashcard_decks (deck_id, user_id, name, description, category, theme, plan, cards, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    RETURNING id
  `;
  const cardsJson = JSON.stringify(cards);
  const values = [deckId, userId, name, description ?? null, category ?? null, theme ?? null, plan ?? null, cardsJson];

  const res = await pool.query(stmt, values);
  return {
    id: res.rows[0].id, deckId, userId, name, description, category, theme, plan,
    cards: Array.isArray(cards) ? cards : JSON.parse(cardsJson),
  };
};

export const getFlashcardDecksByUserId = async (userId) => {
  const res = await pool.query('SELECT * FROM flashcard_decks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  if (!res.rows || res.rows.length === 0) return [];
  return res.rows.map((row) => ({
    ...row,
    cards: row.cards ? JSON.parse(row.cards) : [],
  }));
};

export const getFlashcardDeckByDeckId = async (deckId) => {
  const res = await pool.query('SELECT * FROM flashcard_decks WHERE deck_id = $1', [deckId]);
  if (res.rows.length === 0) return null;
  return {
    ...res.rows[0],
    cards: res.rows[0].cards ? JSON.parse(res.rows[0].cards) : [],
  };
};

export const updateFlashcardDeck = async ({ deckId, userId, name, description, category, theme, plan, cards }) => {
  const updates = [];
  const values = [];
  let i = 1;

  if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
  if (description !== undefined) { updates.push(`description = $${i++}`); values.push(description); }
  if (category !== undefined) { updates.push(`category = $${i++}`); values.push(category); }
  if (theme !== undefined) { updates.push(`theme = $${i++}`); values.push(theme); }
  if (plan !== undefined) { updates.push(`plan = $${i++}`); values.push(plan); }
  if (cards !== undefined) { updates.push(`cards = $${i++}`); values.push(JSON.stringify(cards)); }

  if (updates.length === 0) return null;

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(deckId); 

  const stmt = `UPDATE flashcard_decks SET ${updates.join(', ')} WHERE deck_id = $${i}`;
  const res = await pool.query(stmt, values);

  if (res.rowCount === 0) return null;
  return { deckId, changes: res.rowCount };
};

export const deleteFlashcardDeck = async (deckId) => {
  const res = await pool.query('DELETE FROM flashcard_decks WHERE deck_id = $1', [deckId]);
  return { deckId, changes: res.rowCount };
};

export const getAllFlashcardDecks = async () => {
  const res = await pool.query('SELECT * FROM flashcard_decks ORDER BY created_at DESC');
  if (!res.rows || res.rows.length === 0) return [];
  return res.rows.map((row) => ({
    ...row,
    cards: row.cards ? JSON.parse(row.cards) : [],
  }));
};