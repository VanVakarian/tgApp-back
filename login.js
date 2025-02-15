import input from "input";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { API_HASH, API_ID, TG_LOGIN, TG_PASSWORD } from "./env.js";
import { loadSession, saveSession } from "./session.js";

async function login() {
  const savedSession = loadSession();
  const stringSession = new StringSession(savedSession || "");
  const isNewSession = !savedSession;

  console.log(
    isNewSession
      ? "Starting new Telegram login..."
      : "Checking saved session..."
  );
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => TG_LOGIN,
    password: async () => TG_PASSWORD,
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  if (isNewSession) {
    console.log("Successfully logged in!");
    const session = client.session.save();
    saveSession(session);
    console.log("Session saved to file");
  } else {
    console.log("Session is valid, connection established");
  }

  await client.disconnect();
  return client;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  login()
    .then(() => {
      console.log("Login completed. You can now use other scripts.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default login;
