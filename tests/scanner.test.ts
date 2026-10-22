import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scanDirectory } from "../src/core/scanner.js";

const tempDirs: string[] = [];
const openaiKey = ["sk-proj", "abcdefghijklmnopqrstuvwxyz123456"].join("-");

async function tempRepo(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "keyops-scan-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("scanDirectory", () => {
  it("finds a key in a local env file", async () => {
    const dir = await tempRepo();
    await writeFile(
      path.join(dir, ".env"),
      `OPENAI_API_KEY=${openaiKey}\n`,
    );
    const result = await scanDirectory(dir, { useGit: false });
    expect(result.summary.findings).toBe(1);
    expect(result.findings[0].provider).toBe("openai");
    expect(result.findings[0].severity).toBe("high");
    expect(result.findings[0].file).toBe(".env");
  });

  it("marks a committed env file critical", async () => {
    const dir = await tempRepo();
    await writeFile(
      path.join(dir, ".env"),
      `OPENAI_API_KEY=${openaiKey}\n`,
    );
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["add", ".env"], { cwd: dir, stdio: "ignore" });
    const result = await scanDirectory(dir);
    expect(result.findings[0].severity).toBe("critical");
  });

  it("treats example files as medium", async () => {
    const dir = await tempRepo();
    await writeFile(
      path.join(dir, ".env.example"),
      `OPENAI_API_KEY=${openaiKey}\n`,
    );
    const result = await scanDirectory(dir, { useGit: false });
    expect(result.findings[0].severity).toBe("medium");
  });

  it("skips node_modules and binary files", async () => {
    const dir = await tempRepo();
    await mkdir(path.join(dir, "node_modules", "pkg"), { recursive: true });
    await writeFile(
      path.join(dir, "node_modules", "pkg", ".env"),
      `OPENAI_API_KEY=${openaiKey}\n`,
    );
    await writeFile(path.join(dir, "image.bin"), openaiKey);
    const result = await scanDirectory(dir, { useGit: false });
    expect(result.summary.findings).toBe(0);
  });
});
