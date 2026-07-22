"use client";

// The physical game-show button: thick outline, hard shadow, depresses on tap.

import { cn } from "@/lib/utils";

export function RoughButton({
  children,
  className,
  color = "var(--mustard)",
  textColor = "var(--ink)",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: string;
  textColor?: string;
}) {
  return (
    <button
      {...props}
      className={cn(
        "btn-rough inline-flex items-center justify-center px-6 py-3 text-xl",
        className
      )}
      style={{ background: color, color: textColor, ...props.style }}
    >
      {children}
    </button>
  );
}
