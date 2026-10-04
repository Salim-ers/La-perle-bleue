/**
 * Applique les migrations SQL de /drizzle sur la base Neon.
 *
 * - `npm run db:migrate` : à la main, avec DATABASE_URL dans l'environnement.
 * - `--deploy` (lancé par `npm run build`) : seulement pendant un build Vercel de
 *   production où DATABASE_URL est définie. Local et previews : rien n'est fait.
 *   Une migration en échec fait échouer le build : la version en ligne ne change pas.
 */
const deploy = process.argv.includes("--deploy");
const url = process.env.DATABASE_URL;

if (deploy && process.env.VERCEL_ENV !== "production") {
  console.log(`Migrations : ignorées (environnement ${process.env.VERCEL_ENV ?? "local"}).`);
  process.exit(0);
}
if (!url) {
  console.log("Migrations : DATABASE_URL absente, aucune base à mettre à jour.");
  process.exit(deploy ? 0 : 1);
}
if (url.startsWith("pglite:")) {
  console.log("Migrations : base locale PGlite, migrée automatiquement au démarrage du site.");
  process.exit(0);
}

const { neon } = await import("@neondatabase/serverless");
const { drizzle } = await import("drizzle-orm/neon-http");
const { migrate } = await import("drizzle-orm/neon-http/migrator");

const started = Date.now();
await migrate(drizzle(neon(url)), { migrationsFolder: "drizzle" });
console.log(`Migrations : base à jour (${Date.now() - started} ms).`);
