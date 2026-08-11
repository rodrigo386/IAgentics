import Image from "next/image";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { ImageMagnifier } from "@/components/ui/originkit/ImageMagnifier";
import { ComingSoon } from "@/components/ui/ComingSoon";

export interface MediaSlotSpec {
  kind: "image" | "video";
  label: string;
  /** Human-readable spec shown while the slot is empty, e.g. "1920x1080 · JPG". */
  spec: string;
  /** Where the asset should be dropped, e.g. "/nexo-print-rc.jpg". */
  file: string;
  poster?: string;
  /** Fill this in lib/content.ts to publish the real asset. */
  src?: string | null;
  /** Product screenshots get a magnifier; set false for anything not worth inspecting. */
  magnify?: boolean;
}

/**
 * A media slot that is honest about being empty.
 *
 * While `src` is null it renders a RESERVED frame that states exactly what belongs
 * there and under which filename, so the space is designed rather than broken. The
 * moment `src` is filled in lib/content.ts it renders the real image or video and no
 * component has to change.
 *
 * The reserved state is deliberately not a grey box with a spinner: a placeholder that
 * pretends to be loading reads as a bug. This one reads as a brief.
 */
export function MediaSlot({
  slot,
  aspect = "aspect-[16/9]",
  priority = false,
}: {
  slot: MediaSlotSpec;
  aspect?: string;
  priority?: boolean;
}) {
  const frame = `relative w-full overflow-hidden border border-line ${aspect}`;

  if (slot.src) {
    if (slot.kind === "video") {
      return (
        <div className={frame}>
          <AutoplayVideo
            className="absolute inset-0 h-full w-full object-cover"
            src={slot.src}
            poster={slot.poster}
            label={slot.label}
          />
        </div>
      );
    }

    // Screenshots are dense, so they are inspectable rather than merely displayed.
    // The magnifier falls back to a plain image on touch and before hydration.
    //
    // NO PARALLAX HERE, and that is the point. The drift used to live on this branch,
    // and it needed an oversized layer (112% tall) to travel without exposing an edge.
    // That made the media box 1.589 wide-to-tall inside a 1.778 frame, so cover-scaling
    // a 16/9 screenshot into it cut 171px - 10.6% - off the right edge. Measured, not
    // guessed. The defect was invisible while every slot was empty and appeared the
    // moment a real capture arrived. A plate exists to show a product screen whole;
    // depth is not worth a tenth of the evidence.
    if (slot.magnify !== false) {
      return (
        <div className={frame}>
          <ImageMagnifier src={slot.src} alt={slot.label} />
        </div>
      );
    }

    return (
      <div className={frame}>
        <Image
          src={slot.src}
          alt={slot.label}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 1400px"
          className="object-cover"
        />
      </div>
    );
  }

  // Nem `spec` nem `file` chegam à tela: são briefing do time e viviam expostos ao
  // visitante. Continuam em lib/content.ts, que é onde o time os lê.
  return <ComingSoon label={slot.label} className={frame} />;
}
