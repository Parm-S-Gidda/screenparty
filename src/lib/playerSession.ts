// Player identity for anonymous players, kept in localStorage (per PRD §24:
// players use temporary session IDs, no accounts).

export type PlayerSession = {
  playerId: string;
  token: string;
  roomCode: string;
  username: string;
  avatarId: string;
};

const KEY = "screenparty.player";

export function savePlayerSession(session: PlayerSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadPlayerSession(roomCode?: string): PlayerSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as PlayerSession;
    if (roomCode && session.roomCode !== roomCode.toUpperCase()) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearPlayerSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
