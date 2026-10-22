import { describe, expect, it } from "vitest";
import { readEnvValue, setEnvValue } from "../src/core/consumers/dotenv.js";

describe("dotenv editing", () => {
  it("reads quoted values", () => {
    expect(readEnvValue('OPENAI_API_KEY="sk-test"\n', "OPENAI_API_KEY")).toBe("sk-test");
  });

  it("preserves quote style", () => {
    expect(setEnvValue('OPENAI_API_KEY="old"\n', "OPENAI_API_KEY", "new")).toBe(
      'OPENAI_API_KEY="new"\n',
    );
  });

  it("appends a missing variable", () => {
    expect(setEnvValue("FOO=bar", "OPENAI_API_KEY", "new")).toBe(
      "FOO=bar\nOPENAI_API_KEY=new\n",
    );
  });

  it("keeps CRLF files on CRLF", () => {
    expect(setEnvValue("FOO=bar\r\n", "OPENAI_API_KEY", "new")).toBe(
      "FOO=bar\r\nOPENAI_API_KEY=new\r\n",
    );
  });
});
