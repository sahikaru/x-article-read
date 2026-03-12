import Database from "better-sqlite3";
import { articles } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Db } from "../db";

/**
 * Initialize FTS5 virtual table for full-text search.
 * Call once after DB is created/migrated.
 */
export function initFts(sqliteDb: InstanceType<typeof Database>) {
  sqliteDb.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
      title,
      original_content,
      interpretation,
      content='articles',
      content_rowid='id'
    );
  `);

  // Triggers to keep FTS in sync
  sqliteDb.exec(`
    CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
      INSERT INTO articles_fts(rowid, title, original_content, interpretation)
      VALUES (new.id, new.title, new.original_content, new.interpretation);
    END;
  `);

  sqliteDb.exec(`
    CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid, title, original_content, interpretation)
      VALUES ('delete', old.id, old.title, old.original_content, old.interpretation);
    END;
  `);

  sqliteDb.exec(`
    CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid, title, original_content, interpretation)
      VALUES ('delete', old.id, old.title, old.original_content, old.interpretation);
      INSERT INTO articles_fts(rowid, title, original_content, interpretation)
      VALUES (new.id, new.title, new.original_content, new.interpretation);
    END;
  `);
}

/**
 * Rebuild FTS index from existing articles data.
 */
export function rebuildFtsIndex(sqliteDb: InstanceType<typeof Database>) {
  sqliteDb.exec(`
    INSERT INTO articles_fts(articles_fts) VALUES ('rebuild');
  `);
}

export interface SearchResult {
  id: number;
  slug: string;
  title: string;
  authorUsername: string;
  authorDisplayName: string;
  publishedAt: string;
  snippet: string;
  platform: string;
  interpretation: string | null;
}

export function createSearchService(
  db: Db,
  sqliteDb: InstanceType<typeof Database>
) {
  return {
    search(query: string, limit = 20): SearchResult[] {
      const stmt = sqliteDb.prepare(`
        SELECT
          a.id,
          a.slug,
          a.title,
          a.author_username as authorUsername,
          a.author_display_name as authorDisplayName,
          a.published_at as publishedAt,
          a.platform,
          a.interpretation,
          snippet(articles_fts, 1, '<mark>', '</mark>', '...', 40) as snippet
        FROM articles_fts
        JOIN articles a ON a.id = articles_fts.rowid
        WHERE articles_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `);

      return stmt.all(query, limit) as SearchResult[];
    },
  };
}
