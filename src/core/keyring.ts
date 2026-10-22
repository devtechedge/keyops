import { Entry } from "@napi-rs/keyring";
import type { ProviderId } from "./types.js";

const SERVICE = "keyops";

const ENV_NAMES: Record<string, string[]> = {
  openai: ["OPENAI_ADMIN_KEY"],
  anthropic: ["ANTHROPIC_ADMIN_KEY"],
  openrouter: ["OPENROUTER_MANAGEMENT_KEY"],
  vercel: ["VERCEL_TOKEN"],
  github: ["GITHUB_TOKEN", "GH_TOKEN"],
};

const KEYRING_NAMES: Record<string, string> = {
  openai: "openai-admin",
  anthropic: "anthropic-admin",
  openrouter: "openrouter-management",
  vercel: "vercel-token",
  github: "github-token",
};

export function storedSecret(name: string): string | null {
  try {
    return new Entry(SERVICE, name).getPassword();
  } catch {
    return null;
  }
}

export function saveSecret(name: string, value: string): void {
  new Entry(SERVICE, name).setPassword(value);
}

export function removeSecret(name: string): boolean {
  try {
    return new Entry(SERVICE, name).deletePassword();
  } catch {
    return false;
  }
}

export function resolveToken(name: "openai" | "anthropic" | "openrouter" | "vercel" | "github"): string {
  for (const envName of ENV_NAMES[name]) {
    const value = process.env[envName];
    if (value) return value;
  }
  const keyringName = KEYRING_NAMES[name];
  const value = keyringName ? storedSecret(keyringName) : null;
  if (value) return value;
  throw new Error(
    `No ${name} credential. Set ${ENV_NAMES[name].join(" or ")} or run "keyops connect ${name}".`,
  );
}

export function resolveProviderToken(provider: ProviderId): string {
  if (provider === "openai") return resolveToken("openai");
  if (provider === "anthropic") return resolveToken("anthropic");
  if (provider === "openrouter") return resolveToken("openrouter");
  throw new Error(`No admin credential is defined for provider "${provider}".`);
}
