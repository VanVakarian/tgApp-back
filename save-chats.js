import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getClient } from './messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHATS_FILE = path.join(__dirname, 'chats.json');

async function getAllChats() {
  const client = await getClient();
  const chats = [];

  const dialogs = await client.getDialogs({});

  for (const dialog of dialogs) {
    chats.push({
      id: dialog.id,
      name: dialog.title,
      type: dialog.isChannel ? 'channel' : dialog.isGroup ? 'group' : 'private',
      username: dialog.username || null,
    });
  }

  return chats;
}

async function main() {
  try {
    console.log('Fetching all chats...');
    const chats = await getAllChats();

    chats.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.name.localeCompare(b.name);
    });

    fs.writeFileSync(CHATS_FILE, JSON.stringify({ chats }, null, 2));

    console.log(`\nFound ${chats.length} chats:`);
    console.log('Channels:');
    chats.filter((c) => c.type === 'channel').forEach((c) => console.log(`  ${c.name} (${c.id})`));

    console.log('\nGroups:');
    chats.filter((c) => c.type === 'group').forEach((c) => console.log(`  ${c.name} (${c.id})`));

    console.log('\nPrivate chats:');
    chats.filter((c) => c.type === 'private').forEach((c) => console.log(`  ${c.name} (${c.id})`));

    console.log(`\nAll chat information has been saved to ${CHATS_FILE}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('No saved session')) {
      console.log("\nPlease run 'node login.js' first to create a session");
    }
    process.exit(1);
  }
}

main();
