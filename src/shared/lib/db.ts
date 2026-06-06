import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "./env";

// Single db client for the whole backend. Only repositories import this.
const sqlite = new Database(env.DATABASE_URL);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle({ client: sqlite });
export type DB = typeof db;
