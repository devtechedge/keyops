import type { Metadata } from "next";
import Link from "next/link";
import { AuditWorkbench } from "@/components/AuditWorkbench";

export const metadata: Metadata = {
  title: "Free AI key audit",
  description:
    "Paste a .env, CI config, or tracked file and find exposed AI API keys. Values are masked in the browser and nothing is uploaded.",
};

export default function AuditPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-[860px] text-center">
        <div className="eyebrow justify-center">
          <span className="eyebrow-dot" />
          Free, local, no signup
        </div>
        <h1 className="display mt-4 text-[clamp(2.4rem,5vw,4.2rem)] font-semibold">
          Find exposed AI keys.
        </h1>
        <p className="mx-auto mt-4 max-w-[580px] text-[15px] leading-7 text-[var(--muted)]">
          Paste a config file, a CI workflow, or a chunk of source. KeyOps looks for
          provider key patterns, masks every value, and tells you what to rotate
          first. Your text never leaves this tab.
        </p>
      </div>

      <div className="mt-10">
        <AuditWorkbench />
      </div>

      <div className="mx-auto mt-10 grid max-w-[1000px] gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">01 / local</p>
          <p className="mt-2 text-sm font-semibold">No upload.</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
            Detection runs in your browser. There is no API call and no account.
          </p>
        </div>
        <div className="card p-5">
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">02 / masked</p>
          <p className="mt-2 text-sm font-semibold">No raw value shown.</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
            Only a short prefix and suffix appear, enough to identify the key.
          </p>
        </div>
        <div className="card p-5">
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">03 / actionable</p>
          <p className="mt-2 text-sm font-semibold">Rotate, do not just alert.</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
            Take the finding to the CLI to plan the replacement and rollback.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[760px] rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
        <p className="text-xs font-semibold">Want the tracked-file scan?</p>
        <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
          The CLI scans tracked files, ignored files, and connected platforms. It
          also writes the rotation plan.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="btn btn-primary btn-sm" href="/dashboard">
            See the dashboard
          </Link>
          <a
            className="btn btn-ghost btn-sm"
            href="https://github.com/devtechedge/keyops"
            target="_blank"
            rel="noreferrer"
          >
            View CLI on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
