#!/usr/bin/env node
import { accessSync, promises as fs } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { CAPABILITIES } from "./core/capabilities.js";
import { readRun, runsDir } from "./core/escrow.js";
import { loadManifest, sampleManifest } from "./core/manifest.js";
import {
  removeSecret,
  saveSecret,
  storedSecret,
} from "./core/keyring.js";
import { buildPlan } from "./core/planner.js";
import { readHidden } from "./core/prompt.js";
import {
  rollbackRun,
  rotateSecret,
  RotationFailedError,
} from "./core/rotation.js";
import { scanDirectory } from "./core/scanner.js";
import type { RotationRun, ScanResult, Severity } from "./core/types.js";
import { KeyOpsError } from "./core/types.js";
import { verifyKey } from "./core/verify.js";
import {
  printAudit,
  printCapabilities,
  printPlan,
  printRun,
} from "./ui/report.js";

const VERSION = "0.1.0";
const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const KEYRING_PROVIDERS: Record<string, string> = {
  openai: "openai-admin",
  anthropic: "anthropic-admin",
  openrouter: "openrouter-management",
  vercel: "vercel-token",
  github: "github-token",
};

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

function parseSeverity(value: string): Severity | "none" {
  if (value === "none") return "none";
  if (value in SEVERITY_RANK) return value as Severity;
  throw new KeyOpsError(
    `Unknown severity "${value}". Use critical, high, medium, low, or none.`,
    "INVALID_SEVERITY",
  );
}

function manifestOption(value: string | undefined): string {
  return value ?? ".keyops.yml";
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printStep(step: { title: string; status: string; detail?: string }): void {
  const icon =
    step.status === "ok"
      ? pc.green("ok")
      : step.status === "failed"
        ? pc.red("fail")
        : step.status === "running"
          ? pc.cyan("run")
          : pc.gray("skip");
  process.stderr.write(`${icon.padEnd(4)} ${step.title}${step.detail ? pc.gray(` - ${step.detail}`) : ""}\n`);
}

const program = new Command();

program
  .name("keyops")
  .description("Rotate AI API keys across every consumer with verification and rollback.")
  .version(VERSION);

program
  .command("audit")
  .argument("[path]", "directory to scan", ".")
  .description("Find AI keys and flag exposed or stale credentials.")
  .option("--json", "print machine-readable JSON")
  .option("--fail-on <severity>", "exit 1 at or above this severity", "none")
  .option("--include <glob>", "only scan matching paths", collect, [])
  .option("--exclude <glob>", "skip matching paths", collect, [])
  .option("--no-git", "do not read the git index")
  .option("--no-color", "disable color")
  .action(async (target: string, options: Record<string, unknown>) => {
    const failOn = parseSeverity(String(options.failOn ?? "none"));
    const result = await scanDirectory(target, {
      include: options.include as string[],
      exclude: options.exclude as string[],
      useGit: options.git !== false,
    });

    if (options.json) {
      printJson(result);
    } else {
      printAudit(result, options.color !== false);
    }

    if (
      failOn !== "none" &&
      result.findings.some((finding) => SEVERITY_RANK[finding.severity] <= SEVERITY_RANK[failOn])
    ) {
      process.exitCode = 1;
    }
  });

program
  .command("plan")
  .argument("<secret>", "environment variable name from the manifest")
  .description("Show the ordered rotation steps without changing anything.")
  .option("--manifest <path>", "manifest path", ".keyops.yml")
  .option("--json", "print machine-readable JSON")
  .action(async (secretName: string, options: Record<string, unknown>) => {
    const manifest = await loadManifest(manifestOption(options.manifest as string | undefined));
    const plan = buildPlan(manifest, secretName);
    if (options.json) printJson(plan);
    else printPlan(plan);
  });

program
  .command("rotate")
  .argument("<secret>", "environment variable name from the manifest")
  .description("Create a replacement key, fan it out, verify it, then revoke the old key.")
  .option("--manifest <path>", "manifest path", ".keyops.yml")
  .option("--approve", "confirm the production change")
  .option("--old-key <key>", "current key for rollback escrow (prefer KEYOPS_OLD_KEY)")
  .option("--new-key <key>", "replacement key for assisted rotation (prefer KEYOPS_NEW_KEY)")
  .option("--no-verify", "skip the live verification call")
  .option("--json", "print machine-readable JSON")
  .action(async (secretName: string, options: Record<string, unknown>) => {
    const manifest = await loadManifest(manifestOption(options.manifest as string | undefined));
    try {
      const result = await rotateSecret({
        manifest,
        secretName,
        approve: Boolean(options.approve),
        oldKey: (options.oldKey as string | undefined) ?? process.env.KEYOPS_OLD_KEY,
        newKey: (options.newKey as string | undefined) ?? process.env.KEYOPS_NEW_KEY,
        verify: options.verify !== false,
        onStep: options.json ? undefined : printStep,
      });
      if (options.json) printJson(result);
      else printRun(result.run);
    } catch (error) {
      if (error instanceof RotationFailedError) {
        if (options.json) printJson({ ok: false, error: error.message, run: error.run });
        else printRun(error.run);
      }
      throw error;
    }
  });

program
  .command("rollback")
  .argument("<run-id>", "run id printed by rotate")
  .description("Restore the old key to every consumer from the encrypted escrow.")
  .option("--json", "print machine-readable JSON")
  .action(async (runId: string, options: Record<string, unknown>) => {
    const payload = await rollbackRun(runId);
    if (options.json) printJson({ ok: true, runId, secretName: payload.secretName });
    else process.stdout.write(`${pc.green("Rolled back")} ${payload.secretName} from run ${runId}.\n`);
  });

program
  .command("verify")
  .argument("<secret>", "environment variable name from the manifest")
  .description("Check a key against its verify endpoint without rotating it.")
  .option("--manifest <path>", "manifest path", ".keyops.yml")
  .option("--key <key>", "key to check (prefer KEYOPS_VERIFY_KEY)")
  .option("--json", "print machine-readable JSON")
  .action(async (secretName: string, options: Record<string, unknown>) => {
    const manifest = await loadManifest(manifestOption(options.manifest as string | undefined));
    const secret = manifest.secrets[secretName];
    if (!secret) throw new KeyOpsError(`Secret "${secretName}" is not in the manifest.`, "SECRET_NOT_FOUND");
    const key =
      (options.key as string | undefined) ??
      process.env.KEYOPS_VERIFY_KEY ??
      (await readHidden("Key to verify (hidden): "));
    if (!key) throw new KeyOpsError("No key supplied.", "KEY_REQUIRED");
    const result = await verifyKey(secret, key);
    if (options.json) printJson(result);
    else process.stdout.write(`${result.ok ? pc.green("OK") : pc.red("FAIL")} ${result.detail}\n`);
    if (!result.ok) process.exitCode = 1;
  });

program
  .command("providers")
  .description("Show which providers support inventory, create, delete, and verify.")
  .option("--json", "print machine-readable JSON")
  .action((options: Record<string, unknown>) => {
    if (options.json) printJson(CAPABILITIES);
    else printCapabilities(CAPABILITIES);
  });

program
  .command("connect")
  .argument("<provider>", "openai, anthropic, openrouter, vercel, or github")
  .description("Store an admin token in the operating system keyring.")
  .action(async (provider: string) => {
    const keyringName = KEYRING_PROVIDERS[provider];
    if (!keyringName) {
      throw new KeyOpsError(
        `Unknown provider "${provider}". Use ${Object.keys(KEYRING_PROVIDERS).join(", ")}.`,
        "PROVIDER_UNKNOWN",
      );
    }
    const value = await readHidden(`${provider} admin token (hidden): `);
    if (!value) throw new KeyOpsError("No token supplied.", "TOKEN_REQUIRED");
    saveSecret(keyringName, value);
    process.stdout.write(`${pc.green("Stored")} ${provider} token in the OS keyring.\n`);
  });

program
  .command("disconnect")
  .argument("<provider>", "openai, anthropic, openrouter, vercel, or github")
  .description("Remove a stored admin token from the OS keyring.")
  .action((provider: string) => {
    const keyringName = KEYRING_PROVIDERS[provider];
    if (!keyringName) throw new KeyOpsError(`Unknown provider "${provider}".`, "PROVIDER_UNKNOWN");
    const removed = removeSecret(keyringName);
    process.stdout.write(
      `${removed ? pc.green("Removed") : pc.yellow("Not found")} ${provider} token.\n`,
    );
  });

program
  .command("init")
  .description("Write a starter .keyops.yml.")
  .option("--force", "overwrite an existing manifest")
  .action(async (options: Record<string, unknown>) => {
    const target = path.resolve(".keyops.yml");
    if (!options.force) {
      try {
        await fs.access(target);
        throw new KeyOpsError(
          ".keyops.yml already exists. Use --force to overwrite it.",
          "MANIFEST_EXISTS",
        );
      } catch (error) {
        if (error instanceof KeyOpsError) throw error;
      }
    }
    await fs.writeFile(target, sampleManifest(), "utf8");
    process.stdout.write(`${pc.green("Created")} ${target}\n`);
  });

program
  .command("runs")
  .description("List recent local rotation runs.")
  .action(async () => {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(runsDir());
    } catch {
      process.stdout.write("No runs yet.\n");
      return;
    }
    const runs = await Promise.all(
      entries
        .filter((entry) => entry.endsWith(".json"))
        .map(async (entry) => {
          const value = (await readRun(entry.replace(/\.json$/, ""))) as RotationRun;
          return value;
        }),
    );
    runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    for (const run of runs) {
      process.stdout.write(
        `${run.id}  ${run.secretName.padEnd(24)} ${run.provider.padEnd(12)} ${run.status}\n`,
      );
    }
  });

