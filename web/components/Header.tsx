import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="KeyOps home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] text-[var(--muted)] md:flex">
          <Link className="transition-colors hover:text-[var(--ink)]" href="/#how">
            How it works
          </Link>
          <Link className="transition-colors hover:text-[var(--ink)]" href="/audit">
            Free audit
          </Link>
          <Link className="transition-colors hover:text-[var(--ink)]" href="/dashboard">
            Dashboard
          </Link>
          <Link className="transition-colors hover:text-[var(--ink)]" href="/#pricing">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link className="btn btn-primary btn-sm" href="/audit">
            Run free audit
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
