import Image from "next/image";
import { images, type ImageKey } from "@/data/images";
import { cn } from "@/lib/utils";

/**
 * La perle nazar : anneaux sable / bleu clair / blanc autour d'une photo ronde.
 * Version statique (le hero en a une version animée).
 */
export function Perle({
  image,
  className,
  sizes,
  priority,
}: {
  image: ImageKey;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  const img = images[image];
  return (
    <div className={cn("relative aspect-square rounded-full p-[3%] ring-1 ring-sand/45", className)}>
      <div className="rounded-full bg-nazar p-[3.4%]">
        <div className="rounded-full bg-white p-[2.4%]">
          <div className="relative aspect-square overflow-hidden rounded-full bg-night-2">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={sizes}
              priority={priority}
              placeholder="blur"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
