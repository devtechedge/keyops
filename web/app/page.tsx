import Link from "next/link";
import { RotationHero } from "@/components/RotationHero";

const providers = [
  "OpenAI",
  "Anthropic",
  "OpenRouter",
  "Google AI",
  "AWS Bedrock",
  "NVIDIA",
  "Vercel",
  "GitHub Actions",
];

const steps = [
  {
    number: "01",
    title: "Audit",
    body: "Find AI keys in tracked files, env files, CI config, and connected platforms. Raw values stay masked.",
  },
  {
    number: "02",
    title: "Plan",
    body: "KeyOps resolves the provider, the old key id, every consumer, and the rollback path before anything changes.",
  },
  {
    number: "03",
    title: "Rotate",
    body: "Create the replacement, write it to each consumer in order, verify it with a real call, then revoke the old key.",
  },
  {
    number: "04",
    title: "Roll back",
    body: "If a consumer fails or verification does not pass, the old key goes back to every consumer from encrypted escrow.",
  },
];

const transaction = [
  ["Preflight", "Validate the manifest and admin token. Lock the run."],
  ["Escrow", "Encrypt the old key and consumer values locally."],
  ["Create", "Create a scoped replacement key with an expiry."],
  ["Fan out", "Write Vercel, GitHub Actions, and local env in order."],
  ["Verify", "Call the provider with the new key and expect 200."],
  ["Revoke", "Deactivate the old key only after the new one passes."],
];

const faqs = [
  {
    question: "Do you store my raw keys?",
    answer:
      "No. The audit masks values. Rotation uses admin tokens stored in your OS keyring or environment. The old key is encrypted in local escrow only for the duration of the run, then removed.",
  },
  {
    question: "Can it rotate Anthropic keys?",
    answer:
      "Assisted. Anthropic does not create keys through its API, so KeyOps prompts for the key you create in the console, writes it everywhere, verifies it, then deactivates the old key.",
  },
  {
    question: "Is this a gateway or a proxy?",
    answer:
      "No. Your traffic never passes through KeyOps. It changes the secret where it already lives, so there are no code changes and no new latency.",
  },
  {
    question: "What happens if rotation breaks a consumer?",
    answer:
      "The run stops and restores the old key to every consumer from encrypted escrow. The failure is recorded with the exact step that failed.",
  },
  {
    question: "Why not rotate every week?",
    answer:
      "Weekly rotation is a bad default. It creates downtime and does not fix a key that was copied before the rotation. KeyOps supports scheduled rotation, but the safe default is event-driven: after a leak, a departure, or an incident.",
  },
];

