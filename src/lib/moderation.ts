import { LIMITS } from "./constants";

const BLOCKED_SUBSTRINGS = [
  "fuck", "shit", "bitch", "cunt", "nigg", "fag", "slut", "whore",
  "cock", "dick", "pussy", "rape", "nazi", "hitler",
];

export function containsBlockedWord(text: string): boolean {
  const lowered = text.toLowerCase().replace(/[^a-z]/g, "");
  return BLOCKED_SUBSTRINGS.some((w) => lowered.includes(w));
}

export function validateUsername(raw: string): { ok: true; username: string } | { ok: false; error: string } {
  const username = raw.trim().replace(/\s+/g, " ");
  if (username.length < 1) return { ok: false, error: "Enter a name" };
  if (username.length > LIMITS.usernameMaxLength)
    return { ok: false, error: `Name must be ${LIMITS.usernameMaxLength} characters or fewer` };
  if (!/^[\p{L}\p{N} _.\-']+$/u.test(username))
    return { ok: false, error: "Name can only use letters, numbers, and spaces" };
  if (containsBlockedWord(username))
    return { ok: false, error: "Pick a friendlier name" };
  return { ok: true, username };
}
