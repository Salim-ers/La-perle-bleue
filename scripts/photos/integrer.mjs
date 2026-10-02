// Intègre les photos de photos-generees/ : recadrage 4:5 + 1:1, WebP dans
// src/assets/images/produits/, et régénère src/data/product-photos.ts.
// Usage : node scripts/photos/integrer.mjs   (puis ajouter imageKey: "<id>-carre" au produit dans src/data/menu.ts)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const PROJECT = fileURLToPath(new URL("../..", import.meta.url));
const require = createRequire(path.join(PROJECT, "package.json"));
const sharp = require("sharp");
const SRC = path.join(PROJECT, "photos-generees");
const OUT = path.join(PROJECT, "src/assets/images/produits");
const { jobs } = JSON.parse(fs.readFileSync(new URL("./plats.json", import.meta.url), "utf8"));
fs.mkdirSync(OUT, { recursive: true });

const ids = fs.readdirSync(SRC).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4)).sort();
const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const alt = (id) => {
  if (jobs[id].alt) return jobs[id].alt;
  const d = jobs[id].dish.replace(/, enveloppé de papier kraft/, "").replace(/\s*\([^)]*\)/g, "");
  return d.charAt(0).toUpperCase() + d.slice(1);
};

for (const id of ids) {
  const file = path.join(SRC, id + ".png");
  const { width, height } = await sharp(file).metadata();
  const portraitH = Math.round((width * 5) / 4);
  await sharp(file)
    .extract({ left: 0, top: Math.round((height - portraitH) / 2), width, height: portraitH })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, id + ".webp"));
  await sharp(file)
    .extract({ left: 0, top: Math.round((height - width) / 2), width, height: width })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, id + "-carre.webp"));
}

const imports = ids
  .flatMap((id) => [
    `import ${camel(id)} from "@/assets/images/produits/${id}.webp";`,
    `import ${camel(id)}Carre from "@/assets/images/produits/${id}-carre.webp";`,
  ])
  .join("\n");
const entries = ids
  .flatMap((id) => [
    `  "${id}": { src: ${camel(id)}, alt: ${JSON.stringify(alt(id))} },`,
    `  "${id}-carre": { src: ${camel(id)}Carre, alt: ${JSON.stringify(alt(id))} },`,
  ])
  .join("\n");

fs.writeFileSync(
  path.join(PROJECT, "src/data/product-photos.ts"),
  `/**
 * Photos des plats sans photo réelle, générées par IA (OpenAI, gpt-image-2)
 * à partir des vraies photos du restaurant prises comme référence de style.
 * Fichier généré : à remplacer par de vraies photos dès que possible
 * (même nom de fichier dans src/assets/images/produits/).
 * Clés : "<id produit>" (4:5, cartes) et "<id produit>-carre" (1:1, miniatures).
 */
${imports}
import type { SiteImage } from "./images";

export const productPhotos = {
${entries}
} satisfies Record<string, SiteImage>;
`,
);
console.log(ids.length, "photos intégrées :", ids.join(", "));
