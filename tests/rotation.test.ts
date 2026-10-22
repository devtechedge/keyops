import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConsumerAdapter } from "../src/core/consumers/types.js";
import type { ProviderAdapter } from "../src/core/providers/types.js";
import { rotateSecret } from "../src/core/rotation.js";
import type { Consumer, Manifest, SecretConfig } from "../src/core/types.js";

const tempDirs: string[] = [];
const writes: string[] = [];
let revoked = false;
let verifyOk = true;

const manifest: Manifest = {
  version: 1,
  secrets: {
    OPENAI_API_KEY: {
      provider: "openai",
      project: "proj_123",
      serviceAccount: "svc_123",
      keyId: "key_old",
      consumers: [
        { type: "dotenv", path: ".env" },
        { type: "vercel", project: "app" },
      ],
      verify: { url: "https://example.com/verify", expect: 200 },
    },
  },
};

const provider: ProviderAdapter = {
  id: "openai",
  label: "OpenAI",
  async createKey() {
    return {
      value: "sk-new",
      keyId: "key_new",
      provider: "openai",
      createdAt: new Date().toISOString(),
    };
  },
  async revokeKey() {
    revoked = true;
  },
  async verifyKey() {
    return { ok: true, status: 200, detail: "ok" };
  },
  async listKeys() {
    return [];
  },
};

function consumerAdapter(type: Consumer["type"]): ConsumerAdapter {
  return {
    type,
    describe() {
      return type;
    },
    async read() {
      return "sk-old";
    },
    async write(_consumer: Consumer, value: string) {
      writes.push(`${type}:${value}`);
    },
  };
}

beforeEach(async () => {
  writes.length = 0;
  revoked = false;
  verifyOk = true;
  const dir = await mkdtemp(path.join(os.tmpdir(), "keyops-rotate-"));
  tempDirs.push(dir);
  process.env.KEYOPS_HOME = dir;
});

afterEach(async () => {
  delete process.env.KEYOPS_HOME;
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("rotateSecret", () => {
  it("creates, fans out, verifies, and revokes", async () => {
    const result = await rotateSecret({
      manifest,
      secretName: "OPENAI_API_KEY",
      approve: true,
      deps: {
        provider,
        consumers: {
          dotenv: consumerAdapter("dotenv"),
          vercel: consumerAdapter("vercel"),
        },
        verify: async () => ({ ok: verifyOk, status: 200, detail: "ok" }),
        escrow: {
          write: async () => "escrow",
          delete: async () => undefined,
        },
      },
    });

    expect(result.run.status).toBe("success");
    expect(revoked).toBe(true);
    expect(writes).toEqual(["dotenv:sk-new", "vercel:sk-new"]);
  });

  it("rolls back consumers when verification fails", async () => {
    verifyOk = false;
    await expect(
      rotateSecret({
        manifest,
        secretName: "OPENAI_API_KEY",
        approve: true,
        deps: {
          provider,
          consumers: {
            dotenv: consumerAdapter("dotenv"),
            vercel: consumerAdapter("vercel"),
          },
          verify: async () => ({ ok: false, status: 401, detail: "bad key" }),
          escrow: {
            write: async () => "escrow",
            delete: async () => undefined,
          },
        },
      }),
    ).rejects.toMatchObject({ code: "ROTATION_FAILED" });

    expect(writes).toEqual([
      "dotenv:sk-new",
      "vercel:sk-new",
      "vercel:sk-old",
      "dotenv:sk-old",
    ]);
    expect(revoked).toBe(false);
  });

  it("refuses to change production without approval", async () => {
    await expect(
      rotateSecret({ manifest, secretName: "OPENAI_API_KEY", approve: false }),
    ).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  });
});
