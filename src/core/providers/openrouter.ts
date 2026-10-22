import { resolveToken } from "../keyring.js";
import { requestJson, requestStatus } from "../http.js";
import type {
  CreatedKey,
  RemoteKey,
  SecretConfig,
} from "../types.js";
import { KeyOpsError } from "../types.js";
import type { ProviderAdapter, VerifyResult } from "./types.js";

const BASE = "https://openrouter.ai/api/v1";

interface CreateKeyResponse {
  key?: string;
  data?: {
    hash?: string;
    name?: string;
    created_at?: string;
  };
}

interface ListKeyResponse {
  data?: Array<{
    hash: string;
    name?: string;
    created_at?: string;
    disabled?: boolean;
  }>;
}

function headers(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

export const openrouter: ProviderAdapter = {
  id: "openrouter",
  label: "OpenRouter",

  async createKey(_secret: SecretConfig, secretName: string): Promise<CreatedKey> {
    const token = resolveToken("openrouter");
    const name = `keyops-${secretName.toLowerCase()}-${Date.now()}`;
    const response = await requestJson<CreateKeyResponse>(`${BASE}/keys`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ name }),
    });

    if (!response.key || !response.data?.hash) {
      throw new KeyOpsError(
        "OpenRouter did not return a key and hash. Check that the management key can provision keys.",
        "OPENROUTER_CREATE_FAILED",
      );
    }

    return {
      value: response.key,
      keyId: response.data.hash,
      provider: "openrouter",
      createdAt: new Date().toISOString(),
    };
  },

  async revokeKey(_secret: SecretConfig, keyId: string): Promise<void> {
    const token = resolveToken("openrouter");
    await requestJson(`${BASE}/keys/${encodeURIComponent(keyId)}`, {
      method: "DELETE",
      headers: headers(token),
    });
  },

  async verifyKey(_secret: SecretConfig, key: string): Promise<VerifyResult> {
    const status = await requestStatus(`${BASE}/key`, {
      headers: { authorization: `Bearer ${key}` },
    });
    return {
      ok: status === 200,
      status,
      detail:
        status === 200
          ? "OpenRouter accepted the new key."
          : `OpenRouter returned ${status}.`,
    };
  },

  async listKeys(): Promise<RemoteKey[]> {
    const token = resolveToken("openrouter");
    const response = await requestJson<ListKeyResponse>(`${BASE}/keys`, {
      headers: headers(token),
    });
    return (response.data ?? []).map((key) => ({
      id: key.hash,
      name: key.name ?? key.hash,
      createdAt: key.created_at,
      status: key.disabled ? "disabled" : "active",
    }));
  },
};
