import type { GameAction, RoomStateResponse } from "@/lib/game/types";

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function fetchRoomState(
  code: string,
  playerToken?: string
): Promise<RoomStateResponse> {
  const res = await fetch(`/api/rooms/${code}/state`, {
    headers: playerToken ? { "x-player-token": playerToken } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = new Error(await parseError(res)) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function sendAction(
  code: string,
  action: GameAction,
  playerToken?: string
): Promise<void> {
  const res = await fetch(`/api/rooms/${code}/action`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(playerToken ? { "x-player-token": playerToken } : {}),
    },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function fetchHostLine(
  code: string,
  moment: string,
  params?: { statementId?: string }
): Promise<{ text: string; audioUrl: string | null }> {
  const res = await fetch(`/api/rooms/${code}/host-line`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ moment, ...params }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchPreview(code: string, playerToken?: string) {
  const res = await fetch(`/api/rooms/${code}/preview`, {
    headers: playerToken ? { "x-player-token": playerToken } : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    index: number;
    total: number;
    text: string;
    answer: string;
    difficulty: string;
  }>;
}
