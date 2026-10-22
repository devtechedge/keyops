import { requestStatus } from "./http.js";
import { getProvider } from "./providers/index.js";
import type { SecretConfig } from "./types.js";
import { KeyOpsError } from "./types.js";
import type { VerifyResult } from "./providers/types.js";

function headersFor(secret: SecretConfig, key: string): Record<string, string> {
  const auth = secret.verify?.auth ?? "bearer";
  if (auth === "none") return {};
  const header = secret.verify?.header ?? (auth === "x-api-key" ? "x-api-key" : "authorization");
  return {
    [header]: auth === "bearer" ? `Bearer ${key}` : key,
  };
}

export async function verifyKey(
  secret: SecretConfig,
  key: string,
): Promise<VerifyResult> {
  if (secret.verify?.url) {
    const expected = secret.verify.expect ?? 200;
    const status = await requestStatus(secret.verify.url, {
      headers: headersFor(secret, key),
    });
    return {
      ok: status === expected,
      status,
      detail:
        status === expected
          ? `Verify endpoint returned ${status}.`
          : `Verify endpoint returned ${status}, expected ${expected}.`,
    };
  }

  try {
    return await getProvider(secret.provider).verifyKey(secret, key);
  } catch (error) {
    if (error instanceof KeyOpsError && error.code === "PROVIDER_UNSUPPORTED") {
      throw new KeyOpsError(
        `Add a verify block for ${secret.provider} because it has no built-in verifier.`,
        "VERIFY_REQUIRED",
      );
    }
    throw error;
  }
}
