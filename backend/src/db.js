import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(__dirname, '..', 'data', 'medfocus.sqlite');

sqlite3.verbose();

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar no SQLite:', err.message);
    process.exit(1);
  } else {
    console.log(`✅ Banco de dados conectado: ${dbPath}`);
  }
});

db.serialize(() => {
  // Criar tabela patients com todos os campos
  db.run(
    `CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        plan TEXT DEFAULT 'free',
        role TEXT DEFAULT 'student',
        is_active INTEGER DEFAULT 1,
        notes TEXT,
        last_login TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
     )`,
    (err) => {
      if (err) {
        console.error('Erro ao criar tabela patients:', err.message);
      } else {
        console.log('✅ Tabela patients criada/verificada');
      }
    },
  );

  // Migração: adicionar novas colunas se a tabela já existir
  db.all(
    "PRAGMA table_info(patients)",
    [],
    (err, columns) => {
      if (err) {
        console.error('Erro ao verificar colunas:', err);
        return;
      }

      const columnNames = columns.map((col) => col.name);

      if (!columnNames.includes('user_id')) {
        db.run('ALTER TABLE patients ADD COLUMN user_id TEXT UNIQUE');
      }
      if (!columnNames.includes('phone')) {
        db.run('ALTER TABLE patients ADD COLUMN phone TEXT');
      }
      if (!columnNames.includes('plan')) {
        db.run("ALTER TABLE patients ADD COLUMN plan TEXT DEFAULT 'free'");
      }
      if (!columnNames.includes('role')) {
        db.run("ALTER TABLE patients ADD COLUMN role TEXT DEFAULT 'student'");
      }
      if (!columnNames.includes('is_active')) {
        db.run('ALTER TABLE patients ADD COLUMN is_active INTEGER DEFAULT 1');
      }
      if (!columnNames.includes('last_login')) {
        db.run('ALTER TABLE patients ADD COLUMN last_login TEXT');
      }
      if (!columnNames.includes('updated_at')) {
        db.run('ALTER TABLE patients ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP');
      }
    },
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS login_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT,
        email TEXT NOT NULL,
        plan TEXT NOT NULL,
        deck_bundle TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
     )`,
    (err) => {
      if (err) {
        console.error('Erro ao criar tabela login_events:', err.message);
      } else {
        console.log('✅ Tabela login_events criada/verificada');
      }
    },
  );
});

export const insertPatient = ({
  userId,
  name,
  email,
  phone,
  plan,
  role,
  isActive,
  notes,
  lastLogin,
}) =>
  new Promise((resolve, reject) => {
    const stmt = `INSERT INTO patients (user_id, name, email, phone, plan, role, is_active, notes, last_login, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    db.run(
      stmt,
      [
        userId ?? null,
        name,
        email,
        phone ?? null,
        plan ?? 'free',
        role ?? 'student',
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        notes ?? null,
        lastLogin ?? null,
      ],
      function handleResult(err) {
        if (err) {
          return reject(err);
        }

        resolve({
          id: this.lastID,
          userId,
          name,
          email,
          phone,
          plan: plan ?? 'free',
          role: role ?? 'student',
          isActive: isActive !== undefined ? isActive : true,
          notes,
          lastLogin,
        });
      },
    );
  });

export const getPatients = () =>
  new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM patients ORDER BY created_at DESC',
      [],
      (err, rows) => {
        if (err) {
          return reject(err);
        }

        // Se não houver dados, retorna array vazio
        if (!rows || rows.length === 0) {
          return resolve([]);
        }

        resolve(
          rows.map((row) => ({
            ...row,
            isActive: row.is_active === 1 || row.is_active === '1',
            is_active: undefined, // Remove campo antigo
          })),
        );
      },
    );
  });

export const getPatientByEmail = (email) =>
  new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM patients WHERE email = ?',
      [email],
      (err, row) => {
        if (err) {
          return reject(err);
        }

        if (!row) {
          return resolve(null);
        }

        resolve({
          ...row,
          isActive: row.is_active === 1 || row.is_active === '1',
          is_active: undefined,
        });
      },
    );
  });

export const updatePatient = ({
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
}) =>
  new Promise((resolve, reject) => {
    const updates = [];
    const values = [];

    if (userId !== undefined) {
      updates.push('user_id = ?');
      values.push(userId);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (plan !== undefined) {
      updates.push('plan = ?');
      values.push(plan);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (lastLogin !== undefined) {
      updates.push('last_login = ?');
      values.push(lastLogin);
    }

    if (updates.length === 0) {
      return resolve(null);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = `UPDATE patients SET ${updates.join(', ')} WHERE id = ?`;

    db.run(stmt, values, function handleResult(err) {
      if (err) {
        return reject(err);
      }

      if (this.changes === 0) {
        return resolve(null);
      }

      resolve({ id, changes: this.changes });
    });
  });

export const insertLoginEvent = ({
  userId,
  name,
  email,
  plan,
  deckBundle,
  metadata,
}) =>
  new Promise((resolve, reject) => {
    const stmt = `INSERT INTO login_events (user_id, name, email, plan, deck_bundle, metadata)
                  VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(
      stmt,
      [
        userId,
        name ?? null,
        email,
        plan,
        deckBundle ?? null,
        metadata ? JSON.stringify(metadata) : null,
      ],
      function handleResult(err) {
        if (err) {
          return reject(err);
        }

        resolve({
          id: this.lastID,
          userId,
          email,
          plan,
          deckBundle,
        });
      },
    );
  });

export const getLoginEvents = () =>
  new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM login_events ORDER BY created_at DESC LIMIT 200',
      [],
      (err, rows) => {
        if (err) {
          return reject(err);
        }

        // Se não houver dados, retorna array vazio
        if (!rows || rows.length === 0) {
          return resolve([]);
        }

        resolve(
          rows.map((row) => ({
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
          })),
        );
      },
    );
  });

