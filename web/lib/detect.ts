export type Severity = "critical" | "high" | "medium" | "low";

export interface Finding {
  provider: string;
  masked: string;
  line: number;
  column: number;
  severity: Severity;
  confidence: "high" | "medium" | "low";
  reason: string;
}

interface Pattern {
  provider: string;
  pattern: RegExp;
  confidence: "high" | "medium" | "low";
}

const PATTERNS: Pattern[] = [
  { provider: "OpenAI admin key", pattern: /sk-admin-[A-Za-z0-9_-]{20,}/g, confidence: "high" },
  { provider: "OpenAI service account", pattern: /sk-svcacct-[A-Za-z0-9_-]{20,}/g, confidence: "high" },
  { provider: "OpenAI project key", pattern: /sk-proj-[A-Za-z0-9_-]{20,}/g, confidence: "high" },
  { provider: "Anthropic admin key", pattern: /sk-ant-admin\d*-[A-Za-z0-9_-]{20,}/g, confidence: "high" },
  { provider: "Anthropic API key", pattern: /sk-ant-api\d*-[A-Za-z0-9_-]{20,}/g, confidence: "high" },
  { provider: "OpenRouter key", pattern: /sk-or-v1-[A-Za-z0-9_-]{32,}/g, confidence: "high" },
  { provider: "NVIDIA key", pattern: /nvapi-[A-Za-z0-9_-]{20,}/g, confidence: "high" },
  { provider: "Google AI key", pattern: /AIza[0-9A-Za-z_-]{30,}/g, confidence: "high" },
  { provider: "Groq key", pattern: /gsk_[A-Za-z0-9]{20,}/g, confidence: "high" },
  { provider: "xAI key", pattern: /xai-[A-Za-z0-9]{20,}/g, confidence: "high" },
  { provider: "Hugging Face token", pattern: /hf_[A-Za-z0-9]{20,}/g, confidence: "high" },
  { provider: "Replicate token", pattern: /r8_[A-Za-z0-9]{20,}/g, confidence: "high" },
  { provider: "Generic sk key", pattern: /sk-[A-Za-z0-9_-]{24,}/g, confidence: "low" },
];

const ENV_PROVIDERS: Array<[RegExp, string]> = [
  [/^OPENAI_/i, "OpenAI key"],
  [/^ANTHROPIC_/i, "Anthropic key"],
  [/^OPENROUTER_/i, "OpenRouter key"],
  [/^(GOOGLE|GEMINI|VERTEX)_/i, "Google AI key"],
  [/^(AWS_|BEDROCK_)/i, "AWS Bedrock key"],
  [/^NVIDIA_/i, "NVIDIA key"],
];

function variableFromLine(line: string): string | undefined {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
  return match?.[1];
}

function isPlaceholder(value: string): boolean {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  if (trimmed.length < 12) return true;
  if (/^(x+|\*+|changeme|your[-_ ].*|example.*|placeholder.*|dummy.*|<.*>)$/i.test(trimmed)) {
    return true;
  }
  return /(.)\1{7,}/.test(trimmed);
}

function mask(value: string): string {
  if (value.length <= 8) return "****";
  const prefix = value.startsWith("sk-") ? Math.min(10, value.length - 4) : 4;
  return `${value.slice(0, prefix)}...${value.slice(-4)}`;
}

export function auditText(text: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    const variable = variableFromLine(line);
    let matched = false;

    for (const candidate of PATTERNS) {
      const regex = new RegExp(candidate.pattern.source, candidate.pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        matched = true;
        const value = match[0];
        const key = `${value}:${index}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const placeholder = isPlaceholder(value);
        findings.push({
          provider: candidate.provider,
          masked: mask(value),
          line: index + 1,
          column: match.index + 1,
          severity: placeholder
            ? "low"
            : candidate.confidence === "high"
              ? "high"
              : "medium",
          confidence: candidate.confidence,
          reason: placeholder
            ? "Placeholder or repeating pattern"
            : candidate.confidence === "high"
              ? "Provider prefix matched"
              : "Generic prefix, verify manually",
        });
      }
    }

    if (!matched && variable) {
      const value = line.match(/=\s*(.+)$/)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
      if (!value || value.length < 12) return;
      const envProvider = ENV_PROVIDERS.find(([pattern]) => pattern.test(variable));
      if (!envProvider) return;
      const placeholder = isPlaceholder(value);
      const key = `${value}:${index}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push({
        provider: envProvider[1],
        masked: mask(value),
        line: index + 1,
        column: (line.indexOf(value) || 0) + 1,
        severity: placeholder ? "low" : "medium",
        confidence: "medium",
        reason: placeholder ? "Placeholder value" : "Matched by variable name",
      });
    }
  });

  return findings.sort((a, b) => {
    const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity] || a.line - b.line;
  });
}

export const SAMPLE_ENV = [
  "# Production secrets (sample, not real)",
  `OPENAI_API_KEY=${["sk-proj", "demo".repeat(8), "9f2a"].join("-")}`,
  `ANTHROPIC_API_KEY=${["sk-ant-api03", "demo".repeat(8)].join("-")}`,
  `OPENROUTER_API_KEY=${["sk-or-v1", "demo".repeat(16)].join("-")}`,
  "NEXT_PUBLIC_APP_URL=https://example.com",
  "STRIPE_SECRET_KEY=sk_live_do_not_paste_real_keys",
  `GITHUB_TOKEN=${["ghp", "demo".repeat(10)].join("_")}`,
].join("\n");
