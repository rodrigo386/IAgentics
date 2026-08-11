import { Reveal } from "@/components/ui/Reveal";
import { nexoPage } from "@/lib/content";

/**
 * Why Nexo, set with hanging headings.
 *
 * Each entry puts its title in the left margin and the body in the measure beside it,
 * the way a dossier annotates. No boxes: the plates own the frames on this page.
 */
export function NexoDifferentiators() {
  return (
    <section className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {nexoPage.differentiators.title}
          </h2>
        </Reveal>

        <div className="mt-16">
          {nexoPage.differentiators.items.map((item) => (
            <Reveal key={item.title}>
              <div className="grid grid-cols-1 gap-3 border-t border-line-strong py-10 lg:grid-cols-12 lg:gap-8 lg:py-12">
                <h3 className="text-2xl font-medium tracking-[-0.02em] text-fg lg:col-span-5 lg:text-3xl">
                  {item.title}
                </h3>
                <p className="max-w-[52ch] text-lg leading-relaxed text-fg-muted lg:col-span-6 lg:col-start-7">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
