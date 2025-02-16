import { writeFile } from "fs/promises";
import { getDialogs, getMessages } from "./messages.js";

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (key === "_client") return undefined;
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);

        if (value.constructor?.name === "Integer") {
          return value.toString();
        }

        if (value.constructor?.name === "VirtualClass") {
          const plainObj = {};
          for (const [k, v] of Object.entries(value)) {
            if (k !== "_client") {
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
    console.log("Dialog structure:", Object.keys(dialogs[0]));
    console.log(
      "Dialog internal objects:",
      Object.entries(dialogs[0]).map(
        ([key, value]) => `${key}: ${value?.constructor?.name || typeof value}`
      )
    );

    await writeFile("del.json", safeStringify(dialogs[0]));
    console.log("Dialog saved to del.json");

    console.log("\nYour recent chats:");
    dialogs.forEach((d) =>
      console.log(`${d.name} (${d.id}): ${d.unreadCount} unread`)
    );

    if (dialogs.length > 0) {
      const messages = await getMessages(dialogs[0].id, 5);
      console.log(`\nLast 5 messages from ${dialogs[0].name}:`);
      messages.forEach((msg) => {
        const date = new Date(msg.date * 1000).toLocaleString();
        console.log(`[${date}] ${msg.text}`);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.message.includes("No saved session")) {
      console.log("\nPlease run 'node login.js' first to create a session");
    }
    process.exit(1);
  }
  process.exit(0);
}

main();
