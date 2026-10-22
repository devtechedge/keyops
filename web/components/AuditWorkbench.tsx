"use client";

import { useRef, useState } from "react";
import { auditText, SAMPLE_ENV, type Finding, type Severity } from "@/lib/detect";

const severityStyle: Record<Severity, string> = {
  critical: "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
  high: "border-[var(--danger)]/20 bg-[var(--danger)]/8 text-[var(--danger)]",
  medium: "border-[var(--warning)]/25 bg-[var(--warning)]/10 text-[var(--warning)]",
  low: "border-[var(--line)] bg-[var(--bg-soft)] text-[var(--muted)]",
};

export function AuditWorkbench() {
  const [text, setText] = useState("");
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [fileName, setFileName] = useState("pasted env");
  const fileRef = useRef<HTMLInputElement>(null);

  function scan() {
    setFindings(auditText(text));
  }

  function loadSample() {
    setText(SAMPLE_ENV);
    setFileName("sample.env");
    setFindings(null);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const content = await file.text();
    setText(content);
    setFileName(file.name);
    setFindings(null);
  }

  const counts = findings
    ? findings.reduce(
        (acc, finding) => {
          acc[finding.severity] += 1;
          return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0 } as Record<Severity, number>,
      )
    : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            <span className="mono">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".env,.txt,.yaml,.yml,.json,.ts,.js,.toml,.ini"
              className="hidden"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              Upload file
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={loadSample}>
              Load sample
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setFindings(null);
          }}
          spellCheck={false}
          placeholder={`OPENAI_API_KEY=sk-proj-...\nANTHROPIC_API_KEY=sk-ant-...\n\nPaste a .env file or any config text.`}
          className="mono h-[340px] w-full resize-none bg-transparent p-4 text-[12px] leading-6 text-[var(--ink)] outline-none placeholder:text-[var(--faint)] sm:h-[420px]"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] text-[var(--faint)]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Runs in your browser. Nothing is uploaded.
          </p>
          <button type="button" onClick={scan} className="btn btn-primary btn-sm">
            Scan text
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="card flex min-h-[440px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <p className="text-xs font-semibold">Audit result</p>
            <p className="mt-0.5 text-[11px] text-[var(--faint)]">
              Raw values are masked before they render.
            </p>
          </div>
          {findings && (
            <span className="pill text-[10px]">
              {findings.length} finding{findings.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {!findings ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--muted)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20.5 18.5 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium">Paste a config, then scan.</p>
            <p className="mt-1 max-w-[260px] text-xs leading-5 text-[var(--faint)]">
              You get provider, severity, line number, and a masked key. No account
              and no server call.
            </p>
          </div>
        ) : findings.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium">No AI keys found.</p>
            <p className="mt-1 max-w-[260px] text-xs leading-5 text-[var(--faint)]">
              That does not prove the repo is clean. Run the CLI for git history,
              ignored files, and connected platforms.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="flex flex-wrap gap-2 border-b border-[var(--line)] px-4 py-3">
              {(["critical", "high", "medium", "low"] as Severity[]).map((severity) => (
                <span
                  key={severity}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${severityStyle[severity]}`}
                >
                  {severity} {counts?.[severity] ?? 0}
                </span>
              ))}
            </div>
            <div className="divide-y divide-[var(--line)]">
              {findings.map((finding) => (
                <div key={`${finding.line}-${finding.masked}`} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{finding.provider}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${severityStyle[finding.severity]}`}
                    >
                      {finding.severity}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <code className="mono min-w-0 truncate text-[11px] text-[var(--muted)]">
                      {finding.masked}
                    </code>
                    <span className="mono shrink-0 text-[10px] text-[var(--faint)]">
                      line {finding.line}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--faint)]">{finding.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
