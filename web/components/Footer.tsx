import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line)]">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--muted)]">
              Rotate AI keys with a transaction, not a checklist. Built for small
              teams that cannot afford a broken deploy.
            </p>
            <div className="mt-5 flex items-center gap-3 text-xs text-[var(--faint)]">
              <span className="pill">MIT licensed</span>
              <span className="pill">Local-first</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
              Product
            </p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              <Link className="hover:text-[var(--ink)]" href="/audit">
                Free audit
              </Link>
              <Link className="hover:text-[var(--ink)]" href="/dashboard">
                Dashboard demo
              </Link>
              <Link className="hover:text-[var(--ink)]" href="/#pricing">
                Pricing
              </Link>
              <Link className="hover:text-[var(--ink)]" href="/#faq">
                FAQ
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
              Developers
            </p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              <a
                className="hover:text-[var(--ink)]"
                href="https://github.com/devtechedge/keyops"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                className="hover:text-[var(--ink)]"
                href="https://github.com/devtechedge/keyops#quick-start"
                target="_blank"
                rel="noreferrer"
              >
                Quick start
              </a>
              <a
                className="hover:text-[var(--ink)]"
                href="https://github.com/devtechedge/keyops/blob/main/SECURITY.md"
                target="_blank"
                rel="noreferrer"
              >
                Security model
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
              Contact
            </p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              <a
                className="hover:text-[var(--ink)]"
                href="mailto:devtechedge@gmail.com?subject=KeyOps%20rotation%20audit"
              >
                Book an audit
              </a>
              <a
                className="hover:text-[var(--ink)]"
                href="https://github.com/devtechedge/keyops/issues"
                target="_blank"
                rel="noreferrer"
              >
                Open an issue
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--line)] pt-6 text-xs text-[var(--faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} KeyOps. Built by Dev M.</p>
          <p className="mono">Rotate. Verify. Revoke. Or roll back.</p>
        </div>
      </div>
    </footer>
  );
}
