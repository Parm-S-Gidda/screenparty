import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TestMultiView } from "./TestMultiView";

export default async function DevTestPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const admin = createAdminClient();
  const { data: packs } = await admin
    .from("question_packs")
    .select("id, title")
    .order("title");
  return <TestMultiView defaultPackId={packs?.[0]?.id ?? ""} />;
}
