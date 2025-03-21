import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { API_HASH, API_ID } from '../env.js';
import * as db from './auth-tg-db.js';

export async function initTelegramClient(session = '') {
  const stringSession = new StringSession(session);
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });
  return client;
}

export async function startAuth() {
  return {
    event: 'request_credentials',
    data: 'Enter phone and password',
  };
}

export async function submitCredentials(phone, password, userId) {
  try {
    const client = await initTelegramClient();

    await client.start({
      phoneNumber: async () => phone,
      password: async () => password,
      phoneCode: async () => {
        client.needCode = true;
        throw new Error('CODE_REQUIRED');
      },
      onError: (err) => {
        throw err;
      },
    });

    const session = client.session.save();
    await db.saveTelegramSession(userId, session);
    await client.disconnect();

    return { event: 'auth_status', data: 'success' };
  } catch (error) {
    if (error.message === 'CODE_REQUIRED') {
      return { event: 'request_code', data: 'Enter code' };
    }
    throw error;
  }
}

export async function submitCode(code, userId) {
  try {
    const session = await db.getTelegramSession(userId);
    const client = await initTelegramClient(session);

    await client.start({
      phoneCode: async () => code,
    });

    const newSession = client.session.save();
    await db.saveTelegramSession(userId, newSession);
    await client.disconnect();

    return { event: 'auth_status', data: 'success' };
  } catch (error) {
    throw error;
  }
}
