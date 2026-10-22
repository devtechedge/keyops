import { createHash } from "node:crypto";
import type { Confidence, ProviderId } from "./types.js";

interface ProviderPattern {
  provider: ProviderId;
  label: string;
  pattern: RegExp;
  confidence: Confidence;
  reason: string;
}

const PATTERNS: ProviderPattern[] = [
  {
    provider: "openai",
    label: "OpenAI admin key",
    pattern: /\bsk-admin-[A-Za-z0-9_-]{20,}\b/g,
    confidence: "high",
    reason: "OpenAI admin key prefix",
  },
  {
    provider: "openai",
    label: "OpenAI service account key",
    pattern: /\bsk-svcacct-[A-Za-z0-9_-]{20,}\b/g,
    confidence: "high",
    reason: "OpenAI service account key prefix",
  },
  {
    provider: "openai",
    label: "OpenAI project key",
    pattern: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g,
    confidence: "high",
    reason: "OpenAI project key prefix",
  },
  {
    provider: "anthropic",
    label: "Anthropic admin key",
    pattern: /\bsk-ant-admin\d*-[A-Za-z0-9_-]{20,}\b/g,
    confidence: "high",
    reason: "Anthropic admin key prefix",
  },
  {
    provider: "anthropic",
    label: "Anthropic API key",
    pattern: /\bsk-ant-api\d*-[A-Za-z0-9_-]{20,}\b/g,
    confidence: "high",
    reason: "Anthropic API key prefix",
  },
  {
    provider: "openrouter",
    label: "OpenRouter key",
    pattern: /\bsk-or-v1-[A-Za-z0-9_-]{32,}\b/g,
    confidence: "high",
    reason: "OpenRouter key prefix",
  },
  {
    provider: "nvidia",
    label: "NVIDIA key",
    pattern: /\bnvapi-[A-Za-z0-9_-]{20,}\b/g,
    confidence: "high",
    reason: "NVIDIA key prefix",
  },
  {
    provider: "gemini",
    label: "Google AI key",
    pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g,
    confidence: "high",
    reason: "Google API key prefix",
  },
  {
    provider: "unknown",
    label: "Groq key",
    pattern: /\bgsk_[A-Za-z0-9]{20,}\b/g,
    confidence: "high",
    reason: "Groq key prefix",
  },
  {
    provider: "unknown",
    label: "xAI key",
    pattern: /\bxai-[A-Za-z0-9]{20,}\b/g,
    confidence: "high",
    reason: "xAI key prefix",
  },
  {
    provider: "unknown",
    label: "Hugging Face token",
    pattern: /\bhf_[A-Za-z0-9]{20,}\b/g,
    confidence: "high",
    reason: "Hugging Face token prefix",
  },
  {
    provider: "unknown",
    label: "Replicate token",
    pattern: /\br8_[A-Za-z0-9]{20,}\b/g,
    confidence: "high",
    reason: "Replicate token prefix",
  },
  {
    provider: "unknown",
    label: "Perplexity key",
    pattern: /\bpplx-[A-Za-z0-9]{20,}\b/g,
    confidence: "high",
    reason: "Perplexity key prefix",
  },
  {
    provider: "unknown",
    label: "Generic sk key",
    pattern: /\bsk-[A-Za-z0-9_-]{24,}\b/g,
    confidence: "low",
    reason: "Generic sk- key prefix",
  },
];

const ENV_PROVIDERS: Array<{ pattern: RegExp; provider: ProviderId; label: string }> = [
  { pattern: /^OPENAI_/i, provider: "openai", label: "OpenAI" },
  { pattern: /^ANTHROPIC_/i, provider: "anthropic", label: "Anthropic" },
  { pattern: /^OPENROUTER_/i, provider: "openrouter", label: "OpenRouter" },
  { pattern: /^(GOOGLE|GEMINI|VERTEX)_/i, provider: "gemini", label: "Google AI" },
  { pattern: /^(AWS_|BEDROCK_)/i, provider: "bedrock", label: "AWS Bedrock" },
  { pattern: /^NVIDIA_/i, provider: "nvidia", label: "NVIDIA" },
];

const PLACEHOLDER = /^(?:|x+|\*+|changeme|change-me|your[-_ ].*|example.*|placeholder.*|dummy.*|test.*|sk-x+|<.*>|\$\{.*\}|process\.env\..*)$/i;

export interface DetectedKey {
  provider: ProviderId;
  label: string;
  confidence: Confidence;
  reason: string;
  value: string;
  index: number;
}

export function detectKeys(line: string): DetectedKey[] {
  const found: DetectedKey[] = [];
  const seen = new Set<string>();

  for (const candidate of PATTERNS) {
    const regex = new RegExp(candidate.pattern.source, candidate.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      const value = match[0];
      if (seen.has(value)) continue;
      seen.add(value);
      found.push({
        provider: candidate.provider,
        label: candidate.label,
        confidence: candidate.confidence,
        reason: candidate.reason,
        value,
        index: match.index,
      });
    }
  }

  return found;
}

export function providerFromEnv(variable: string | undefined): {
  provider: ProviderId;
  label: string;
} | null {
  if (!variable) return null;
  for (const entry of ENV_PROVIDERS) {
    if (entry.pattern.test(variable)) {
      return { provider: entry.provider, label: entry.label };
    }
  }
  return null;
}

export function isPlaceholder(value: string): boolean {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  if (trimmed.length < 12) return true;
  if (PLACEHOLDER.test(trimmed)) return true;
  if (/^[a-z]+$/.test(trimmed)) return true;
  if (/(.)\1{7,}/.test(trimmed)) return true;
  return false;
}

export function maskKey(value: string): string {
  if (value.length <= 8) return "****";
  const prefixLength = value.startsWith("sk-") ? Math.min(10, value.length - 4) : 4;
  return `${value.slice(0, prefixLength)}...${value.slice(-4)}`;
}

export function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function entropy(value: string): number {
  const frequencies = new Map<string, number>();
  for (const char of value) {
    frequencies.set(char, (frequencies.get(char) ?? 0) + 1);
  }
  let result = 0;
  for (const count of frequencies.values()) {
    const probability = count / value.length;
    result -= probability * Math.log2(probability);
  }
  return result;
}
