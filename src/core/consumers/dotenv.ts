import { promises as fs } from "node:fs";
import path from "node:path";
import { keyopsHome } from "../escrow.js";
import type { Consumer, DotenvConsumer } from "../types.js";
import type { ConsumerAdapter, ConsumerContext } from "./types.js";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function readEnvValue(content: string, variable: string): string | null {
  const regex = new RegExp(
    `^\\s*(?:export\\s+)?${escapeRegExp(variable)}\\s*=\\s*(.*)$`,
    "m",
  );
  const match = content.match(regex);
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

export function setEnvValue(content: string, variable: string, value: string): string {
  const regex = new RegExp(
    `^(\\s*(?:export\\s+)?${escapeRegExp(variable)}\\s*=\\s*)(.*)$`,
    "m",
  );
  const match = content.match(regex);
  const newline = content.includes("\r\n") ? "\r\n" : "\n";

  if (match) {
    const oldValue = match[2].trim();
    const quote = oldValue.startsWith('"') ? '"' : oldValue.startsWith("'") ? "'" : "";
    const rendered = quote ? `${quote}${value}${quote}` : value;
    return content.replace(regex, `$1${rendered}`);
  }

  const suffix = content.endsWith("\n") || content.endsWith("\r\n") ? "" : newline;
  return `${content}${suffix}${variable}=${value}${newline}`;
}

function targetConsumer(consumer: Consumer): DotenvConsumer {
  return consumer as DotenvConsumer;
}

export const dotenvConsumer: ConsumerAdapter = {
  type: "dotenv",

  describe(consumer: Consumer): string {
    const target = targetConsumer(consumer);
    return `${target.variable ?? "key"} in ${target.path}`;
  },

  async read(consumer: Consumer, context?: ConsumerContext): Promise<string | null> {
    const target = targetConsumer(consumer);
    const filePath = path.resolve(target.path);
    try {
      const content = await fs.readFile(filePath, "utf8");
      return readEnvValue(content, target.variable ?? context?.secretName ?? path.basename(target.path));
    } catch {
      return null;
    }
  },

  async write(consumer: Consumer, value: string, context: ConsumerContext): Promise<void> {
    const target = targetConsumer(consumer);
    const filePath = path.resolve(target.path);
    const variable = target.variable ?? context.secretName;
    let content = "";
    try {
      content = await fs.readFile(filePath, "utf8");
      const backupDirectory = path.join(keyopsHome(), "backups", context.runId);
      await fs.mkdir(backupDirectory, { recursive: true });
      await fs.writeFile(
        path.join(backupDirectory, `${path.basename(filePath)}.bak`),
        content,
        { mode: 0o600 },
      );
    } catch {
      // The file may not exist yet. Create it below.
    }

    const next = setEnvValue(content, variable, value);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, next, { mode: 0o600 });
  },
};
