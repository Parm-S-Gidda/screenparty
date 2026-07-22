"use client";

import { useEffect } from "react";
import { playSfx, preloadSfx } from "@/lib/sfx";

// Global UI sounds via event delegation: a soft blip when hovering elements
// marked data-sfx-hover (game cards, avatar tiles) and a click for every
// other button-like element. Renders nothing.
export function UiSounds() {
  useEffect(() => {
    preloadSfx("hover");
    preloadSfx("click");

    const onPointerOver = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return; // no hover on touch
      const target = e.target as Element | null;
      const hit = target?.closest("[data-sfx-hover]");
      if (!hit) return;
      // only on entering the element, not when moving between its children
      if (e.relatedTarget instanceof Node && hit.contains(e.relatedTarget)) return;
      playSfx("hover");
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const button = target?.closest("button, [role='button'], a.btn-rough");
      // hover-marked elements (avatars, game cards) have their own moment -
      // the generic click is for everything else
      if (!button || button.closest("[data-sfx-hover]")) return;
      if ((button as HTMLButtonElement).disabled) return;
      playSfx("click");
    };

    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerover", onPointerOver, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
