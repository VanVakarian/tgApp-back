import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { saveTelegramSession } from '../auth-tg/auth-tg-db.js';
import { API_HASH, API_ID } from '../env.js';

let activeSession = null;

export async function initTelegramClient(session = '') {
  const stringSession = new StringSession(session);
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });
  return client;
}

export async function startAuthProcess(phone, password) {
  try {
    if (activeSession && activeSession.client) {
      await activeSession.client.disconnect();
    }

    const client = await initTelegramClient();
    await client.connect();

    let phoneCodePromise = null;
    let resolvePhoneCode = null;

    phoneCodePromise = new Promise((resolve) => {
      resolvePhoneCode = resolve;
    });

    activeSession = {
      phone,
      password,
      client,
      phoneCodeHash: null,
      status: 'CONNECTING',
      phoneCodePromise,
      resolvePhoneCode,
    };

    try {
      client
        .start({
          phoneNumber: async () => phone,
          password: async () => password,
          phoneCode: async () => {
            console.log('Telegram запросил код подтверждения');
            activeSession.status = 'CODE_REQUESTED';
            return phoneCodePromise;
          },
          onError: (err) => {
            console.error('Ошибка авторизации в Telegram:', err);
            throw err;
          },
        })
        .catch((err) => {
          console.error('Ошибка при старте авторизации:', err);
        });

      return {
        success: true,
        requiresCode: true,
      };
    } catch (error) {
      console.error('Ошибка при авторизации в Telegram:', error);
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при запуске авторизации:', error);

    if (activeSession && activeSession.client) {
      await activeSession.client.disconnect();
    }
    activeSession = null;

    return {
      success: false,
      error: error.message,
    };
  }
}

export async function completeAuthWithCode(code, userId) {
  if (!activeSession) {
    return {
      success: false,
      error: 'Нет активной сессии авторизации',
    };
  }

  try {
    activeSession.resolvePhoneCode(code);

    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const session = activeSession.client.session.save();

      if (userId) {
        await saveTelegramSession(userId, session);
      }

      await activeSession.client.disconnect();

      const result = {
        success: true,
        session,
      };

      activeSession = null;

      return result;
    } catch (error) {
      console.error('Ошибка при сохранении сессии:', error);
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при завершении авторизации:', error);

    if (activeSession && activeSession.client) {
      await activeSession.client.disconnect();
    }
    activeSession = null;

    return {
      success: false,
      error: error.message,
    };
  }
}

export function clearAuthSession() {
  if (activeSession && activeSession.client) {
    activeSession.client.disconnect();
  }
  activeSession = null;

  return {
    success: true,
  };
}
