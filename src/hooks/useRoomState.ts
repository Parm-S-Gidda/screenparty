"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchRoomState } from "@/lib/gameClient";
import type { RoomStateResponse } from "@/lib/game/types";

// Realtime events act as invalidation signals: on any change to this room's
// rows we refetch the consolidated state from the server, so clients always
// render official state (PRD §21: clients only display state).
export function useRoomState(code: string, playerToken?: string) {
  const [state, setState] = useState<RoomStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false); // 404/410: room missing or expired
  const inflight = useRef(false);
  const queued = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) {
      queued.current = true;
      return;
    }
    inflight.current = true;
    try {
      const next = await fetchRoomState(code, playerToken);
      setState(next);
      setError(null);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 404 || status === 410) setGone(true);
      setError((err as Error).message);
    } finally {
      inflight.current = false;
      if (queued.current) {
        queued.current = false;
        void refresh();
      }
    }
  }, [code, playerToken]);

  const roomId = state?.room.id;
  const sessionId = state?.session?.id;

  useEffect(() => {
    void refresh();
    // polling fallback for missed realtime messages (and before IDs are known)
    const poll = setInterval(() => void refresh(), 5000);
    return () => clearInterval(poll);
  }, [refresh]);

  useEffect(() => {
    if (!roomId || !sessionId) return;
    const supabase = createClient();
    const onChange = () => void refresh();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        onChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        onChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions", filter: `room_id=eq.${roomId}` },
        onChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores", filter: `session_id=eq.${sessionId}` },
        onChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "buzzes", filter: `session_id=eq.${sessionId}` },
        onChange
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, sessionId, refresh]);

  return { state, error, gone, refresh };
}
