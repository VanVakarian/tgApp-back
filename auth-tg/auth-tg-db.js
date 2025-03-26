import { getConnection } from '../db/db.js';

export async function saveTelegramSession(userId, session) {
  const connection = await getConnection();
  try {
    const query = `
      UPDATE users
      SET tgSession = ?
      WHERE id = ?
    `;
    await connection.run(query, [session, userId]);
    return true;
  } catch (error) {
    console.error('Error saving telegram session:', error);
    return false;
  }
}

export async function getTelegramSession(userId) {
  const connection = await getConnection();
  try {
    const query = `
      SELECT tgSession
      FROM users
      WHERE id = ?
    `;
    const result = await connection.get(query, [userId]);
    return result?.tgSession;
  } catch (error) {
    console.error('Error getting telegram session:', error);
    return null;
  }
}

export async function clearTelegramSession(userId) {
  const connection = await getConnection();
  try {
    const query = `
      UPDATE users
      SET tgSession = NULL
      WHERE id = ?
    `;
    await connection.run(query, [userId]);
    return true;
  } catch (error) {
    console.error('Error clearing telegram session:', error);
    return false;
  }
}
