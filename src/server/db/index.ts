/**
 * Connexion à la base.
 * - Production / preview : Neon (driver HTTP, adapté aux fonctions serverless Vercel).
 * - Développement local sans compte Neon : DATABASE_URL="pglite:./.data/pglite"
 *   lance un Postgres embarqué (PGlite) et applique les migrations au démarrage.
 *   Refusé en production.
 */
import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL n'est pas définie : base de données non configurée.");
  }
}

// Singleton partagé par toutes les copies du module dans le processus (Next peut en charger plusieurs) :
// indispensable pour PGlite, qui ne supporte qu'une instance par dossier.
const globalForDb = globalThis as unknown as { __lpbDb?: Promise<Database> | null };

export function getDb(): Promise<Database> {
  if (!globalForDb.__lpbDb) {
    globalForDb.__lpbDb = connect().catch((error) => {
      globalForDb.__lpbDb = null;
      throw error;
    });
  }
  return globalForDb.__lpbDb;
}

export const isDatabaseConfigured = () => !!process.env.DATABASE_URL;

async function connect(): Promise<Database> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();

  if (url.startsWith("pglite:")) {
    if (process.env.VERCEL_ENV === "production") throw new Error("PGlite est réservé au développement local.");
    // Modules chargés à l'exécution seulement (jamais embarqués dans le build de production).
    const load = (name: string) => import(/* webpackIgnore: true */ name);
    const { PGlite } = await load("@electric-sql/pglite");
    const { drizzle: drizzlePglite } = await load("drizzle-orm/pglite");
    const { migrate } = await load("drizzle-orm/pglite/migrator");
    const dir = url.slice("pglite:".length);
    const dataDir = dir ? path.resolve(process.cwd(), dir) : undefined;
    if (dataDir) mkdirSync(dataDir, { recursive: true });
    const client = new PGlite(dataDir);
    const db = drizzlePglite(client, { schema });
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    return db as Database;
  }

  return drizzle(neon(url), { schema }) as unknown as Database;
}

export { schema };
