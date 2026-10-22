"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    title: "Create replacement",
    detail: "OpenAI service-account key",
    meta: "key_new",
  },
  {
    title: "Write .env.production",
    detail: "Local consumer updated",
    meta: "dotenv",
  },
  {
    title: "Update Vercel",
    detail: "Production environment",
    meta: "vercel",
  },
  {
    title: "Update GitHub Actions",
    detail: "Repository secret",
    meta: "github",
  },
  {
    title: "Verify new key",
    detail: "GET /v1/models",
    meta: "200 OK",
  },
  {
    title: "Revoke old key",
    detail: "DELETE /api_keys/key_old",
    meta: "revoked",
  },
];

export function RotationHero() {
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (timer.current) clearTimeout(timer.current);
    setActive(0);
    setRunning(true);
  }

  useEffect(() => {
    const boot = setTimeout(start, 800);
    return () => {
      clearTimeout(boot);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    if (active >= STEPS.length) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(() => setActive((value) => value + 1), 720);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, running]);

  const complete = active >= STEPS.length;

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[560px]">
      <div className="absolute -top-3 left-3 z-10 hidden rounded-full border border-[var(--line)] bg-[var(--card-solid)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] shadow-lg sm:block">
        rollback ready
      </div>
      <div className="absolute -top-3 right-3 z-10 hidden rounded-full border border-[var(--line)] bg-[var(--card-solid)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] shadow-lg sm:block">
        no raw keys stored
      </div>

      <div className="terminal">
        <div className="terminal-bar">
          <span className="terminal-dot" />
          <span className="terminal-dot" />
          <span className="terminal-dot" />
          <span className="ml-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
            keyops / rotation
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/50">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                running ? "animate-pulse bg-[var(--accent)]" : "bg-white/30"
              }`}
            />
            {running ? "running" : complete ? "complete" : "ready"}
          </span>
        </div>

        <div className="terminal-body">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[12px] text-white/70">
            <span className="shrink-0 text-[var(--accent)]">$</span>
            <span className="mono min-w-0 truncate">keyops rotate OPENAI_API_KEY --approve</span>
            <span className="cursor shrink-0" />
          </div>

          <div className="mt-6 space-y-1">
            {STEPS.map((step, index) => {
              const done = index < active;
              const current = index === active && running;
              const pending = index > active || (!running && !complete && index > active);

              return (
                <div
                  key={step.title}
                  className={`group flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-300 ${
                    current ? "bg-white/[0.055]" : "bg-transparent"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] transition-all duration-300 ${
                      done
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent)]"
                        : current
                          ? "animate-pulse-ring border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-white/10 text-white/25"
                    }`}
                  >
                    {done ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="m5 12 4 4L19 6"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : current ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-[12px] font-medium transition-colors ${
                        pending ? "text-white/35" : "text-white/85"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/30">
                      {step.detail}
                    </div>
                  </div>

                  <span
                    className={`mono mt-0.5 rounded-md border px-1.5 py-0.5 text-[9px] transition-all ${
                      done
                        ? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-white/8 bg-white/[0.025] text-white/25"
                    }`}
                  >
                    {step.meta}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
            <div className="flex items-center gap-2 text-[10px] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span className="mono">run_7f3a91</span>
            </div>
            <button
              type="button"
              onClick={start}
              className="text-[10px] font-medium text-white/55 transition-colors hover:text-[var(--accent)]"
            >
              {complete ? "Run again" : running ? "Restart" : "Start"}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 left-6 right-6 -z-10 h-16 rounded-full bg-[var(--accent)]/10 blur-2xl" />
    </div>
  );
}
