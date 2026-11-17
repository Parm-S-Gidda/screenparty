"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="link-label focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
      style={{ color: "var(--cream-muted)" }}
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
