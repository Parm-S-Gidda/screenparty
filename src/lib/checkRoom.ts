// Client-side room code validation against the public state endpoint, so we
// can reject bad codes before sending someone to the character screen.
// (The join API still re-validates everything server-side.)

export type RoomCheck = { ok: true; code: string } | { ok: false; error: string };

export async function checkRoomCode(rawCode: string): Promise<RoomCheck> {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 4) return { ok: false, error: "That code looks too short!" };

  try {
    const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/state`, { cache: "no-store" });
    if (res.status === 404) return { ok: false, error: "No room with that code, double-check it!" };
    if (res.status === 410) return { ok: false, error: "That room has expired." };
    if (!res.ok) return { ok: false, error: "Couldn't check that code, try again." };

    const body = await res.json();
    if (body.room?.status === "ended" || body.session?.state === "GAME_OVER")
      return { ok: false, error: "That game already finished!" };
    if (body.session && body.session.state !== "LOBBY")
      return { ok: false, error: "That game already started, ask for a new room." };
    return { ok: true, code };
  } catch {
    return { ok: false, error: "Couldn't check that code, are you online?" };
  }
}
