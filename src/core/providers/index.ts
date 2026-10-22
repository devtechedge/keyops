import type { ProviderId } from "../types.js";
import { KeyOpsError } from "../types.js";
import type { ProviderAdapter } from "./types.js";
import { anthropic } from "./anthropic.js";
import { openai } from "./openai.js";
import { openrouter } from "./openrouter.js";

const ADAPTERS: Partial<Record<ProviderId, ProviderAdapter>> = {
  openai,
  anthropic,
  openrouter,
};

export function getProvider(provider: ProviderId): ProviderAdapter {
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    throw new KeyOpsError(
      `No automatic rotation adapter for "${provider}". Use assisted rotation and a custom verify block.`,
      "PROVIDER_UNSUPPORTED",
    );
  }
  return adapter;
}

export function isAutoProvider(provider: ProviderId): boolean {
  return Boolean(ADAPTERS[provider]);
}
