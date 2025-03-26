import login from './login.js';

async function main() {
  const client = await login();
  await client.sendMessage('me', { message: 'Hello from example.js!' });
  await client.disconnect();
}

main().catch(console.error);
