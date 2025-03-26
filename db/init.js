import { DO_RECHECK_DB, INIT_USERS } from '../env.js';
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

async function addUserIfNotExists(user) {
  const connection = await getConnection();
  try {
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE username = ?
    `;
    const checkResult = await connection.get(checkQuery, [user.username]);

    if (checkResult.count === 0) {
      const insertQuery = `
        INSERT INTO users (id, username, hashedPassword, isAdmin)
        VALUES (?, ?, ?, ?)
      `;
      await connection.run(insertQuery, [user.id, user.username, user.hashedPassword, user.isAdmin]);
      console.log(`User ${user.username} added.`);
    } else {
      console.log(`User ${user.username} already exists. Skipping...`);
    }
  } catch (error) {
    console.error(`Failed to add user ${user.username}:`, error);
  }
}

export async function initDatabase() {
  if (DO_RECHECK_DB) {
    await createTablesIfNotExist();

    for (const user of INIT_USERS) {
      await addUserIfNotExists(user);
    }
  }
}
