import pc from "picocolors";
import type {
  ProviderCapability,
  RotationPlan,
  RotationRun,
  ScanResult,
  Severity,
} from "../core/types.js";

const SEVERITY_COLOR: Record<Severity, (value: string) => string> = {
  critical: (value) => pc.bgRed(pc.white(pc.bold(` ${value.toUpperCase()} `))),
  high: (value) => pc.red(pc.bold(value.toUpperCase())),
  medium: (value) => pc.yellow(value.toUpperCase()),
  low: (value) => pc.gray(value.toUpperCase()),
};

function pad(value: string, width: number): string {
  if (value.length >= width) return value.slice(0, width);
  return value + " ".repeat(width - value.length);
}

export function printAudit(result: ScanResult, color = true): void {
  const paint = color ? (value: string) => value : (value: string) => value;
  const { summary, findings } = result;

  process.stdout.write(
    `${pc.bold("KeyOps audit")} ${pc.gray(result.root)}\n` +
      `${summary.filesScanned} files scanned in ${summary.durationMs}ms. ` +
      `${summary.uniqueKeys} unique key(s), ${summary.findings} finding(s).\n` +
      `critical ${summary.bySeverity.critical}  high ${summary.bySeverity.high}  medium ${summary.bySeverity.medium}  low ${summary.bySeverity.low}\n\n`,
  );

  if (findings.length === 0) {
    process.stdout.write(`${pc.green("No AI keys found.")}\n`);
    return;
  }

  const rows = findings.map((finding) => ({
    severity: finding.severity,
    provider: finding.providerLabel,
    key: finding.masked,
    location: `${finding.file}:${finding.line}`,
    reason: finding.reason,
  }));

  const widths = {
    severity: Math.max(8, ...rows.map((row) => row.severity.length)),
    provider: Math.max(21, ...rows.map((row) => row.provider.length)),
    key: Math.max(22, ...rows.map((row) => row.key.length)),
    location: Math.max(28, ...rows.map((row) => row.location.length)),
  };

  process.stdout.write(
    `${pc.gray(pad("SEVERITY", widths.severity))}  ${pc.gray(pad("PROVIDER", widths.provider))}  ${pc.gray(pad("KEY", widths.key))}  ${pc.gray(pad("LOCATION", widths.location))}  ${pc.gray("WHY")}\n`,
  );

  for (const row of rows) {
    const severity = color
      ? SEVERITY_COLOR[row.severity](row.severity)
      : row.severity.toUpperCase();
    process.stdout.write(
      `${pad(severity, widths.severity)}  ${pad(row.provider, widths.provider)}  ${pad(row.key, widths.key)}  ${pad(row.location, widths.location)}  ${row.reason}\n`,
    );
  }

  process.stdout.write(
    `\n${pc.gray("Raw key values are never printed. Use --json for machine-readable output.")}\n`,
  );
}

export function printCapabilities(capabilities: ProviderCapability[]): void {
  const header = `${"PROVIDER".padEnd(20)} ${"INVENTORY".padEnd(10)} ${"CREATE".padEnd(10)} ${"DELETE".padEnd(10)} ${"VERIFY".padEnd(8)} NOTE`;
  process.stdout.write(`${pc.bold(header)}\n`);
  process.stdout.write(`${"-".repeat(header.length)}\n`);
  for (const capability of capabilities) {
    process.stdout.write(
      `${capability.label.padEnd(20)} ${capability.inventory.padEnd(10)} ${capability.create.padEnd(10)} ${capability.delete.padEnd(10)} ${capability.verify.padEnd(8)} ${capability.note}\n`,
    );
  }
}

export function printPlan(plan: RotationPlan): void {
  process.stdout.write(`${pc.bold(`Rotation plan: ${plan.secretName}`)} ${pc.gray(plan.provider)}\n\n`);
  plan.steps.forEach((step, index) => {
    const risk =
      step.risk === "high" ? pc.red(step.risk) : step.risk === "medium" ? pc.yellow(step.risk) : pc.green(step.risk);
    process.stdout.write(`${String(index + 1).padStart(2, " ")}. ${pc.bold(step.title)} ${pc.gray(`[${risk}]`)}\n    ${step.detail}\n`);
  });
  if (plan.warnings.length > 0) {
    process.stdout.write(`\n${pc.yellow("Warnings")}\n`);
    for (const warning of plan.warnings) {
      process.stdout.write(`- ${warning}\n`);
    }
  }
}

export function printRun(run: RotationRun): void {
  process.stdout.write(`${pc.bold(`Run ${run.id}`)} ${pc.gray(`${run.secretName} / ${run.provider}`)}\n`);
  for (const step of run.steps) {
    const icon =
      step.status === "ok"
        ? pc.green("OK")
        : step.status === "failed"
          ? pc.red("FAIL")
          : step.status === "running"
            ? pc.cyan("RUN")
            : step.status === "skipped"
              ? pc.gray("SKIP")
              : pc.gray("WAIT");
    process.stdout.write(`${icon.padEnd(6)} ${step.title}${step.detail ? pc.gray(` - ${step.detail}`) : ""}\n`);
  }
  process.stdout.write(`\n${pc.bold("Status:")} ${run.status}\n`);
}