function Check() {
  return (
    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden pb-20 pt-14 sm:pt-20">
        <div className="hero-glow" />
        <div className="grid-bg absolute inset-0 -z-10 opacity-50" />
        <div className="container-page relative">
          <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="animate-fade-up">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                Key rotation, with proof
              </div>
              <h1 className="display mt-5 max-w-[660px] text-[clamp(2.65rem,6.2vw,5.1rem)] font-semibold">
                Rotate a leaked key without breaking production.
              </h1>
              <p className="mt-6 max-w-[540px] text-[16px] leading-7 text-[var(--muted)] sm:text-[17px]">
                KeyOps creates the replacement, writes it to every consumer, proves
                it works, then revokes the old key. If any step fails, it rolls back.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link className="btn btn-primary" href="/audit">
                  Run free audit
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link className="btn btn-ghost" href="/dashboard">
                  See a rotation
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[var(--faint)]">
                <span className="inline-flex items-center gap-1.5">
                  <Check /> Open source CLI
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check /> 20 tests
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check /> Rollback included
                </span>
              </div>
            </div>

            <div className="animate-fade-up [animation-delay:120ms]">
              <RotationHero />
            </div>
          </div>

          <div className="mt-16 border-y border-[var(--line)] py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-medium uppercase tracking-[0.13em] text-[var(--faint)]">
              <span className="mr-2 text-[9px] tracking-[0.18em]">Built for</span>
              {providers.map((provider) => (
                <span key={provider}>{provider}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="max-w-[720px]">
          <div className="eyebrow">The gap</div>
          <h2 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold">
            Finding the key is the easy part.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
            The hard part is replacing one credential everywhere it lives without
            taking production down. Most tools stop at the alert.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">01 / scanners</p>
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em]">They find the leak.</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              GitHub secret scanning, gitleaks, and trufflehog are good at detection.
              None of them replace the key in Vercel, GitHub Actions, and your local env.
            </p>
          </div>
          <div className="card p-6">
            <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">02 / gateways</p>
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em]">They change your code.</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              A proxy adds a new network hop, a new failure mode, and a migration.
              Your app still needs a real key at the edge.
            </p>
          </div>
          <div className="card border-[var(--accent)]/30 bg-[var(--accent-soft)] p-6">
            <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">03 / keyops</p>
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em]">It changes the secret.</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              One transaction: create, fan out, verify, revoke. Every step has a
              rollback. No proxy in front of your traffic.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-[var(--line)] bg-[var(--bg-soft)]/60 py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="eyebrow">How it works</div>
            <h2 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold">
              A rotation transaction, not a checklist.
            </h2>
            <p className="mt-4 max-w-[480px] text-[15px] leading-7 text-[var(--muted)]">
              Plan first, approve the change, then let KeyOps execute the steps in
              order. The run log records what changed and what was rolled back.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="pill">OpenAI</span>
              <span className="pill">Anthropic</span>
              <span className="pill">OpenRouter</span>
              <span className="pill">Vercel</span>
              <span className="pill">GitHub</span>
              <span className="pill">.env</span>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-bar">
              <span className="terminal-dot" />
              <span className="terminal-dot" />
              <span className="terminal-dot" />
              <span className="ml-3 text-[10px] uppercase tracking-[0.16em] text-white/40">quick start</span>
            </div>
            <div className="terminal-body space-y-4 text-[12px] leading-6">
              <div>
                <p className="text-white/35"># 1. See the plan. Nothing changes.</p>
                <p className="mono mt-1 text-white/85">
                  <span className="text-[var(--accent)]">$</span> npx keyops plan OPENAI_API_KEY
                </p>
              </div>
              <div>
                <p className="text-white/35"># 2. Rotate with approval.</p>
                <p className="mono mt-1 text-white/85">
                  <span className="text-[var(--accent)]">$</span> npx keyops rotate OPENAI_API_KEY --approve
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                <p className="mono text-[10px] text-white/40">output</p>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <p className="text-[var(--accent)]">ok&nbsp;&nbsp; create replacement</p>
                  <p className="text-[var(--accent)]">ok&nbsp;&nbsp; write .env.production</p>
                  <p className="text-[var(--accent)]">ok&nbsp;&nbsp; update Vercel production</p>
                  <p className="text-[var(--accent)]">ok&nbsp;&nbsp; verify new key (200)</p>
                  <p className="text-[var(--accent)]">ok&nbsp;&nbsp; revoke old key</p>
                  <p className="text-white/45">run_7f3a91 complete</p>
                </div>
              </div>
              <p className="text-[10px] text-white/30">
                npx works from GitHub today. npm publish is next.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="eyebrow">The transaction</div>
            <h2 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold">
              Six steps. One rollback path.
            </h2>
            <p className="mt-4 max-w-[420px] text-[15px] leading-7 text-[var(--muted)]">
              KeyOps does not revoke the old key until the new one has passed a real
              request. If anything fails before that point, the run restores the old
              key to every consumer.
            </p>
            <Link className="btn btn-ghost mt-6" href="/audit">
              Start with a free audit
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {transaction.map(([title, body], index) => (
              <div key={title} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] text-[var(--faint)]">0{index + 1}</span>
                  {index === 5 && (
                    <span className="rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--warning)]">
                      gated
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--bg-soft)]/60 py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="eyebrow">Free local audit</div>
              <h2 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold">
                Paste a config. See the keys.
              </h2>
              <p className="mt-4 max-w-[440px] text-[15px] leading-7 text-[var(--muted)]">
                The browser audit masks every value and never uploads your text.
                Use it for a quick check. Use the CLI for tracked files, ignored
                files, and connected platforms.
              </p>
              <Link className="btn btn-primary mt-6" href="/audit">
                Open the audit tool
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <div className="card p-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--card-solid)] p-4">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <span className="mono text-[10px] text-[var(--faint)]">sample.env</span>
                  <span className="pill text-[9px]">3 findings</span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["OpenAI project key", "sk-proj-ab...9f2a", "high"],
                    ["Anthropic API key", "sk-ant-api...77bd", "high"],
                    ["OpenRouter key", "sk-or-v1-...c410", "medium"],
                  ].map(([provider, key, severity]) => (
                    <div key={provider} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--bg-soft)] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium">{provider}</p>
                        <p className="mono truncate text-[10px] text-[var(--faint)]">{key}</p>
                      </div>
                      <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] text-[var(--muted)]">
                        {severity}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-[var(--faint)]">
                  Values are masked before render. Nothing is sent to a server.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Dashboard</div>
            <h2 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold">
              See what is old, unused, or expensive.
            </h2>
          </div>
          <Link className="btn btn-ghost" href="/dashboard">
            Open the demo
          </Link>
        </div>

        <div className="card mt-8 overflow-hidden p-2">
          <div className="rounded-[16px] border border-[var(--line)] bg-[var(--card-solid)] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent)] text-[10px] font-black text-[var(--accent-ink)]">
                  K
                </span>
                <div>
                  <p className="text-xs font-semibold">Acme AI</p>
                  <p className="text-[10px] text-[var(--faint)]">overview</p>
                </div>
              </div>
              <span className="pill text-[10px]">demo data</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["AI keys", "12", "5 providers"],
                ["Need rotation", "3", "older than 90d"],
                ["Spend", "$4,280", "+18% this month"],
                ["Exposed", "0", "last 30 days"],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] p-3">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--faint)]">{label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">{value}</p>
                  <p className="text-[10px] text-[var(--faint)]">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {[
                ["prod-main", "OpenAI", "12d", "active"],
                ["agent-worker", "OpenAI", "94d", "due"],
                ["claude-prod", "Anthropic", "31d", "active"],
                ["evals", "OpenRouter", "67d", "stale"],
              ].map(([name, provider, age, status]) => (
                <div key={name} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="truncate text-[11px]">{name}</span>
                    <span className="hidden text-[10px] text-[var(--faint)] sm:inline">{provider}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-[var(--muted)]">
                    <span className="mono">{age}</span>
                    <span className="capitalize">{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-[var(--line)] bg-[var(--bg-soft)]/60 py-20">
        <div className="container-page">
          <div className="mx-auto max-w-[640px] text-center">
            <div className="eyebrow justify-center">Pricing</div>
            <h2 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold">
              Start free. Pay for the rotation.
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
              The audit is free and local. The paid tier is for teams that want a
              hosted run history, approvals, and a second pair of eyes.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--faint)]">Open source</p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.05em]">$0</p>
              <p className="mt-1 text-xs text-[var(--faint)]">forever</p>
              <div className="mt-6 space-y-2.5 text-[12px] text-[var(--muted)]">
                {["Local CLI audit", "Manifest and plan", "Rollback escrow", "MIT license"].map((item) => (
                  <p key={item} className="flex items-start gap-2"><Check /> {item}</p>
                ))}
              </div>
              <Link className="btn btn-ghost mt-6 w-full" href="https://github.com/devtechedge/keyops" target="_blank" rel="noreferrer">
                View on GitHub
              </Link>
            </div>

            <div className="card relative border-[var(--accent)]/40 bg-[var(--accent-soft)] p-6">
              <span className="absolute right-4 top-4 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--accent-ink)]">
                Popular
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">Starter</p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
                $99<span className="text-sm font-normal text-[var(--faint)]">/mo</span>
              </p>
              <p className="mt-1 text-xs text-[var(--faint)]">for small AI teams</p>
              <div className="mt-6 space-y-2.5 text-[12px] text-[var(--muted)]">
                {["3 providers", "25 keys", "Hosted run history", "Weekly digest", "Assisted rotation"].map((item) => (
                  <p key={item} className="flex items-start gap-2"><Check /> {item}</p>
                ))}
              </div>
              <a className="btn btn-primary mt-6 w-full" href="mailto:devtechedge@gmail.com?subject=KeyOps%20Starter">
                Start with an audit
              </a>
            </div>

            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--faint)]">Team</p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
                $249<span className="text-sm font-normal text-[var(--faint)]">/mo</span>
              </p>
              <p className="mt-1 text-xs text-[var(--faint)]">for agencies and platform teams</p>
              <div className="mt-6 space-y-2.5 text-[12px] text-[var(--muted)]">
                {["10 providers", "100 keys", "Slack alerts", "Approval workflows", "Priority support"].map((item) => (
                  <p key={item} className="flex items-start gap-2"><Check /> {item}</p>
                ))}
              </div>
              <a className="btn btn-ghost mt-6 w-full" href="mailto:devtechedge@gmail.com?subject=KeyOps%20Team">
                Talk to Dev
              </a>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-[var(--faint)]">
            Need the rotation done for you? A fixed-price audit and first rotation is $1,500.
          </p>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="eyebrow">FAQ</div>
            <h2 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold">
              The honest answers.
            </h2>
            <p className="mt-4 max-w-[360px] text-[15px] leading-7 text-[var(--muted)]">
              KeyOps is deliberately narrow. It rotates what can be rotated and says
              so when a provider needs a human.
            </p>
          </div>
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                  {faq.question}
                  <span className="text-[var(--faint)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 max-w-[720px] text-[13px] leading-6 text-[var(--muted)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-8">
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--card-solid)] px-6 py-14 text-center sm:px-12">
          <div className="hero-glow opacity-70" />
          <div className="relative">
            <div className="eyebrow justify-center">Next step</div>
            <h2 className="display mx-auto mt-4 max-w-[760px] text-[clamp(2rem,4.5vw,4rem)] font-semibold">
              Find the key before someone else does.
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-7 text-[var(--muted)]">
              Run the free audit. If it finds something, you will know exactly where
              it is, what it can spend, and how to rotate it safely.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link className="btn btn-primary" href="/audit">
                Run free audit
              </Link>
              <a
                className="btn btn-ghost"
                href="mailto:devtechedge@gmail.com?subject=KeyOps%20rotation%20audit"
              >
                Book a rotation audit
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
