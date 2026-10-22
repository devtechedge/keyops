import type {
  CreatedKey,
  ProviderId,
  RemoteKey,
  SecretConfig,
} from "../types.js";

export interface VerifyResult {
  ok: boolean;
  status: number;
  detail: string;
}

export interface ProviderAdapter {
  id: ProviderId;
  label: string;
  createKey(secret: SecretConfig, secretName: string): Promise<CreatedKey>;
  revokeKey(secret: SecretConfig, keyId: string): Promise<void>;
  verifyKey(secret: SecretConfig, key: string): Promise<VerifyResult>;
  listKeys(secret: SecretConfig): Promise<RemoteKey[]>;
}
