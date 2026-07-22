import Link from "next/link";
import { cn } from "@/lib/utils";

// Small hand-drawn "back" escape hatch for screens that would otherwise
// dead-end.
export function BackLink({
  href,
  label = "back",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-score inline-flex w-fit items-center gap-1.5 rounded-lg border-2 border-transparent px-2 py-1 text-xs uppercase tracking-[0.2em] opacity-60 transition hover:border-current hover:opacity-100",
        className
      )}
    >
      <svg viewBox="0 0 20 12" className="h-3 w-4" aria-hidden>
        <path
          d="M18 6 L3 6 M8 1 L2.5 6 L8 11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}
