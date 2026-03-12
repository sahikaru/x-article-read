import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";
import { initFts } from "../services/search";

const DB_PATH =
  process.env.DATABASE_URL || path.join(process.cwd(), "data", "tweets.db");

let _db: ReturnType<typeof createDb> | null = null;
let _sqlite: InstanceType<typeof Database> | null = null;

function createDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  _sqlite = sqlite;

  // Initialize FTS5 for full-text search
  try {
    initFts(sqlite);
  } catch {
    // FTS init may fail in test environments with in-memory DBs before migration
  }

  return drizzle(sqlite, { schema });
}

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export function getSqlite(): InstanceType<typeof Database> {
  if (!_sqlite) {
    getDb(); // ensure initialized
  }
  return _sqlite!;
}

export type Db = ReturnType<typeof getDb>;
