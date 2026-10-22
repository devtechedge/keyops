import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Consumer, ProviderId } from "./types.js";
import { KeyOpsError } from "./types.js";

export interface EscrowPayload {
  runId: string;
  secretName: string;
  provider: ProviderId;
  oldKey: string;
  oldKeyId?: string;
  consumers: Consumer[];
  consumerValues: Record<string, string>;
  createdAt: string;
}

interface SealedPayload {
  version: 1;
  iv: string;
  tag: string;
  data: string;
}

export function keyopsHome(): string {
  return process.env.KEYOPS_HOME || path.join(os.homedir(), ".keyops");
}

export function escrowDir(): string {
  return path.join(keyopsHome(), "escrow");
}

export function runsDir(): string {
  return path.join(keyopsHome(), "runs");
}

export async function ensureHome(): Promise<void> {
  await fs.mkdir(keyopsHome(), { recursive: true });
  await fs.mkdir(escrowDir(), { recursive: true });
  await fs.mkdir(runsDir(), { recursive: true });
}

async function loadKey(): Promise<Buffer> {
  const fromEnv = process.env.KEYOPS_ESCROW_KEY;
  if (fromEnv) {
    const value = Buffer.from(fromEnv, "base64");
    if (value.length !== 32) {
      throw new KeyOpsError(
        "KEYOPS_ESCROW_KEY must be 32 bytes encoded as base64.",
        "ESCROW_KEY_INVALID",
      );
    }
    return value;
  }

  const keyPath = path.join(keyopsHome(), "escrow.key");
  try {
    const value = Buffer.from((await fs.readFile(keyPath, "utf8")).trim(), "base64");
    if (value.length === 32) return value;
  } catch {
    // Generate below.
  }

  await fs.mkdir(keyopsHome(), { recursive: true });
  const key = randomBytes(32);
  await fs.writeFile(keyPath, key.toString("base64"), { mode: 0o600 });
  return key;
}

function seal(key: Buffer, payload: EscrowPayload): SealedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function unseal(key: Buffer, sealed: SealedPayload): EscrowPayload {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(sealed.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(sealed.data, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as EscrowPayload;
}

export async function writeEscrow(payload: EscrowPayload): Promise<string> {
  await ensureHome();
  const key = await loadKey();
  const sealed = seal(key, payload);
  const filePath = path.join(escrowDir(), `${payload.runId}.json`);
  await fs.writeFile(filePath, JSON.stringify(sealed, null, 2), { mode: 0o600 });
  return filePath;
}

export async function readEscrow(runId: string): Promise<EscrowPayload> {
  const filePath = path.join(escrowDir(), `${runId}.json`);
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch {
    throw new KeyOpsError(`No escrow found for run ${runId}.`, "ESCROW_NOT_FOUND");
  }
  const sealed = JSON.parse(content) as SealedPayload;
  if (sealed.version !== 1) {
    throw new KeyOpsError("Unsupported escrow version.", "ESCROW_INVALID");
  }
  const key = await loadKey();
  try {
    return unseal(key, sealed);
  } catch {
    throw new KeyOpsError("Escrow decryption failed. The local escrow key changed.", "ESCROW_INVALID");
  }
}

export async function deleteEscrow(runId: string): Promise<void> {
  await fs.rm(path.join(escrowDir(), `${runId}.json`), { force: true });
}

export async function writeRun(run: unknown, runId: string): Promise<void> {
  await ensureHome();
  await fs.writeFile(
    path.join(runsDir(), `${runId}.json`),
    JSON.stringify(run, null, 2),
  );
}

export async function readRun(runId: string): Promise<unknown> {
  const filePath = path.join(runsDir(), `${runId}.json`);
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    throw new KeyOpsError(`No run found for ${runId}.`, "RUN_NOT_FOUND");
  }
}
