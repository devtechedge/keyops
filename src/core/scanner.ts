import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  detectKeys,
  fingerprint,
  isPlaceholder,
  maskKey,
  providerFromEnv,
} from "./patterns.js";
import type {
  Finding,
  ScanOptions,
  ScanResult,
  Severity,
} from "./types.js";

const TEXT_EXTENSIONS = new Set([
  ".env",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".conf",
  ".config",
  ".md",
  ".mdx",
  ".txt",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".bat",
  ".cmd",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".php",
  ".cs",
  ".sql",
  ".vue",
  ".svelte",
  ".astro",
  ".tf",
  ".tfvars",
  ".properties",
  ".xml",
  ".gradle",
  ".dockerfile",
]);

const TEXT_FILENAMES = new Set([
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "vercel.json",
  "netlify.toml",
  "fly.toml",
  "render.yaml",
]);

const DEFAULT_EXCLUDES = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".vercel",
  ".turbo",
  ".cache",
  "vendor",
  "target",
  "venv",
  ".venv",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  "playwright-report",
  "test-results",
  ".keyops",
]);

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function matchesAny(relative: string, globs: string[]): boolean {
  return globs.some((glob) => globToRegExp(toPosix(glob)).test(relative));
}

function isTextFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  if (basename === ".env" || basename.startsWith(".env.")) return true;
  if (TEXT_FILENAMES.has(basename)) return true;
  if (/^Dockerfile(?:\..+)?$/.test(basename)) return true;
  return TEXT_EXTENSIONS.has(path.extname(basename).toLowerCase());
}

function variableFromLine(line: string): string | undefined {
  const envMatch = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
  if (envMatch) return envMatch[1];
  const jsonMatch = line.match(/^\s*["']([A-Za-z_][A-Za-z0-9_]*)["']\s*:/);
  if (jsonMatch) return jsonMatch[1];
  const yamlMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*/);
  if (yamlMatch) return yamlMatch[1];
  return undefined;
}

function trackedFiles(root: string): Set<string> {
  try {
    const output = execFileSync("git", ["ls-files", "-z"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return new Set(output.split("\0").filter(Boolean).map(toPosix));
  } catch {
    return new Set();
  }
}

function severityFor(
  providerConfidence: "high" | "medium" | "low",
  tracked: boolean,
  exampleFile: boolean,
  placeholder: boolean,
): { severity: Severity; reason: string } {
  if (placeholder) {
    return { severity: "low", reason: "placeholder or too short to be live" };
  }
  if (exampleFile) {
    return { severity: "medium", reason: "example or fixture file" };
  }
  if (tracked) {
    return { severity: "critical", reason: "live-looking key in a tracked file" };
  }
  if (providerConfidence === "high") {
    return { severity: "high", reason: "live-looking key in a local file" };
  }
  return { severity: "medium", reason: "possible key from a generic prefix" };
}

async function walk(
  root: string,
  current: string,
  options: Required<Pick<ScanOptions, "maxFiles">> & ScanOptions,
  files: string[],
): Promise<void> {
  if (files.length >= options.maxFiles) return;
  let entries;
  try {
    entries = await fs.readdir(current, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (files.length >= options.maxFiles) return;
    const fullPath = path.join(current, entry.name);
    const relative = toPosix(path.relative(root, fullPath));

    if (entry.isDirectory()) {
      if (DEFAULT_EXCLUDES.has(entry.name)) continue;
      if (options.exclude && matchesAny(relative, options.exclude)) continue;
      await walk(root, fullPath, options, files);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!isTextFile(entry.name)) continue;
    if (options.include && options.include.length > 0 && !matchesAny(relative, options.include)) {
      continue;
    }
    if (options.exclude && matchesAny(relative, options.exclude)) continue;
    files.push(fullPath);
  }
}

export async function scanDirectory(
  rootInput: string,
  options: ScanOptions = {},
): Promise<ScanResult> {
  const started = Date.now();
  const root = path.resolve(rootInput);
  const normalizedOptions = {
    ...options,
    maxFiles: options.maxFiles ?? 20_000,
    maxFileBytes: options.maxFileBytes ?? 1024 * 1024,
  };
  const files: string[] = [];
  await walk(root, root, normalizedOptions, files);
  const tracked = options.useGit === false ? new Set<string>() : trackedFiles(root);
  const findings: Finding[] = [];
  const seen = new Set<string>();
  let filesScanned = 0;

  for (const filePath of files) {
    let content: string;
    try {
      const stat = await fs.stat(filePath);
      if (stat.size > normalizedOptions.maxFileBytes) continue;
      content = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }
    if (content.includes("\0")) continue;
    filesScanned += 1;

    const relative = toPosix(path.relative(root, filePath));
    const isTracked = tracked.has(relative);
    const exampleFile = /(^|\/)(?:example|examples|sample|samples|fixture|fixtures|test|tests|__tests__|__mocks__)(?:\/|\.|$)/i.test(relative) || /\.example(?:\.|$)/i.test(relative);
    const lines = content.split(/\r?\n/);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      if (!line || line.length > 20_000) continue;
      const variable = variableFromLine(line);
      const detected = detectKeys(line);

      for (const key of detected) {
        const placeholder = isPlaceholder(key.value);
        const severity = severityFor(key.confidence, isTracked, exampleFile, placeholder);
        const dedupe = `${key.value}:${relative}:${lineIndex + 1}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);

        findings.push({
          provider: key.provider,
          providerLabel: key.label,
          masked: maskKey(key.value),
          fingerprint: fingerprint(key.value),
          file: relative,
          line: lineIndex + 1,
          column: key.index + 1,
          severity: severity.severity,
          confidence: key.confidence,
          reason: severity.reason,
        });
      }

      if (detected.length === 0 && variable) {
        const valueMatch = line.match(/=\s*(.+)$/);
        const value = valueMatch?.[1]?.trim().replace(/^['"]|['"]$/g, "");
        if (!value || value.length < 12) continue;
        const provider = providerFromEnv(variable);
        if (!provider) continue;
        const placeholder = isPlaceholder(value);
        const severity = severityFor("medium", isTracked, exampleFile, placeholder);
        const dedupe = `${value}:${relative}:${lineIndex + 1}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        findings.push({
          provider: provider.provider,
          providerLabel: `${provider.label} key`,
          masked: maskKey(value),
          fingerprint: fingerprint(value),
          file: relative,
          line: lineIndex + 1,
          column: (line.indexOf(value) || 0) + 1,
          severity: severity.severity,
          confidence: "medium",
          reason: `${severity.reason}; matched by variable name`,
        });
      }
    }
  }

  findings.sort((a, b) => {
    const severity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severity !== 0) return severity;
    return a.file.localeCompare(b.file) || a.line - b.line;
  });

  const bySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
  }

  return {
    root,
    summary: {
      filesScanned,
      findings: findings.length,
      uniqueKeys: new Set(findings.map((finding) => finding.fingerprint)).size,
      bySeverity,
      durationMs: Date.now() - started,
    },
    findings,
  };
}
