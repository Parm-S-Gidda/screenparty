import { Mascot, type MascotExpression } from "@/components/cartoon/Mascot";
import { cn } from "@/lib/utils";

// Renders the player's cartoon mascot. Kept as AvatarBadge so every game view
// (trivia, TTAL, WYR, lobby, phone) upgrades without touching call sites.
export function AvatarBadge({
  avatarId,
  size = "md",
  expression = "idle",
  className,
}: {
  avatarId: string;
  size?: "sm" | "md" | "lg" | "xl";
  expression?: MascotExpression;
  className?: string;
}) {
  const sizes = { sm: 34, md: 52, lg: 76, xl: 120 };
  return (
    <Mascot
      avatarId={avatarId}
      expression={expression}
      size={sizes[size]}
      animate={size !== "sm"}
      className={cn(className)}
    />
  );
}
