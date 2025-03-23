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

export async function createAuthSession(phone, password) {
  return {
    phone,
    password,
    client: null,
    status: 'INIT',
    created: Date.now(),
    resolveCode: null,
    codePromise: null,
  };
}

export async function initiateAuth(phone, password, authSession) {
  try {
    const client = await initTelegramClient();
    authSession.client = client;
    authSession.status = 'CONNECTING';

    // Создаем Promise для кода верификации
    authSession.codePromise = new Promise((resolve) => {
      authSession.resolveCode = resolve;
    });

    // Используем client.start() с промисами для всех колбэков
    await client.connect();
    await client.start({
      phoneNumber: async () => phone,
      password: async () => password,
      phoneCode: async () => {
        authSession.status = 'CODE_REQUIRED';
        console.log('Waiting for code...');
        return authSession.codePromise;
      },
      onError: (err) => {
        throw err;
      },
    });

    // Если дошли до этой точки без ошибок, значит требуется код
    console.log('initiateAuth: Code required');
    return { event: 'request_code', data: 'Enter code', requiresCode: true };
  } catch (error) {
    authSession.status = 'ERROR';
    authSession.error = error.message;
    if (authSession.client) {
      await authSession.client.disconnect();
    }
    throw error;
  }
}

export async function completeAuthWithCode(code, authSession, userId) {
  try {
    if (!authSession || authSession.status !== 'CODE_REQUIRED') {
      throw new Error('Invalid auth session state');
    }

    // Передаем код в ожидающий промис
    console.log('Received code:', code);
    authSession.resolveCode(code);

    // Ждем завершения процесса авторизации
    try {
      // Сохраняем строку сессии после успешной авторизации
      const session = authSession.client.session.save();
      authSession.status = 'COMPLETED';
      authSession.session = session;

      // Сохраняем сессию в базе данных
      await db.saveTelegramSession(userId, session);

      // Отключаем клиент
      await authSession.client.disconnect();

      return { event: 'auth_status', data: 'success' };
    } catch (error) {
      authSession.status = 'ERROR';
      authSession.error = error.message;
      if (authSession.client) {
        await authSession.client.disconnect();
      }
      throw error;
    }
  } catch (error) {
    authSession.status = 'ERROR';
    authSession.error = error.message;
    throw error;
  }
}
