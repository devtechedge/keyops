import type {
  Consumer,
  Manifest,
  PlannedStep,
  RotationPlan,
  SecretConfig,
} from "./types.js";
import { KeyOpsError } from "./types.js";

function describeConsumer(consumer: Consumer): string {
  if (consumer.type === "dotenv") {
    return `Update ${consumer.variable ?? "the key"} in ${consumer.path}`;
  }
  if (consumer.type === "vercel") {
    return `Update ${consumer.project} on Vercel (${(consumer.target ?? ["production"]).join(", ")})`;
  }
  return `Update ${consumer.secret} in GitHub Actions for ${consumer.repo}`;
}

export function buildPlan(
  manifest: Manifest,
  secretName: string,
): RotationPlan {
  const secret = manifest.secrets[secretName];
  if (!secret) {
    throw new KeyOpsError(
      `Secret "${secretName}" is not in the manifest. Available: ${Object.keys(manifest.secrets).join(", ")}`,
      "SECRET_NOT_FOUND",
    );
  }

  const warnings: string[] = [];
  if (secret.provider === "openai" && (!secret.project || !secret.serviceAccount)) {
    warnings.push(
      "OpenAI rotation needs both project and serviceAccount in the manifest.",
    );
  }
  if (secret.provider === "anthropic") {
    warnings.push(
      "Anthropic cannot create keys through its API. Keep the console open for the assisted step.",
    );
  }
  if (!secret.keyId && secret.provider !== "openrouter") {
    warnings.push(
      "No keyId is set. Add the current key ID so KeyOps can revoke it after verification.",
    );
  }
  if (!secret.verify) {
    warnings.push(
      "No verify block is set. KeyOps will use the provider's default verification endpoint.",
    );
  }
  if (secret.consumers.some((consumer) => consumer.type === "github")) {
    warnings.push(
      "GitHub Actions secrets are write-only. Keep the old key escrowed until the run finishes.",
    );
  }

  const steps: PlannedStep[] = [
    {
      id: "preflight",
      title: "Preflight",
      detail: "Resolve admin credentials, validate the manifest, and lock the run.",
      risk: "low",
    },
    {
      id: "escrow",
      title: "Escrow the old key",
      detail: "Encrypt the current key and consumer values locally for rollback.",
      risk: "low",
    },
    {
      id: "create",
      title: secret.provider === "anthropic" ? "Accept the replacement key" : "Create the replacement key",
      detail:
        secret.provider === "anthropic"
          ? "Prompt for the key created in the Anthropic console."
          : `Create a new key through the ${secret.provider} admin API.`,
      risk: "low",
    },
  ];

  secret.consumers.forEach((consumer, index) => {
    steps.push({
      id: `consumer-${index + 1}`,
      title: `Write consumer ${index + 1}`,
      detail: describeConsumer(consumer),
      risk: "medium",
    });
  });

  steps.push(
    {
      id: "verify",
      title: "Verify the new key",
      detail: secret.verify?.url
        ? `Call ${secret.verify.url} and expect ${secret.verify.expect ?? 200}.`
        : "Call the provider's read-only auth endpoint.",
      risk: "low",
    },
    {
      id: "verify-old",
      title: "Confirm the old key is no longer needed",
      detail: "Check that the old key is not the only working credential.",
      risk: "medium",
    },
    {
      id: "revoke",
      title: "Revoke the old key",
      detail: secret.keyId
        ? `Delete or deactivate ${secret.keyId} after the new key passes verification.`
        : "Resolve the old key ID, then delete or deactivate it.",
      risk: "high",
    },
    {
      id: "close",
      title: "Close the run",
      detail: "Write the audit log and remove the encrypted escrow.",
      risk: "low",
    },
  );

  return {
    secretName,
    provider: secret.provider,
    steps,
    warnings,
  };
}

export function renderPlan(plan: RotationPlan): string {
  const lines = [
    `Rotation plan: ${plan.secretName} (${plan.provider})`,
    "",
    ...plan.steps.map(
      (step, index) =>
        `${String(index + 1).padStart(2, " ")}. [${step.risk}] ${step.title}\n     ${step.detail}`,
    ),
  ];
  if (plan.warnings.length > 0) {
    lines.push("", "Warnings:");
    for (const warning of plan.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  return lines.join("\n");
}

export function assertRotatable(secret: SecretConfig): void {
  if (secret.provider === "unknown") {
    throw new KeyOpsError(
      "This provider has no automatic rotation adapter. Use assisted rotation with a custom verify block.",
      "PROVIDER_UNSUPPORTED",
    );
  }
}
