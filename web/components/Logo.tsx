export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] border border-[var(--line)] bg-[var(--card-solid)]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 7a8 8 0 0 0-14.9-1M4 17a8 8 0 0 0 14.9 1"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M20 3v4h-4M4 21v-4h4"
            stroke="var(--ink)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.3" fill="var(--accent)" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.03em]">
        key<span className="text-[var(--muted)]">ops</span>
      </span>
    </span>
  );
}
