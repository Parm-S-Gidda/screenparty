import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinFlow } from "@/components/JoinFlow";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function JoinPage() {
  return (
    <Suspense>
      <JoinFlow />
    </Suspense>
  );
}
