import sodium from "libsodium-wrappers";
import { requestJson } from "../http.js";
import { resolveToken } from "../keyring.js";
import type { Consumer, GithubConsumer } from "../types.js";
import type { ConsumerAdapter, ConsumerContext } from "./types.js";

interface PublicKeyResponse {
  key_id: string;
  key: string;
}

function targetConsumer(consumer: Consumer): GithubConsumer {
  return consumer as GithubConsumer;
}

function headers(): Record<string, string> {
  const token = resolveToken("github");
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
    "x-github-api-version": "2022-11-28",
  };
}

function normalizeRepo(repo: string): string {
  return repo.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/^\/+|\/+$/g, "");
}

export const githubConsumer: ConsumerAdapter = {
  type: "github",

  describe(consumer: Consumer): string {
    const target = targetConsumer(consumer);
    return `${target.secret} in GitHub Actions for ${target.repo}`;
  },

  async read(): Promise<string | null> {
    return null;
  },

  async write(consumer: Consumer, value: string, _context: ConsumerContext): Promise<void> {
    const target = targetConsumer(consumer);
    const repo = normalizeRepo(target.repo);
    const publicKey = await requestJson<PublicKeyResponse>(
      `https://api.github.com/repos/${repo}/actions/secrets/public-key`,
      { headers: headers() },
    );

    await sodium.ready;
    const binaryKey = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
    const binaryValue = sodium.from_string(value);
    const encrypted = sodium.crypto_box_seal(binaryValue, binaryKey);
    const encryptedValue = sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);

    await requestJson(
      `https://api.github.com/repos/${repo}/actions/secrets/${encodeURIComponent(target.secret)}`,
      {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          encrypted_value: encryptedValue,
          key_id: publicKey.key_id,
        }),
      },
    );
  },
};
