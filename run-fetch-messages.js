import { writeFile } from 'fs/promises';
import { PARSE_GROUP_IDS } from './env.js';
import { getDialogs, getMessages } from './messages.js';

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (key === '_client') return undefined;
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);

        if (value.constructor?.name === 'Integer') {
          return value.toString();
        }

        if (value.constructor?.name === 'VirtualClass') {
          const plainObj = {};
          for (const [k, v] of Object.entries(value)) {
            if (k !== '_client') {
              plainObj[k] = v;
            }
          }
          return plainObj;
        }
      }
      return value;
    },
    2
  );
}

async function main() {
  try {
    const dialogs = await getDialogs(1);
    // console.log( "All dialog IDs:", dialogs.map((d) => Number(d.id.value)));

    const targetDialogs = dialogs.filter((d) => PARSE_GROUP_IDS.includes(Number(d.id.value)));
    // console.log( "Target dialog IDs:", targetDialogs.map((d) => Number(d.id.value)));

    if (targetDialogs.length === 0) {
      targetDialogs.push(dialogs[0]);
    }

    await writeFile('tmp/dialogs.json', safeStringify(targetDialogs));
    console.log('Dialogs saved to temp/dialogs.json');

    if (dialogs.length > 0) {
      const lastMessages = [];

      for (const dialog of targetDialogs) {
        const messages = await getMessages(dialog.id.value, 1);
        // console.log(`\nLast message from dialog ${dialog.id.value}:`, messages);

        if (messages && messages.length > 0) {
          lastMessages.push({
            chatId: Number(dialog.id.value),
            chatTitle: dialog.title,
            message: messages[0],
          });
        }
      }

      await writeFile('tmp/messages.json', safeStringify(lastMessages));
      console.log('Last messages saved to temp/messages.json');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('No saved session')) {
      console.log("\nPlease run 'node login.js' first to create a session");
    }
    process.exit(1);
  }
  process.exit(0);
}

main();
