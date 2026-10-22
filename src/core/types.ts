export type ProviderId =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "gemini"
  | "bedrock"
  | "nvidia"
  | "unknown";

export type Severity = "critical" | "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";

export interface Finding {
  provider: ProviderId;
  providerLabel: string;
  masked: string;
  fingerprint: string;
  file: string;
  line: number;
  column: number;
  severity: Severity;
  confidence: Confidence;
  reason: string;
}

export interface ScanSummary {
  filesScanned: number;
  findings: number;
  uniqueKeys: number;
  bySeverity: Record<Severity, number>;
  durationMs: number;
}

export interface ScanResult {
  root: string;
  summary: ScanSummary;
  findings: Finding[];
}

export interface ScanOptions {
  include?: string[];
  exclude?: string[];
  maxFileBytes?: number;
  maxFiles?: number;
  useGit?: boolean;
}

export interface DotenvConsumer {
  type: "dotenv";
  path: string;
  variable?: string;
}

export interface VercelConsumer {
  type: "vercel";
  project: string;
  target?: string[];
  teamId?: string;
}

export interface GithubConsumer {
  type: "github";
  repo: string;
  secret: string;
}

export type Consumer = DotenvConsumer | VercelConsumer | GithubConsumer;

export interface VerifyConfig {
  url: string;
  auth?: "bearer" | "x-api-key" | "none";
  header?: string;
  expect?: number;
}

export interface SecretConfig {
  provider: ProviderId;
  project?: string;
  serviceAccount?: string;
  keyId?: string;
  consumers: Consumer[];
  verify?: VerifyConfig;
  keepOld?: string;
}

export interface Manifest {
  version: 1;
  secrets: Record<string, SecretConfig>;
}

export interface PlannedStep {
  id: string;
  title: string;
  detail: string;
  risk: "low" | "medium" | "high";
}

export interface RotationPlan {
  secretName: string;
  provider: ProviderId;
  steps: PlannedStep[];
  warnings: string[];
}

export interface CreatedKey {
  value: string;
  keyId?: string;
  provider: ProviderId;
  createdAt: string;
}

export interface RemoteKey {
  id: string;
  name: string;
  createdAt?: string;
  lastUsedAt?: string;
  status?: string;
}

export interface ProviderCapability {
  id: ProviderId;
  label: string;
  inventory: "yes" | "partial" | "no";
  create: "yes" | "assisted" | "no";
  delete: "yes" | "assisted" | "no";
  verify: "yes" | "no";
  note: string;
}

export interface RunStep {
  id: string;
  title: string;
  status: "pending" | "running" | "ok" | "failed" | "skipped";
  detail?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface RotationRun {
  id: string;
  secretName: string;
  provider: ProviderId;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "success" | "rolled_back" | "failed";
  steps: RunStep[];
}

export class KeyOpsError extends Error {
  readonly code: string;

  constructor(message: string, code = "KEYOPS_ERROR") {
    super(message);
    this.name = "KeyOpsError";
    this.code = code;
  }
}
