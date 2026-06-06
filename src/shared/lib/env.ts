import { z } from "zod";

// Parse server config once, at the boundary — then trust the type everywhere.
// Backend-only: the SPA reads its own values from import.meta.env (VITE_*).
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  // SQLite file path consumed by better-sqlite3 / Drizzle.
  DATABASE_URL: z.string().min(1).default("./sqlite.db"),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
