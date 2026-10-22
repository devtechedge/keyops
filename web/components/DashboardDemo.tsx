"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  demoConsumers,
  demoKeys,
  demoRuns,
  rotationSteps,
  type DemoKey,
} from "@/lib/demo-data";

const NAV = [
  { label: "Overview", count: null },
  { label: "Keys", count: "12" },
  { label: "Rotations", count: "3" },
  { label: "Consumers", count: "4" },
  { label: "Settings", count: null },
];

function ProviderMark({ provider, accent }: { provider: string; accent: string }) {
  const initials = provider.slice(0, 1);
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--line)] text-[10px] font-bold"
      style={{ background: `${accent}14`, color: accent }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active" || status === "success" || status === "synced"
      ? "var(--accent)"
      : status === "due" || status === "rolled_back"
        ? "var(--warning)"
        : "var(--faint)";
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />;
}

export function DashboardDemo() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [selected, setSelected] = useState<DemoKey>(demoKeys[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [rotated, setRotated] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!running) return;
    if (stepIndex >= rotationSteps.length) {
      setRunning(false);
      setComplete(true);
      setRotated((current) => new Set(current).add(selected.id));
      return;
    }
    const timer = setTimeout(() => setStepIndex((value) => value + 1), 680);
    return () => clearTimeout(timer);
  }, [running, stepIndex, selected.id]);

  function startRotation(key: DemoKey) {
    setSelected(key);
    setActiveNav("Rotations");
    setStepIndex(0);
    setComplete(false);
    setRunning(true);
  }

  function reset() {
    setStepIndex(0);
    setRunning(false);
    setComplete(false);
  }

  return (
    <div className="container-page py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Interactive demo
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Key health, in one place.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
            Demo data
          </span>
          <Link
            className="btn btn-ghost btn-sm"
            href="https://github.com/devtechedge/keyops"
            target="_blank"
            rel="noreferrer"
          >
            View CLI
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur-xl">
        <div className="flex min-h-[720px]">
          <aside className="hidden w-[208px] shrink-0 border-r border-[var(--line)] bg-[var(--card-solid)] p-4 lg:block">
            <div className="flex items-center gap-2 px-2 py-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent)] text-[11px] font-black text-[var(--accent-ink)]">
                K
              </span>
              <div>
                <p className="text-xs font-semibold">Acme AI</p>
                <p className="text-[10px] text-[var(--faint)]">demo workspace</p>
              </div>
            </div>

            <div className="mt-6 space-y-1">
              {NAV.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveNav(item.label)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${
                    activeNav === item.label
                      ? "bg-[var(--accent-soft)] font-medium text-[var(--ink)]"
                      : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count && (
                    <span className="mono text-[10px] text-[var(--faint)]">{item.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--faint)]">
                Weekly digest
              </p>
              <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">
                2 keys are older than 90 days. One has not been used in 5 days.
              </p>
              <button
                type="button"
                onClick={() => startRotation(demoKeys[1])}
                className="mt-3 text-[11px] font-medium text-[var(--accent)] hover:underline"
              >
                Rotate the oldest key
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-[var(--line)] pt-4">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)]/15 text-[10px] font-bold text-[var(--accent)]">
                DM
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium">Dev M</p>
                <p className="truncate text-[10px] text-[var(--faint)]">owner</p>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2 text-[11px] text-[var(--faint)]">
                <span>Workspace</span>
                <span>/</span>
                <span className="text-[var(--ink)]">{activeNav}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-2.5 py-1.5 sm:flex">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <input
                    aria-label="Search keys"
                    placeholder="Search keys"
                    className="w-28 bg-transparent text-[11px] text-[var(--ink)] outline-none placeholder:text-[var(--faint)]"
                  />
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => startRotation(selected)}>
                  Rotate a key
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="AI keys" value="12" detail="across 5 providers" />
                <Stat label="Need rotation" value="3" detail="older than 90 days" warning />
                <Stat label="Spend this month" value="$4,280" detail="+18% vs last month" />
                <Stat label="Exposed keys" value="0" detail="last 30 days" good />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
                <div className="card-solid overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold">Keys</p>
                      <p className="mt-0.5 text-[10px] text-[var(--faint)]">
                        Click a key to inspect it.
                      </p>
                    </div>
                    <span className="pill text-[10px]">6 shown</span>
                  </div>

                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-[620px] text-left">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-[9px] uppercase tracking-[0.12em] text-[var(--faint)]">
                          <th className="px-4 py-2 font-medium">Key</th>
                          <th className="px-3 py-2 font-medium">Age</th>
                          <th className="px-3 py-2 font-medium">Last used</th>
                          <th className="px-3 py-2 font-medium">Spend</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-4 py-2 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demoKeys.map((key) => {
                          const didRotate = rotated.has(key.id);
                          const status = didRotate ? "active" : key.status;
                          return (
                            <tr
                              key={key.id}
                              onClick={() => setSelected(key)}
                              className={`cursor-pointer border-b border-[var(--line)] text-[11px] transition-colors last:border-0 ${
                                selected.id === key.id
                                  ? "bg-[var(--accent-soft)]"
                                  : "hover:bg-[var(--bg-soft)]"
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <ProviderMark provider={key.provider} accent={key.accent} />
                                  <div className="min-w-0">
                                    <p className="truncate font-medium">{key.name}</p>
                                    <p className="truncate text-[10px] text-[var(--faint)]">
                                      {key.provider} / {key.project}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="mono px-3 py-3 text-[10px] text-[var(--muted)]">
                                {didRotate ? "just now" : key.age}
                              </td>
                              <td className="px-3 py-3 text-[10px] text-[var(--muted)]">
                                {didRotate ? "just now" : key.lastUsed}
                              </td>
                              <td className="px-3 py-3 text-[10px] text-[var(--muted)]">{key.spend}</td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center gap-1.5 text-[10px] capitalize text-[var(--muted)]">
                                  <StatusDot status={status} />
                                  {status === "due" ? "due" : status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    startRotation(key);
                                  }}
                                  className="text-[10px] font-medium text-[var(--accent)] hover:underline"
                                >
                                  Rotate
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card-solid overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold">Rotation run</p>
                      <p className="mt-0.5 text-[10px] text-[var(--faint)]">
                        {selected.provider} / {selected.name}
                      </p>
                    </div>
                    <span className="mono text-[9px] text-[var(--faint)]">run_7f3a91</span>
                  </div>

                  <div className="p-4">
                    <div className="space-y-1">
                      {rotationSteps.map((step, index) => {
                        const done = index < stepIndex || complete;
                        const current = running && index === stepIndex;
                        return (
                          <div
                            key={step.title}
                            className={`flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors ${
                              current ? "bg-[var(--accent-soft)]" : ""
                            }`}
                          >
                            <span
                              className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[8px] ${
                                done
                                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent)]"
                                  : current
                                    ? "animate-pulse-ring border-[var(--accent)]/50 text-[var(--accent)]"
                                    : "border-[var(--line)] text-[var(--faint)]"
                              }`}
                            >
                              {done ? "✓" : current ? "•" : "·"}
                            </span>
                            <div className="min-w-0">
                              <p
                                className={`text-[11px] ${
                                  done || current ? "text-[var(--ink)]" : "text-[var(--faint)]"
                                }`}
                              >
                                {step.title}
                              </p>
                              <p className="truncate text-[9px] text-[var(--faint)]">{step.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[var(--faint)]">Status</span>
                        <span className="text-[10px] font-medium">
                          {running ? "running" : complete ? "complete" : "ready"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                          style={{
                            width: `${Math.min(100, ((complete ? rotationSteps.length : stepIndex) / rotationSteps.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startRotation(selected)}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        {running ? "Running..." : complete ? "Rotate again" : "Start rotation"}
                      </button>
                      <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
                        Reset
                      </button>
                    </div>

                    {complete && (
                      <p className="mt-3 rounded-lg border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3 py-2 text-[10px] leading-5 text-[var(--muted)]">
                        New key is live. The old key is revoked. Rollback escrow is
                        available for 24 hours.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1.45fr_0.9fr]">
                <div className="card-solid overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                    <p className="text-xs font-semibold">Recent runs</p>
                    <span className="text-[10px] text-[var(--faint)]">last 7 days</span>
                  </div>
                  <div className="divide-y divide-[var(--line)]">
                    {demoRuns.map((run) => (
                      <div key={run.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <StatusDot status={run.status} />
                          <span className="mono truncate text-[10px] text-[var(--muted)]">{run.id}</span>
                          <span className="hidden truncate text-[10px] text-[var(--faint)] sm:inline">
                            {run.key}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-[10px]">
                          <span className="text-[var(--faint)]">{run.detail}</span>
                          <span className="capitalize text-[var(--muted)]">{run.status.replace("_", " ")}</span>
                          <span className="hidden text-[var(--faint)] sm:inline">{run.when}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-solid overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                    <p className="text-xs font-semibold">Consumers</p>
                    <span className="text-[10px] text-[var(--faint)]">fan-out targets</span>
                  </div>
                  <div className="divide-y divide-[var(--line)]">
                    {demoConsumers.map((consumer) => (
                      <div key={consumer.name} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-[11px]">{consumer.name}</p>
                          <p className="text-[9px] text-[var(--faint)]">{consumer.detail}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 text-[9px] capitalize text-[var(--muted)]">
                            <StatusDot status={consumer.status} />
                            {consumer.status}
                          </span>
                          <p className="text-[9px] text-[var(--faint)]">{consumer.meta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[10px] text-[var(--faint)]">
                Demo data resets on refresh. The CLI and rotation engine are real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  warning,
  good,
}: {
  label: string;
  value: string;
  detail: string;
  warning?: boolean;
  good?: boolean;
}) {
  return (
    <div className="card-solid p-3.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--faint)]">
        {label}
      </p>
      <p
        className={`mt-1.5 text-xl font-semibold tracking-[-0.04em] ${
          warning ? "text-[var(--warning)]" : good ? "text-[var(--accent)]" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-[var(--faint)]">{detail}</p>
    </div>
  );
}
