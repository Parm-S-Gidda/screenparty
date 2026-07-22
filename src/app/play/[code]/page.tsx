import { PlayerScreen } from "@/components/screens/PlayerScreen";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <PlayerScreen code={code.toUpperCase()} />;
}
