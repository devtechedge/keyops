import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--faint)]">404</p>
      <h1 className="display mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold">
        That page rotated away.
      </h1>
      <p className="mt-4 max-w-[420px] text-sm leading-6 text-[var(--muted)]">
        The link is wrong or the page moved. The audit and dashboard are still here.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link className="btn btn-primary" href="/">
          Back home
        </Link>
        <Link className="btn btn-ghost" href="/audit">
          Run free audit
        </Link>
      </div>
    </div>
  );
}
