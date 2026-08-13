import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { nexo, hero } from "@/lib/content";

/**
 * AGENT GRAPH - the hero's visual.
 *
 * The hub is the real Nexo APP ICON (from the client's own kit), and the five agents
 * hang off it. That states the product exactly as the team describes it: Nexo is the
 * procurement app, it runs inside Desk Manager, and the five agents live
 * inside Nexo. Nothing here is invented - the tile is copied verbatim from
 * nexo-app-icon-gradiente.svg, only rescaled into this coordinate space.
 *
 * Geometry lives in a 0-100 viewBox inside a square box, so the HTML labels can be
 * positioned with the same percentages as the SVG coordinates and stay in register at
 * every size. Node circles are filled with the page background so the connecting lines
 * are occluded inside them, exactly like the rings in the IAgentics lockup.
 *
 * Two things that are easy to get wrong here and are deliberate:
 *  - Positioning and animation are on SEPARATE elements. Both want `transform`, so a
 *    label that positions itself with translate(-50%) AND runs a fade-in keyframe will
 *    fight itself and jump. The outer div positions; the inner div animates.
 *  - Node coordinates are inset far enough that a 128px label never leaves the square,
 *    so nothing is clipped by the hero's overflow.
 *
 * Motion is CSS-only and runs in two acts. First the entry: lines draw outward from the
 * hub, then the agents pop in. Then the execution cycle - Nexo hands a task to one
 * agent, that agent lights while it works, the result travels back, and the turn passes.
 * One 7.5s lap covers all five; see the EXECUTION CYCLE block in globals.css for the
 * timing model. The whole loop is decoration in the strictest sense: resting state is
 * the finished graph, so it survives with no JS and goes static under reduced motion.
 *
 * Paint order matters here and is not alphabetical. Pulses are drawn BEFORE the hub tile
 * and before the node circles, both of which are opaque, so a pulse visibly emerges from
 * the Nexo icon and disappears into the agent instead of sliding over them.
 */

const CENTER = { x: 50, y: 50 };
const HUB_TILE = 26; // app-icon tile size in the 0-100 space

/**
 * Execution cycle timing. TURN * agents = the full lap declared in globals.css.
 *
 * CYCLE_START holds the loop back until the entry animation has finished drawing
 * (last node lands at 600 + 700ms, last label at 430 + 240 + 800ms). Without it the
 * first pulse would race down a line that is still being drawn.
 */
const TURN = 1.5;
const CYCLE_START = 1.6;
/** A returning result reaches the hub 19% into a lap - see @keyframes agent-pulse. */
const RETURN_AT = TURN * 5 * 0.19;

/** Order matches nexo.agents. `place` is where the label sits relative to the node. */
const NODES = [
  { x: 50, y: 14, place: "above" },
  { x: 22, y: 34, place: "above" },
  { x: 78, y: 34, place: "above" },
  { x: 30, y: 80, place: "below" },
  { x: 70, y: 80, place: "below" },
] as const;

/** Maps the official 64x64 app icon into the tile, centred on the hub. */
const NEXO_SCALE = HUB_TILE / 64;

