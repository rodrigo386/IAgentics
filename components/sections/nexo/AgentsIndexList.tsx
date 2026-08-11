"use client";

import { useState } from "react";
import Image from "next/image";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * The agent index with a live preview - the gallery-to-detail idea from the Skiper80
 * showcase, rebuilt for this page instead of installed.
 *
 * Why rebuilt: that component is licence-gated, ships hardcoded portfolio content with
 * no props, and pulls in a second animation library plus a second icon family. What was
 * worth taking is the interaction, not the code.
 *
 * THIS IS NOW THE ONLY PLACE THE PRODUCT SCREENS APPEAR. The plate sequence that used
 * to repeat them below the video was removed, which changes two things here:
 *
 *  1. The panel can no longer be desktop-only. It renders at every width - beside the
 *     list from lg up, stacked under it below that - or a phone would see no screens
 *     at all.
 *  2. Rows are BUTTONS, not links. There is no plate left to jump to, and a button is
 *     what makes the preview reachable by tap and by keyboard, not just by hover.
 *
 * The button is a stretched overlay rather than a wrapper, because a <button> may only
 * contain phrasing content - wrapping the <h3> in one would be invalid HTML, and giving
 * up the heading would flatten the page outline for the sake of a click target.
 *
 * Recession is done with COLOUR, not opacity: inactive names sit at --fg-muted (5.96:1
 * light, 5.87:1 dark), which still passes AA. Dimming five headings to 40% would not.
 */

export interface AgentIndexEntry {
  code: string;
  name: string;
  src: string | null;
  label: string;
}

export function AgentsIndexList({ agents }: { agents: AgentIndexEntry[] }) {
  // Open on the first agent that actually has a screen, so the panel never starts on
  // an "em breve" frame while a real one is sitting one row down.
  const firstFilled = agents.findIndex((agent) => agent.src);
  const [active, setActive] = useState(firstFilled === -1 ? 0 : firstFilled);
  const shown = agents[active];

  return (
    <div className="mt-16 grid grid-cols-1 gap-x-12 lg:grid-cols-12">
      <ul className="lg:col-span-7">
        {agents.map((agent, index) => {
          const isActive = index === active;
          const select = () => setActive(index);

          return (
            <li key={agent.code} className="relative border-t border-line-strong">
              <button
                type="button"
                aria-pressed={isActive}
                aria-label={`Ver a tela de ${agent.name}`}
                onClick={select}
                onPointerEnter={select}
                onFocus={select}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-text"
              />
              <div className="pointer-events-none flex items-baseline gap-4 py-7 lg:gap-6 lg:py-8">
                <span className="w-24 shrink-0 font-mono text-[11px] text-accent-text">
                  {agent.code}
                </span>
                <h3
                  className={`text-2xl font-medium tracking-[-0.03em] transition-colors motion-reduce:transition-none sm:text-3xl lg:text-4xl ${
                    isActive ? "text-fg" : "text-fg-muted"
                  }`}
                >
                  {agent.name}
                </h3>
              </div>
            </li>
          );
        })}
      </ul>

      {/* The preview. Sticky only from lg, where it sits beside the list; below that it
          is simply the next block down. */}
      <div className="mt-10 lg:col-span-5 lg:mt-0">
        <div className="lg:sticky lg:top-28">
          {/* 16/9 to match the captures exactly - a product screen is never cropped. */}
          <div className="relative aspect-[16/9] w-full overflow-hidden border border-line">
            {agents.map((agent, index) => (
              <div
                key={agent.code}
                aria-hidden={index !== active}
                className={`absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                  index === active ? "opacity-100" : "opacity-0"
                }`}
              >
                {agent.src ? (
                  <Image
                    src={agent.src}
                    alt={agent.label}
                    fill
                    sizes="(max-width: 1023px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <ComingSoon
                    label={agent.label}
                    compact
                    className="h-full w-full"
                  />
                )}
              </div>
            ))}
          </div>

          <p
            aria-live="polite"
            className="mt-3 flex flex-wrap items-baseline gap-3 font-mono text-[11px] text-fg-muted"
          >
            <span className="text-accent-text">{shown.code}</span>
            {shown.label}
          </p>
        </div>
      </div>
    </div>
  );
}
