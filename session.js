import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_FILE = path.join(__dirname, "session.json");

function saveSession(session) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ session }, null, 2));
}

function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, "utf8");
      return JSON.parse(data).session;
    }
  } catch (err) {
    console.error("Error reading session file:", err);
  }
  return null;
}

export { loadSession, saveSession };
