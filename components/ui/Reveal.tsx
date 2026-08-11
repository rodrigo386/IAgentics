import type { ReactNode } from "react";

/**
 * Scroll entry reveal.
 *
 * Motion motivation: content enters as it comes into view so the eye is led down the
 * section rather than meeting all of it at once. It plays once and never loops.
 *
 * Implemented with a CSS scroll-driven animation (see .reveal in globals.css) rather
 * than a JS observer, which keeps this a Server Component, ships no JavaScript, and -
 * most importantly - leaves the content VISIBLE when the animation cannot run.
 *
 * Items are staggered by their position on the page, not by scripted delays: the layout
 * already offsets columns vertically, so they enter in sequence naturally.
 */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`reveal ${className}`}>{children}</div>;
}
