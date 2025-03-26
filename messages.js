import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { API_HASH, API_ID } from './env.js';
import { loadSession } from './session.js';

let client = null;

export async function getClient() {
  if (!client) {
    const savedSession = loadSession();
    if (!savedSession) {
      throw new Error('No saved session found. Please run login.js first');
    }

    const stringSession = new StringSession(savedSession);
    client = new TelegramClient(stringSession, API_ID, API_HASH, {
      connectionRetries: 5,
    });

    await client.connect();
  }
  return client;
}

export async function getMessages(chatId, limit = 100) {
  const client = await getClient();

  const messages = await client.getMessages(chatId, {
    limit: limit,
  });

  return messages;
  // return messages.map((msg) => ({
  //   id: msg.id,
  //   date: msg.date,
  //   text: msg.text,
  //   fromId: msg.fromId?.toString(),
  //   replyTo: msg.replyTo?.replyToMsgId,
  // }));
}

export async function getDialogs(limit = 50) {
  const client = await getClient();
  let allDialogs = [];

  console.log('Starting getDialogs...');

  const result = await client.getDialogs();
  // console.log("Got result:", result);

  for (let i = 0; i < result.total; i++) {
    if (result[i]) {
      // console.log("Dialog", i, ":", result[i]);
      allDialogs.push(result[i]);
    }
  }

  console.log('Returning total dialogs:', allDialogs.length);
  return allDialogs;
}
