import { Reveal } from "@/components/ui/Reveal";
import {
  AgentsIndexList,
  type AgentIndexEntry,
} from "@/components/sections/nexo/AgentsIndexList";
import { nexo, nexoPage } from "@/lib/content";

/**
 * "Entrega embarcada": the five agents as a contents index, with the platform they
 * run inside stated right under the claim.
 *
 * This replaced the pinned horizontal pan: a scroll hijack is agency language, and this
 * page is an editorial dossier. An index also lets all five be read at once, which a
 * pan never allows.
 *
 * The Desk Manager badge lives in the assurance band (Assurance.tsx) with the
 * security certifications — platform and proof are one story, told once.
 *
 * The code sits in the margin as a folio; the agent's real name is the heading, so the
 * label always carries the meaning.
 *
 * The list has two states, chosen by the data rather than by a flag:
 *  - No screens delivered yet -> the plain full-width index. This is exactly what has
 *    been on the page all along, and a hover preview of five reserved frames would be a
 *    worse page than no hover at all.
 *  - At least one `src` filled in lib/content.ts -> the index gains the preview panel
 *    (AgentsIndexList), which is now the only place the product screens appear at all.
 *    Nothing to switch on.
 */
export function NexoAgentsIndex() {
  // Each agent is matched to its screen by code, so neither list has to stay in order.
  const entries: AgentIndexEntry[] = nexo.agents.map((agent) => {
    const slot = nexoPage.gallery.slots.find((s) => s.agent === agent.code);
    return {
      code: agent.code,
      name: agent.name,
      src: slot?.src ?? null,
      label: slot?.label ?? agent.name,
    };
  });
  const hasScreens = entries.some((entry) => entry.src);

  return (
    <section className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {nexo.headline}
          </h2>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">
            {nexo.lead}
          </p>
        </Reveal>

        {hasScreens ? (
          <AgentsIndexList agents={entries} />
        ) : (
          <ul className="mt-16">
            {nexo.agents.map((agent) => (
              <Reveal key={agent.code}>
                <li className="grid grid-cols-1 items-baseline gap-2 border-t border-line-strong py-8 lg:grid-cols-12 lg:gap-8 lg:py-10">
                  <span className="font-mono text-[11px] text-accent-text lg:col-span-2">
                    {agent.code}
                  </span>
                  <h3 className="text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl lg:col-span-10 lg:text-5xl">
                    {agent.name}
                  </h3>
                </li>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