program
  .command("doctor")
  .description("Check local configuration and credentials without printing secrets.")
  .action(() => {
    const checks: Array<[string, boolean, string]> = [
      ["node", Number(process.versions.node.split(".")[0]) >= 20, process.versions.node],
      ["manifest", false, path.resolve(".keyops.yml")],
      ["openai admin", Boolean(process.env.OPENAI_ADMIN_KEY || storedSecret("openai-admin")), "env or keyring"],
      ["anthropic admin", Boolean(process.env.ANTHROPIC_ADMIN_KEY || storedSecret("anthropic-admin")), "env or keyring"],
      ["openrouter management", Boolean(process.env.OPENROUTER_MANAGEMENT_KEY || storedSecret("openrouter-management")), "env or keyring"],
      ["vercel token", Boolean(process.env.VERCEL_TOKEN || storedSecret("vercel-token")), "env or keyring"],
      ["github token", Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || storedSecret("github-token")), "env or keyring"],
    ];
    try {
      accessSync(path.resolve(".keyops.yml"));
      checks[1][1] = true;
    } catch {
      checks[1][1] = false;
    }
    for (const [name, ok, detail] of checks) {
      process.stdout.write(`${ok ? pc.green("OK") : pc.yellow("MISS")} ${name.padEnd(22)} ${pc.gray(detail)}\n`);
    }
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof KeyOpsError) {
      process.stderr.write(`${pc.red("Error")} ${error.message}\n`);
      process.exitCode = 1;
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${pc.red("Error")} ${message}\n`);
    process.exitCode = 1;
  }
}

void main();
