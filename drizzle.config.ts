import { defineConfig } from "drizzle-kit";

/** Migrations SQL générées dans /drizzle à partir de src/server/db/schema.ts. */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
});
