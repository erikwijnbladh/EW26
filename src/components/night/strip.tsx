import Image from "next/image";
import { elsewhere } from "@/lib/data";

/**
 * The photographs, as a row you scroll sideways. It runs off the right edge
 * on purpose, so it's obvious there's more than fits.
 */
export function Strip() {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2">
      {elsewhere.map((photo, i) => (
        <figure
          key={photo.src}
          className="group w-[62%] shrink-0 snap-start sm:w-[44%]"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_var(--line)]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 62vw, 300px"
              placeholder="blur"
              blurDataURL={photo.blur}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white/80 backdrop-blur-sm">
              {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <figcaption className="mt-3 text-sm text-foreground">{photo.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
