import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MainScreen } from "@/components/screens/MainScreen";

export default async function ScreenPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOwner = false;
  if (user) {
    const admin = createAdminClient();
    const { data: room } = await admin
      .from("rooms")
      .select("host_user_id")
      .eq("room_code", code.toUpperCase())
      .in("status", ["lobby", "in_game", "ended"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    isOwner = room?.host_user_id === user.id;
  }

  return <MainScreen code={code.toUpperCase()} isOwner={isOwner} />;
}