export function AgentGraph() {
  const agents = nexo.agents;

  return (
    <div className="hero-graph mx-auto w-full max-w-[520px]">
      <div className="relative aspect-square w-full">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full text-accent-text"
          role="img"
          aria-label={`Nexo conectado aos agentes ${agents.map((a) => a.code).join(", ")}`}
        >
          <defs>
            <linearGradient id="nexo-hub" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7B5EED" />
              <stop offset="1" stopColor="#397CEF" />
            </linearGradient>
          </defs>

          {/* Lines first, so the node circles paint over their ends. */}
          {NODES.map((n, i) => (
            <line
              key={`l-${i}`}
              className="graph-line"
              x1={CENTER.x}
              y1={CENTER.y}
              x2={n.x}
              y2={n.y}
              pathLength={100}
              stroke="currentColor"
              strokeWidth={0.6}
              strokeOpacity={0.5}
              strokeLinecap="round"
              style={{ animationDelay: `${200 + i * 60}ms` }}
            />
          ))}

          {/* The task in flight. One dash per line, travelling out and back within the
              agent's own 20% of the cycle. Under the hub tile and the node circles. */}
          {NODES.map((n, i) => (
            <line
              key={`p-${i}`}
              className="agent-pulse"
              x1={CENTER.x}
              y1={CENTER.y}
              x2={n.x}
              y2={n.y}
              pathLength={100}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              style={{ animationDelay: `${CYCLE_START + i * TURN}s` }}
            />
          ))}

          {/* Nexo acknowledging a returned result. Starts just inside the tile edge so
              the ripple appears to come out from under the icon. */}
          <circle
            className="hub-ring"
            cx={CENTER.x}
            cy={CENTER.y}
            r={14}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.8}
            style={{ animationDelay: `${CYCLE_START + RETURN_AT}s` }}
          />

          {/* The hub: the real Nexo app icon, verbatim from nexo-app-icon-gradiente.svg.
              The tile is opaque, so the five connecting lines terminate behind it and
              no separate ring is needed. Outer group positions, inner group animates -
              `.graph-node` sets transform-box: fill-box, which would otherwise
              reinterpret a positioning transform and fling the tile out of place. */}
          <g
            transform={`translate(${CENTER.x} ${CENTER.y}) scale(${NEXO_SCALE}) translate(-32 -32)`}
          >
            <g className="graph-node" style={{ animationDelay: "120ms" }}>
              <rect width="64" height="64" rx="15" fill="url(#nexo-hub)" />
              {/* Geometry copied verbatim from the current kit file,
                  Logos/familia/tech/svg/tech-app-icon.svg ("tech" is the kit's old
                  name for Nexo). The open ring is a dashed full circle - 108 on,
                  30.2 off, rotated -58deg - not an arc path, so it is reproduced
                  exactly as authored rather than re-derived. */}
              <g transform="translate(32,32) scale(0.76) translate(-32,-32)">
                <circle
                  cx="32"
                  cy="32"
                  r="22"
                  stroke="#FFFFFF"
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="108 30.2"
                  transform="rotate(-58 32 32)"
                />
                <g
                  stroke="#FFFFFF"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  fill="none"
                >
                  <line x1="32" y1="35" x2="32" y2="24" />
                  <line x1="32" y1="35" x2="23" y2="41" />
                  <line x1="32" y1="35" x2="41" y2="41" />
                </g>
                <g fill="#FFFFFF">
                  <circle cx="32" cy="35" r="4.6" />
                  <circle cx="32" cy="23" r="3" />
                  <circle cx="22.2" cy="41.5" r="3" />
                  <circle cx="41.8" cy="41.5" r="3" />
                </g>
              </g>
            </g>
          </g>

          {/* The agent firing when the task lands - drawn under the node so the ring
              expands out from behind it. */}
          {NODES.map((n, i) => (
            <circle
              key={`g-${i}`}
              className="agent-ping"
              cx={n.x}
              cy={n.y}
              r={3.4}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.9}
              style={{ animationDelay: `${CYCLE_START + i * TURN}s` }}
            />
          ))}

          {/* The five agents. */}
          {NODES.map((n, i) => (
            <circle
              key={`n-${i}`}
              className="graph-node"
              cx={n.x}
              cy={n.y}
              r={3.4}
              fill="var(--bg)"
              stroke="currentColor"
              strokeWidth={1}
              style={{ animationDelay: `${360 + i * 60}ms` }}
            />
          ))}

          {/* The agent holding the task. Its own circle, not a restyled node: the node
              already owns a transform for its entry pop, and two animations fighting
              over one transform is the exact bug documented at the top of this file. */}
          {NODES.map((n, i) => (
            <circle
              key={`c-${i}`}
              className="agent-core"
              cx={n.x}
              cy={n.y}
              r={3.2}
              fill="currentColor"
              style={{ animationDelay: `${CYCLE_START + i * TURN}s` }}
            />
          ))}
        </svg>

        {/* Labels are HTML so they get real typography. Outer div positions,
            inner div animates - see the note above. */}
        {agents.map((agent, i) => {
          const n = NODES[i];
          return (
            <div
              key={agent.code}
              className="absolute"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform:
                  n.place === "above"
                    ? "translate(-50%, -150%)"
                    : "translate(-50%, 55%)",
              }}
            >
              <div
                className="hero-fade w-[128px] text-center"
                style={{ animationDelay: `${430 + i * 60}ms` }}
              >
                {/* Third level on purpose. hero-fade owns opacity and transform for the
                    entry; this one owns colour for the loop. Sharing an element would
                    mean two animations with different durations on one property. The
                    name inherits its colour so it lifts with the turn. */}
                <div
                  className="agent-label"
                  style={{ animationDelay: `${CYCLE_START + i * TURN}s` }}
                >
                  <span className="block font-mono text-[11px] text-accent-text">
                    {agent.code}
                  </span>
                  <span className="mt-0.5 hidden text-[13px] leading-snug lg:block">
                    {agent.name}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* The product name, under the square rather than inside it so it never crosses
          the connecting lines or the two bottom labels.

          Set in the display face at --fg, not in the accent: the hub tile directly above
          is already a violet-to-blue gradient, and a violet word under it would read as
          a second logo rather than a name.

          SIZE IS TIED TO THE H1, not to a fixed step. The headline is vw-clamped, so a
          flat text-3xl here was larger than the H1 on a phone (30px against 21.8px) -
          the product name outshouting the page's claim. These clamps mirror the H1's
          own formula at ~80% of it, so the ratio holds from 360px to 1440px. If the
          headline scale in Hero.tsx changes, change these with it.

          Uppercase is applied here, not stored in the copy, so screen readers still get
          "Nexo App". Tracking flips POSITIVE for it: the -0.03em used on the sentence-case
          headline is tuned for lowercase pairs and jams capitals together.

          IT IS A LINK, and it has to look like one. A word that happens to be clickable
          is a target nobody finds, so it carries the same arrow-slides-on-hover idiom as
          the page's CTAs and shifts to the accent colour. Only the name is wrapped, not
          the graph: the five agent labels sit inside that square, and turning them into
          link text would hand a screen reader one enormous link name instead of a
          picture with a caption. */}
      {/* inline-flex inside a centring wrapper, not a full-width block: as a block the
          anchor spanned the whole 520px square and turned a band of empty page into a
          silent click target. */}
      <div
        className="hero-fade mt-4 flex justify-center"
        style={{ animationDelay: "260ms" }}
      >
      <a
        href="/nexo"
        className="group inline-flex items-center gap-[0.35em] text-[min(4.5vw,1.5rem)] font-medium uppercase tracking-[0.02em] text-fg transition-colors duration-200 hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-text motion-reduce:transition-none sm:text-[min(4vw,2.1rem)] lg:text-[min(2.8vw,2.6rem)]"
      >
        {hero.product}
        <ArrowRight
          weight="regular"
          aria-hidden="true"
          className="size-[0.62em] shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
        />
      </a>
      </div>
    </div>
  );
}
