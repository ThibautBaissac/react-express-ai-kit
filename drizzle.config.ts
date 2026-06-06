import { defineConfig } from "drizzle-kit";

// drizzle-kit runs this config standalone, so it reads process.env directly
// (with the same default as src/shared/lib/env.ts) rather than importing it.
// Table definitions live per feature in <feature>.table.ts (kept separate from
// the zod contract in <feature>.schema.ts).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/features/**/*.table.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "./sqlite.db",
  },
});
