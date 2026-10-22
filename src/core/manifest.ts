import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type {
  Consumer,
  Manifest,
  ProviderId,
  SecretConfig,
} from "./types.js";
import { KeyOpsError } from "./types.js";

const PROVIDERS = new Set<ProviderId>([
  "openai",
  "anthropic",
  "openrouter",
  "gemini",
  "bedrock",
  "nvidia",
  "unknown",
]);

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new KeyOpsError(`Manifest field "${field}" must be a non-empty string.`, "MANIFEST_INVALID");
  }
  return value;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireString(value, field);
}

function parseConsumer(value: unknown, index: number): Consumer {
  if (!value || typeof value !== "object") {
    throw new KeyOpsError(`Consumer ${index + 1} must be an object.`, "MANIFEST_INVALID");
  }
  const raw = value as Record<string, unknown>;
  const type = requireString(raw.type, `consumers[${index}].type`);

  if (type === "dotenv") {
    return {
      type,
      path: requireString(raw.path, `consumers[${index}].path`),
      variable: optionalString(raw.variable, `consumers[${index}].variable`),
    };
  }
  if (type === "vercel") {
    return {
      type,
      project: requireString(raw.project, `consumers[${index}].project`),
      target: Array.isArray(raw.target)
        ? raw.target.map((item, targetIndex) =>
            requireString(item, `consumers[${index}].target[${targetIndex}]`),
          )
        : undefined,
      teamId: optionalString(raw.teamId, `consumers[${index}].teamId`),
    };
  }
  if (type === "github") {
    return {
      type,
      repo: requireString(raw.repo, `consumers[${index}].repo`),
      secret: requireString(raw.secret, `consumers[${index}].secret`),
    };
  }

  throw new KeyOpsError(
    `Consumer ${index + 1} has unsupported type "${type}". Use dotenv, vercel, or github.`,
    "MANIFEST_INVALID",
  );
}

function parseSecret(value: unknown, name: string): SecretConfig {
  if (!value || typeof value !== "object") {
    throw new KeyOpsError(`Secret "${name}" must be an object.`, "MANIFEST_INVALID");
  }
  const raw = value as Record<string, unknown>;
  const provider = requireString(raw.provider, `secrets.${name}.provider`) as ProviderId;
  if (!PROVIDERS.has(provider)) {
    throw new KeyOpsError(
      `Secret "${name}" uses unsupported provider "${provider}".`,
      "MANIFEST_INVALID",
    );
  }

  if (!Array.isArray(raw.consumers) || raw.consumers.length === 0) {
    throw new KeyOpsError(
      `Secret "${name}" needs at least one consumer.`,
      "MANIFEST_INVALID",
    );
  }

  const verifyRaw = raw.verify;
  let verify;
  if (verifyRaw !== undefined) {
    if (!verifyRaw || typeof verifyRaw !== "object") {
      throw new KeyOpsError(`secrets.${name}.verify must be an object.`, "MANIFEST_INVALID");
    }
    const verifyObject = verifyRaw as Record<string, unknown>;
    verify = {
      url: requireString(verifyObject.url, `secrets.${name}.verify.url`),
      auth: verifyObject.auth as "bearer" | "x-api-key" | "none" | undefined,
      header: optionalString(verifyObject.header, `secrets.${name}.verify.header`),
      expect:
        typeof verifyObject.expect === "number" ? verifyObject.expect : undefined,
    };
  }

  return {
    provider,
    project: optionalString(raw.project, `secrets.${name}.project`),
    serviceAccount: optionalString(raw.serviceAccount, `secrets.${name}.serviceAccount`),
    keyId: optionalString(raw.keyId, `secrets.${name}.keyId`),
    consumers: raw.consumers.map((consumer, index) =>
      parseConsumer(consumer, index),
    ),
    verify,
    keepOld: optionalString(raw.keepOld, `secrets.${name}.keepOld`),
  };
}

export function validateManifest(value: unknown): Manifest {
  if (!value || typeof value !== "object") {
    throw new KeyOpsError("Manifest must be an object.", "MANIFEST_INVALID");
  }
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1) {
    throw new KeyOpsError("Manifest version must be 1.", "MANIFEST_INVALID");
  }
  if (!raw.secrets || typeof raw.secrets !== "object" || Array.isArray(raw.secrets)) {
    throw new KeyOpsError("Manifest needs a secrets object.", "MANIFEST_INVALID");
  }

  const secrets: Record<string, SecretConfig> = {};
  for (const [name, secret] of Object.entries(raw.secrets as Record<string, unknown>)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
      throw new KeyOpsError(
        `Secret name "${name}" must look like an environment variable.`,
        "MANIFEST_INVALID",
      );
    }
    secrets[name] = parseSecret(secret, name);
  }

  if (Object.keys(secrets).length === 0) {
    throw new KeyOpsError("Manifest has no secrets.", "MANIFEST_INVALID");
  }

  return { version: 1, secrets };
}

export async function loadManifest(filePath: string): Promise<Manifest> {
  const absolute = path.resolve(filePath);
  let content: string;
  try {
    content = await fs.readFile(absolute, "utf8");
  } catch {
    throw new KeyOpsError(`Cannot read manifest: ${absolute}`, "MANIFEST_NOT_FOUND");
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new KeyOpsError(`Invalid YAML: ${message}`, "MANIFEST_INVALID");
  }

  return validateManifest(parsed);
}

export function sampleManifest(): string {
  return `version: 1
secrets:
  OPENAI_API_KEY:
    provider: openai
    project: proj_your_project
    serviceAccount: svc_your_service_account
    keyId: key_your_current_key
    consumers:
      - type: dotenv
        path: .env.local
      - type: vercel
        project: your-vercel-project
        target:
          - production
      - type: github
        repo: your-org/your-repo
        secret: OPENAI_API_KEY
    verify:
      url: https://api.openai.com/v1/models
      auth: bearer
      expect: 200
    keepOld: 24h
`;
}
