import { describe, expect, it } from "vitest";
import { validateManifest } from "../src/core/manifest.js";
import { buildPlan } from "../src/core/planner.js";

const valid = {
  version: 1,
  secrets: {
    OPENAI_API_KEY: {
      provider: "openai",
      project: "proj_123",
      serviceAccount: "svc_123",
      keyId: "key_123",
      consumers: [
        { type: "dotenv", path: ".env.local" },
        { type: "vercel", project: "app", target: ["production"] },
        { type: "github", repo: "org/repo", secret: "OPENAI_API_KEY" },
      ],
      verify: { url: "https://api.openai.com/v1/models", auth: "bearer", expect: 200 },
    },
  },
};

describe("manifest", () => {
  it("accepts a valid manifest", () => {
    const manifest = validateManifest(valid);
    expect(manifest.secrets.OPENAI_API_KEY.consumers).toHaveLength(3);
  });

  it("rejects unknown consumers", () => {
    expect(() =>
      validateManifest({
        version: 1,
        secrets: {
          OPENAI_API_KEY: {
            provider: "openai",
            consumers: [{ type: "kubernetes" }],
          },
        },
      }),
    ).toThrow(/unsupported type/);
  });

  it("builds an ordered rotation plan with warnings", () => {
    const manifest = validateManifest(valid);
    const plan = buildPlan(manifest, "OPENAI_API_KEY");
    expect(plan.steps.map((step) => step.id)).toContain("revoke");
    expect(plan.steps.map((step) => step.id)).toContain("verify");
    expect(plan.warnings.join(" ")).toMatch(/write-only/);
  });

  it("warns when OpenAI target details are missing", () => {
    const manifest = validateManifest({
      version: 1,
      secrets: {
        OPENAI_API_KEY: {
          provider: "openai",
          consumers: [{ type: "dotenv", path: ".env" }],
        },
      },
    });
    const plan = buildPlan(manifest, "OPENAI_API_KEY");
    expect(plan.warnings.join(" ")).toMatch(/project and serviceAccount/);
  });
});
