// Génère des photos de plats avec l'API OpenAI Images, en donnant les vraies
// photos du restaurant comme référence de style.
// Usage : node scripts/photos/generer.mjs scripts/photos/plats.json <id> [<id>...]
// Clé lue dans .env.local (OPENAI_API_KEY=...), jamais commitée. Résultat : photos-generees/<id>.png
// Ensuite : node scripts/photos/integrer.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const PROJECT = fileURLToPath(new URL("../..", import.meta.url));
const require = createRequire(path.join(PROJECT, "package.json"));
const sharp = require("sharp");
const key = fs.readFileSync(path.join(PROJECT, ".env.local"), "utf8").match(/OPENAI_API_KEY=(.+)/)[1].trim();
const [, , jobsFile, ...ids] = process.argv;
const { styles, jobs, model = "gpt-image-2", quality = "high" } = JSON.parse(fs.readFileSync(jobsFile, "utf8"));
const OUT = path.join(PROJECT, "photos-generees");
fs.mkdirSync(OUT, { recursive: true });

async function run(id) {
  const job = jobs[id];
  if (!job) throw new Error("job inconnu " + id);
  const style = styles[job.style];
  const prompt = `${style.text}\n\nLes images jointes sont des photos réelles du restaurant : reproduis exactement leur style (vaisselle, support, lumière, angle, cadrage, façon de dresser les accompagnements). N'en copie pas la viande ni la garniture.\n\nPlat à photographier : ${job.dish}.`;
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", "1024x1536");
  form.append("quality", quality);
  for (const ref of style.refs) {
    const png = await sharp(path.join(PROJECT, "src/assets/images", ref)).png().toBuffer();
    form.append("image[]", new Blob([png], { type: "image/png" }), ref.replace(".webp", ".png"));
  }
  const t = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: "Bearer " + key },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status} ${JSON.stringify(json.error)}`);
  const file = path.join(OUT, id + ".png");
  fs.writeFileSync(file, Buffer.from(json.data[0].b64_json, "base64"));
  console.log(`${id} OK en ${Math.round((Date.now() - t) / 1000)} s`, json.usage ? JSON.stringify(json.usage) : "");
}

// Lots de 5 en parallèle, 2 nouvelles tentatives en cas d'erreur temporaire.
async function withRetry(id) {
  for (let attempt = 1; ; attempt++) {
    try { return await run(id); }
    catch (e) {
      if (attempt >= 3) throw e;
      console.log(`${id} : nouvel essai (${e.message.slice(0, 120)})`);
      await new Promise((r) => setTimeout(r, 15000 * attempt));
    }
  }
}
const queue = [...ids];
const failed = [];
await Promise.all(Array.from({ length: 5 }, async () => {
  while (queue.length) {
    const id = queue.shift();
    try { await withRetry(id); } catch (e) { failed.push(id); console.error("ERREUR", e.message); }
  }
}));
console.log(failed.length ? "ÉCHECS : " + failed.join(" ") : "TOUT EST GÉNÉRÉ");
