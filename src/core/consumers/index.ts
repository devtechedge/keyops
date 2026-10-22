import type { Consumer } from "../types.js";
import { KeyOpsError } from "../types.js";
import type { ConsumerAdapter } from "./types.js";
import { dotenvConsumer } from "./dotenv.js";
import { githubConsumer } from "./github.js";
import { vercelConsumer } from "./vercel.js";

const ADAPTERS: Record<Consumer["type"], ConsumerAdapter> = {
  dotenv: dotenvConsumer,
  vercel: vercelConsumer,
  github: githubConsumer,
};

export function getConsumer(type: Consumer["type"]): ConsumerAdapter {
  const adapter = ADAPTERS[type];
  if (!adapter) {
    throw new KeyOpsError(`Unsupported consumer type "${type}".`, "CONSUMER_UNSUPPORTED");
  }
  return adapter;
}
