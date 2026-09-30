import { Beef, Flame, Salad, Soup } from "lucide-react";

/** Uniquement des éléments visibles ou affichés par le restaurant (carte, photos). */
const items = [
  {
    icon: Flame,
    title: "Le grill",
    text: "Steaks, kefta, adana, brochettes d'agneau et de poulet, entrecôte.",
  },
  {
    icon: Beef,
    title: "La broche",
    text: "Le kebab, en sandwich, en tacos, en panini ou en assiette.",
  },
  {
    icon: Salad,
    title: "Les crudités",
    text: "Salade, tomates, oignons, chou rouge : en vitrine, sous vos yeux.",
  },
  {
    icon: Soup,
    title: "La sauce fromagère maison",
    text: "Elle garnit tous nos tacos, avec les frites.",
  },
];

export function SavoirFaire() {
  return (
    <section aria-labelledby="soin-title" className="grain bg-night-2 py-20 lg:py-28">
      <div className="container-x">
        <h2 id="soin-title" className="display max-w-[14ch] text-[clamp(2.8rem,6vw,4.6rem)] text-white">
          Préparé avec soin.
        </h2>
        <ul className="mt-12 grid gap-y-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
          {items.map(({ icon: Icon, title, text }) => (
            <li key={title} className="lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <span className="grid size-14 place-items-center rounded-full border-2 border-nazar/60 text-sand">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="display mt-6 text-3xl text-white">{title}</h3>
              <p className="mt-3 max-w-[30ch] text-[16px] leading-relaxed text-fog">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
