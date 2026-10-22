import { requestJson } from "../http.js";
import { resolveToken } from "../keyring.js";
import type { Consumer, VercelConsumer } from "../types.js";
import type { ConsumerAdapter, ConsumerContext } from "./types.js";

interface VercelEnv {
  id: string;
  key: string;
  value?: string;
  type?: string;
  target?: string[];
}

function targetConsumer(consumer: Consumer): VercelConsumer {
  return consumer as VercelConsumer;
}

function query(teamId?: string): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

function headers(): Record<string, string> {
  const token = resolveToken("vercel");
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

async function listEnv(consumer: VercelConsumer): Promise<VercelEnv[]> {
  const response = await requestJson<{ envs?: VercelEnv[] }>(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(consumer.project)}/env${query(consumer.teamId)}`,
    { headers: headers() },
  );
  return response.envs ?? [];
}

export const vercelConsumer: ConsumerAdapter = {
  type: "vercel",

  describe(consumer: Consumer): string {
    const target = targetConsumer(consumer);
    return `${target.project} on Vercel (${(target.target ?? ["production"]).join(", ")})`;
  },

  async read(): Promise<string | null> {
    return null;
  },

  async write(consumer: Consumer, value: string, context: ConsumerContext): Promise<void> {
    const target = targetConsumer(consumer);
    const variable = context.secretName;
    const envs = await listEnv(target);
    const existing = envs.find((env) => env.key === variable);

    if (existing) {
      await requestJson(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(target.project)}/env/${encodeURIComponent(existing.id)}${query(target.teamId)}`,
        {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({ value }),
        },
      );
      return;
    }

    await requestJson(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(target.project)}/env${query(target.teamId)}`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          key: variable,
          value,
          type: "encrypted",
          target: target.target ?? ["production"],
        }),
      },
    );
  },
};
