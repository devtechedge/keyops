import { resolveToken } from "../keyring.js";
import { requestJson, requestStatus } from "../http.js";
import type {
  CreatedKey,
  RemoteKey,
  SecretConfig,
} from "../types.js";
import { KeyOpsError } from "../types.js";
import type { ProviderAdapter, VerifyResult } from "./types.js";

const BASE = "https://api.openai.com/v1";

interface ServiceAccountKey {
  id: string;
  name?: string;
  created_at?: number;
  value?: string;
}

function headers(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

function pathFor(secret: SecretConfig): string {
  if (!secret.project || !secret.serviceAccount) {
    throw new KeyOpsError(
      "OpenAI rotation needs project and serviceAccount in the manifest.",
      "OPENAI_TARGET_MISSING",
    );
  }
  return `${BASE}/organization/projects/${encodeURIComponent(secret.project)}/service_accounts/${encodeURIComponent(secret.serviceAccount)}/api_keys`;
}

export const openai: ProviderAdapter = {
  id: "openai",
  label: "OpenAI",

  async createKey(secret: SecretConfig, secretName: string): Promise<CreatedKey> {
    const token = resolveToken("openai");
    const name = `keyops-${secretName.toLowerCase()}-${Date.now()}`;
    const response = await requestJson<ServiceAccountKey>(pathFor(secret), {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ name }),
    });

    if (!response.value || !response.id) {
      throw new KeyOpsError(
        "OpenAI did not return a key value and id. Check that the admin key can manage project service accounts.",
        "OPENAI_CREATE_FAILED",
      );
    }

    return {
      value: response.value,
      keyId: response.id,
      provider: "openai",
      createdAt: new Date().toISOString(),
    };
  },

  async revokeKey(secret: SecretConfig, keyId: string): Promise<void> {
    const token = resolveToken("openai");
    await requestJson(`${pathFor(secret)}/${encodeURIComponent(keyId)}`, {
      method: "DELETE",
      headers: headers(token),
    });
  },

  async verifyKey(_secret: SecretConfig, key: string): Promise<VerifyResult> {
    const status = await requestStatus(`${BASE}/models`, {
      headers: { authorization: `Bearer ${key}` },
    });
    return {
      ok: status === 200,
      status,
      detail:
        status === 200
          ? "OpenAI accepted the new key."
          : `OpenAI returned ${status}.`,
    };
  },

  async listKeys(secret: SecretConfig): Promise<RemoteKey[]> {
    const token = resolveToken("openai");
    const response = await requestJson<{ data?: ServiceAccountKey[] }>(pathFor(secret), {
      headers: headers(token),
    });
    return (response.data ?? []).map((key) => ({
      id: key.id,
      name: key.name ?? key.id,
      createdAt: key.created_at
        ? new Date(key.created_at * 1000).toISOString()
        : undefined,
    }));
  },
};
