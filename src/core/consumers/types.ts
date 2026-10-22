import type { Consumer } from "../types.js";

export interface ConsumerContext {
  runId: string;
  secretName: string;
}

export interface ConsumerAdapter {
  type: Consumer["type"];
  describe(consumer: Consumer): string;
  read(consumer: Consumer, context?: ConsumerContext): Promise<string | null>;
  write(consumer: Consumer, value: string, context: ConsumerContext): Promise<void>;
}
