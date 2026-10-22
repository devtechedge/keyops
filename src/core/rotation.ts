import { randomBytes } from "node:crypto";
import { getConsumer } from "./consumers/index.js";
import type { ConsumerAdapter } from "./consumers/types.js";
import {
  deleteEscrow,
  readEscrow,
  readRun,
  writeEscrow,
  writeRun,
  type EscrowPayload,
} from "./escrow.js";
import { getProvider } from "./providers/index.js";
import type { ProviderAdapter } from "./providers/types.js";
import { readHidden } from "./prompt.js";
import { buildPlan, renderPlan } from "./planner.js";
import type {
  Consumer,
  Manifest,
  RunStep,
  RotationRun,
  SecretConfig,
} from "./types.js";
import { KeyOpsError } from "./types.js";
import { verifyKey as defaultVerifyKey } from "./verify.js";

export interface RotateOptions {
  manifest: Manifest;
  secretName: string;
  approve: boolean;
  oldKey?: string;
  newKey?: string;
  verify?: boolean;
  prompt?: (message: string) => Promise<string>;
  onStep?: (step: RunStep) => void;
  deps?: RotationDeps;
}

export interface RotationDeps {
  provider?: ProviderAdapter;
  consumers?: Partial<Record<Consumer["type"], ConsumerAdapter>>;
  verify?: typeof defaultVerifyKey;
  escrow?: {
    write: typeof writeEscrow;
    delete: typeof deleteEscrow;
  };
}

export interface RotateResult {
  run: RotationRun;
  warnings: string[];
}

export class RotationFailedError extends KeyOpsError {
  readonly run: RotationRun;

  constructor(message: string, run: RotationRun) {
    super(message, "ROTATION_FAILED");
    this.name = "RotationFailedError";
    this.run = run;
  }
}

