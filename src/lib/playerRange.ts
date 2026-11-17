// Room player cap: the host picks a number between the game's minimum and
// their plan's maximum. Shared by the setup slider and the create-room API.

export function playerRange(gameMin: number, planMax: number) {
  const min = Math.max(1, Math.min(gameMin, planMax));
  return { min, max: Math.max(min, planMax) };
}

/** Clamp a requested cap into range; anything unusable falls back to the plan max. */
export function clampMaxPlayers(requested: unknown, gameMin: number, planMax: number) {
  const { min, max } = playerRange(gameMin, planMax);
  const n = Math.round(Number(requested));
  if (!Number.isFinite(n) || n <= 0) return max;
  return Math.min(Math.max(n, min), max);
}
