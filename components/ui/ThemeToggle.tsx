"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "@phosphor-icons/react";

/**
 * The page locks to ONE theme at a time. The default follows the system preference
 * (resolved before paint by the inline script in layout.tsx); this control lets the
 * user override it and remembers the choice.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("iagentics-theme", next ? "dark" : "light");
    } catch {
      // Storage can be unavailable in private modes; the toggle still works for the session.
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
      className="grid size-10 shrink-0 place-items-center rounded-control border border-line text-fg-muted transition-colors duration-200 hover:border-line-strong hover:text-fg active:scale-[0.96]"
    >
      {/* Renders nothing until the client knows the theme, which avoids a hydration mismatch. */}
      {dark === null ? null : dark ? (
        <Sun size={18} weight="regular" />
      ) : (
        <Moon size={18} weight="regular" />
      )}
    </button>
  );
}
