import { resolveToken } from "../keyring.js";
import { requestJson, requestStatus } from "../http.js";
import type {
  CreatedKey,
  RemoteKey,
  SecretConfig,
} from "../types.js";
import { KeyOpsError } from "../types.js";
import type { ProviderAdapter, VerifyResult } from "./types.js";

const BASE = "https://api.anthropic.com";
const VERSION = "2023-06-01";

interface AnthropicKey {
  id: string;
  name?: string;
  created_at?: string;
  status?: string;
}

function adminHeaders(token: string): Record<string, string> {
  return {
    "x-api-key": token,
    "anthropic-version": VERSION,
    "content-type": "application/json",
  };
}

export const anthropic: ProviderAdapter = {
  id: "anthropic",
  label: "Anthropic",

  async createKey(): Promise<CreatedKey> {
    throw new KeyOpsError(
      "Anthropic does not expose key creation through its API. Create the replacement in the Anthropic console, then paste it at the prompt.",
      "ASSISTED_REQUIRED",
    );
  },

  async revokeKey(secret: SecretConfig, keyId: string): Promise<void> {
    const token = resolveToken("anthropic");
    await requestJson(`${BASE}/v1/organizations/api_keys/${encodeURIComponent(keyId)}`, {
      method: "POST",
      headers: adminHeaders(token),
      body: JSON.stringify({ status: "inactive" }),
    });
  },

  async verifyKey(_secret: SecretConfig, key: string): Promise<VerifyResult> {
    const status = await requestStatus(`${BASE}/v1/models`, {
      headers: {
        "x-api-key": key,
        "anthropic-version": VERSION,
      },
    });
    return {
      ok: status === 200,
      status,
      detail:
        status === 200
          ? "Anthropic accepted the new key."
          : `Anthropic returned ${status}.`,
    };
  },

  async listKeys(): Promise<RemoteKey[]> {
    const token = resolveToken("anthropic");
    const response = await requestJson<{ data?: AnthropicKey[] }>(
      `${BASE}/v1/organizations/api_keys?limit=100`,
      { headers: adminHeaders(token) },
    );
    return (response.data ?? []).map((key) => ({
      id: key.id,
      name: key.name ?? key.id,
      createdAt: key.created_at,
      status: key.status,
    }));
  },
};
