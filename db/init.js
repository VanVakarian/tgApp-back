import { DO_RECHECK_DB } from '../env.js';
import { getConnection } from './db.js';

async function createTablesIfNotExist() {
  const connection = await getConnection();

  const createTablesQueries = [
    `
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      ts INTEGER
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      hashedPassword TEXT,
      tgSession TEXT,
      isAdmin BOOLEAN
    );
    `,
  ];

  try {
    for (const query of createTablesQueries) {
      await connection.exec(query);
    }
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

export async function initDatabase() {
  if (DO_RECHECK_DB) {
    await createTablesIfNotExist();
  }
}
