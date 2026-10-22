import { describe, expect, it } from "vitest";
import {
  detectKeys,
  fingerprint,
  isPlaceholder,
  maskKey,
} from "../src/core/patterns.js";

const openaiKey = ["sk-proj", "abcdefghijklmnopqrstuvwxyz123456"].join("-");
const anthropicKey = ["sk-ant-api03", "abcdefghijklmnopqrstuvwxyz123456"].join("-");
const openRouterKey = ["sk-or-v1", "0123456789abcdef".repeat(4)].join("-");

describe("provider detection", () => {
  it("detects OpenAI project keys", () => {
    const keys = detectKeys(`OPENAI_API_KEY=${openaiKey}`);
    expect(keys).toHaveLength(1);
    expect(keys[0].provider).toBe("openai");
    expect(keys[0].confidence).toBe("high");
  });

  it("detects Anthropic keys before a generic sk- match", () => {
    const keys = detectKeys(`ANTHROPIC_API_KEY=${anthropicKey}`);
    expect(keys).toHaveLength(1);
    expect(keys[0].provider).toBe("anthropic");
  });

  it("detects OpenRouter keys", () => {
    const keys = detectKeys(openRouterKey);
    expect(keys).toHaveLength(1);
    expect(keys[0].provider).toBe("openrouter");
  });

  it("ignores placeholders", () => {
    expect(isPlaceholder("your_api_key_here")).toBe(true);
    expect(isPlaceholder(["sk", "x".repeat(24)].join("-"))).toBe(true);
    expect(isPlaceholder(openaiKey)).toBe(false);
  });

  it("masks values and fingerprints consistently", () => {
    const value = openaiKey;
    expect(maskKey(value)).toBe("sk-proj-ab...3456");
    expect(fingerprint(value)).toHaveLength(16);
    expect(fingerprint(value)).toBe(fingerprint(value));
  });
});
