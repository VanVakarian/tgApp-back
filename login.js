import input from 'input';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { API_HASH, API_ID } from './env.js';
import { loadSession, saveSession } from './session.js';

export async function login(phone, password) {
  const savedSession = loadSession();
  const stringSession = new StringSession(savedSession || '');
  const isNewSession = !savedSession;

  console.log(isNewSession ? 'Starting new Telegram login...' : 'Checking saved session...');
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () => phone,
      password: async () => password,
      phoneCode: async () => await input.text('Please enter the code you received: '),
      onError: (err) => console.log(err),
    });

    if (isNewSession) {
      console.log('Successfully logged in!');
      const session = client.session.save();
      saveSession(session);
      console.log('Session saved to file');
    } else {
      console.log('Session is valid, connection established');
    }

    await client.disconnect();
    return client;
  } catch (error) {
    console.error('Login error:', error);
    client.needCode = error.message.includes('Telegram says: [400 PHONE_CODE_INVALID]');
    throw error;
  }
}
