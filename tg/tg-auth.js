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
            console.log('Telegram requested confirmation code');
            activeSession.status = 'CODE_REQUESTED';
            return phoneCodePromise;
          },
          onError: (err) => {
            console.error('Telegram authentication error:', err);
            throw err;
          },
        })
        .catch((err) => {
          console.error('Error during authentication start:', err);
        });

      return {
        success: true,
        requiresCode: true,
      };
    } catch (error) {
      console.error('Error during Telegram authentication:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error starting authentication:', error);

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
      error: 'No active authentication session',
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

      const result = {
        success: true,
        session,
      };

      activeSession = null;

      return result;
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error completing authentication:', error);
    activeSession = null;

    return {
      success: false,
      error: error.message,
    };
  }
}

export function clearAuthSession() {
  activeSession = null;

  return {
    success: true,
  };
}