function runId(): string {
  return `run_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function now(): string {
  return new Date().toISOString();
}

function consumerKey(consumer: Consumer, index: number): string {
  return `${consumer.type}-${index + 1}`;
}

function setStep(
  run: RotationRun,
  id: string,
  status: RunStep["status"],
  detail?: string,
  onStep?: (step: RunStep) => void,
): void {
  const step = run.steps.find((candidate) => candidate.id === id);
  if (!step) return;
  step.status = status;
  if (detail) step.detail = detail;
  if (status === "running") step.startedAt = now();
  if (status === "ok" || status === "failed" || status === "skipped") {
    step.finishedAt = now();
  }
  onStep?.(step);
}

async function resolveOldKey(
  secret: SecretConfig,
  options: RotateOptions,
): Promise<string> {
  if (options.oldKey) return options.oldKey;

  for (const consumer of secret.consumers) {
    if (consumer.type !== "dotenv") continue;
    const value = await (options.deps?.consumers?.dotenv ?? getConsumer("dotenv")).read(consumer, {
      runId: "preflight",
      secretName: options.secretName,
    });
    if (value) return value;
  }

  const prompt = options.prompt ?? readHidden;
  const value = await prompt("Current key (hidden, for rollback escrow): ");
  if (!value) {
    throw new KeyOpsError(
      "A current key is required for rollback. Add a dotenv consumer, pass --old-key, or set KEYOPS_OLD_KEY.",
      "OLD_KEY_REQUIRED",
    );
  }
  return value;
}

async function rollbackConsumers(
  payload: EscrowPayload,
  deps?: RotationDeps,
): Promise<void> {
  for (let index = payload.consumers.length - 1; index >= 0; index -= 1) {
    const consumer = payload.consumers[index];
    const adapter = deps?.consumers?.[consumer.type] ?? getConsumer(consumer.type);
    const oldValue = payload.consumerValues[consumerKey(consumer, index)] ?? payload.oldKey;
    await adapter.write(consumer, oldValue, {
      runId: payload.runId,
      secretName: payload.secretName,
    });
  }
}

export async function rotateSecret(options: RotateOptions): Promise<RotateResult> {
  if (!options.approve) {
    throw new KeyOpsError(
      "Rotation changes production secrets. Re-run with --approve after reviewing the plan.",
      "APPROVAL_REQUIRED",
    );
  }

  const secret = options.manifest.secrets[options.secretName];
  if (!secret) {
    throw new KeyOpsError(`Secret "${options.secretName}" is not in the manifest.`, "SECRET_NOT_FOUND");
  }

  const plan = buildPlan(options.manifest, options.secretName);
  const id = runId();
  const run: RotationRun = {
    id,
    secretName: options.secretName,
    provider: secret.provider,
    startedAt: now(),
    status: "running",
    steps: plan.steps.map((step) => ({
      id: step.id,
      title: step.title,
      status: "pending",
      detail: step.detail,
    })),
  };

  const adapter = options.deps?.provider ?? getProvider(secret.provider);
  const verify = options.deps?.verify ?? defaultVerifyKey;
  const escrow = options.deps?.escrow ?? { write: writeEscrow, delete: deleteEscrow };
  const mark = (stepId: string, status: RunStep["status"], detail?: string) =>
    setStep(run, stepId, status, detail, options.onStep);
  const persist = () => writeRun(run, run.id);

  mark("preflight", "running");
  const oldKey = await resolveOldKey(secret, options);
  mark("preflight", "ok", "Manifest and rollback key resolved.");
  await persist();

  mark("escrow", "running");
  const consumerValues: Record<string, string> = {};
  for (const [index, consumer] of secret.consumers.entries()) {
    if (consumer.type === "dotenv") {
      const value = await (options.deps?.consumers?.dotenv ?? getConsumer("dotenv")).read(consumer, {
        runId: run.id,
        secretName: options.secretName,
      });
      consumerValues[consumerKey(consumer, index)] = value ?? oldKey;
    } else {
      consumerValues[consumerKey(consumer, index)] = oldKey;
    }
  }
  const escrowPayload: EscrowPayload = {
    runId: run.id,
    secretName: options.secretName,
    provider: secret.provider,
    oldKey,
    oldKeyId: secret.keyId,
    consumers: secret.consumers,
    consumerValues,
    createdAt: now(),
  };
  await escrow.write(escrowPayload);
  mark("escrow", "ok", "Encrypted escrow written locally.");
  await persist();

  let revoked = false;
  let newKey = options.newKey;
  mark("create", "running");
  try {
    if (!newKey) {
      try {
        const created = await adapter.createKey(secret, options.secretName);
        newKey = created.value;
        mark("create", "ok", `Replacement created (${created.keyId ?? "no id returned"}).`);
      } catch (error) {
        if (error instanceof KeyOpsError && error.code === "ASSISTED_REQUIRED") {
          const prompt = options.prompt ?? readHidden;
          newKey = await prompt("New key (hidden, created in the provider console): ");
          if (!newKey) throw new KeyOpsError("No replacement key was supplied.", "NEW_KEY_REQUIRED");
          mark("create", "ok", "Replacement supplied through assisted rotation.");
        } else {
          throw error;
        }
      }
    } else {
      mark("create", "ok", "Replacement supplied by the caller.");
    }
    await persist();

    for (const [index, consumer] of secret.consumers.entries()) {
      const stepId = `consumer-${index + 1}`;
      mark(stepId, "running");
      const consumerAdapter =
        options.deps?.consumers?.[consumer.type] ?? getConsumer(consumer.type);
      await consumerAdapter.write(consumer, newKey, {
        runId: run.id,
        secretName: options.secretName,
      });
      mark(stepId, "ok", "Consumer updated.");
      await persist();
    }

    mark("verify", "running");
    if (options.verify === false) {
      mark("verify", "skipped", "Verification disabled.");
    } else {
      const result = await verify(secret, newKey);
      if (!result.ok) {
        throw new KeyOpsError(
          `New key failed verification: ${result.detail}`,
          "VERIFY_FAILED",
        );
      }
      mark("verify", "ok", result.detail);
    }
    await persist();

    mark("verify-old", "running");
    if (secret.keyId) {
      mark("verify-old", "ok", `Old key ${secret.keyId} is still active until revoke.`);
    } else {
      mark("verify-old", "skipped", "No old key id in the manifest.");
    }
    await persist();

    mark("revoke", "running");
    if (!secret.keyId) {
      mark("revoke", "skipped", "Add keyId to the manifest to revoke automatically.");
    } else if (secret.keepOld) {
      mark(
        "revoke",
        "skipped",
        `Old key kept active for ${secret.keepOld}. Revoke it manually after the window.`,
      );
    } else {
      await adapter.revokeKey(secret, secret.keyId);
      revoked = true;
      mark("revoke", "ok", `Old key ${secret.keyId} revoked.`);
    }
    await persist();

    mark("close", "running");
    await escrow.delete(run.id);
    run.finishedAt = now();
    run.status = "success";
    mark("close", "ok", "Run complete. Escrow removed.");
    await persist();

    return { run, warnings: plan.warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedStep = run.steps.find((step) => step.status === "running");
    if (failedStep) {
      setStep(run, failedStep.id, "failed", message, options.onStep);
    }

    if (revoked) {
      run.status = "failed";
      run.steps.push({
        id: "manual-recovery",
        title: "Manual recovery",
        status: "failed",
        detail:
          "The old key was already revoked. Consumers point at the new key. Check the run before retrying.",
        finishedAt: now(),
      });
    } else {
      run.steps.push({
        id: "rollback",
        title: "Rollback",
        status: "running",
        detail: "Restoring the old key to every consumer.",
        startedAt: now(),
      });

      try {
        await rollbackConsumers(escrowPayload, options.deps);
        run.steps[run.steps.length - 1].status = "ok";
        run.steps[run.steps.length - 1].detail = "Consumers restored to the old key.";
        run.steps[run.steps.length - 1].finishedAt = now();
        await escrow.delete(run.id);
        run.status = "rolled_back";
      } catch (rollbackError) {
        const rollbackMessage =
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
        run.steps[run.steps.length - 1].status = "failed";
        run.steps[run.steps.length - 1].detail = `Rollback failed: ${rollbackMessage}`;
        run.steps[run.steps.length - 1].finishedAt = now();
        run.status = "failed";
      }
    }

    run.finishedAt = now();
    await persist();
    throw new RotationFailedError(`Rotation failed: ${message}. Run: ${run.id}`, run);
  }
}

export async function rollbackRun(
  id: string,
  deps?: RotationDeps,
): Promise<EscrowPayload> {
  const payload = await readEscrow(id);
  await rollbackConsumers(payload, deps);
  await deleteEscrow(id);

  try {
    const existing = (await readRun(id)) as RotationRun;
    existing.status = "rolled_back";
    existing.finishedAt = now();
    existing.steps.push({
      id: "manual-rollback",
      title: "Manual rollback",
      status: "ok",
      detail: "Consumers restored from escrow.",
      finishedAt: now(),
    });
    await writeRun(existing, id);
  } catch {
    // The run log may be missing. The rollback still succeeded.
  }

  return payload;
}

export function previewRotation(manifest: Manifest, secretName: string): string {
  return renderPlan(buildPlan(manifest, secretName));
}
