import { describe, it, expect, beforeAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { appRouter } from "../router";
import { createCallerFactory } from "../init";
import type { TRPCContext } from "../init";

const createCaller = createCallerFactory(appRouter);

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      username TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_fetched_at TEXT
    );
    CREATE UNIQUE INDEX follows_platform_username ON follows(platform, username);
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE follow_categories (
      follow_id INTEGER NOT NULL REFERENCES follows(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (follow_id, category_id)
    );
    CREATE TABLE articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      author_username TEXT NOT NULL,
      author_display_name TEXT NOT NULL,
      published_at TEXT NOT NULL,
      source_url TEXT NOT NULL,
      original_content TEXT NOT NULL,
      mdx_content TEXT,
      interpretation TEXT,
      interpreted_at TEXT,
      summary TEXT,
      word_count INTEGER,
      content_preview TEXT,
      engagement TEXT,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX articles_platform_source ON articles(platform, source_id);
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE article_tags (
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      PRIMARY KEY (article_id, tag)
    );
  `);

  return drizzle(sqlite, { schema });
}

describe("tRPC router with real DB", () => {
  let caller: ReturnType<typeof createCaller>;

  beforeAll(() => {
    const db = createTestDb();
    caller = createCaller({ db } as TRPCContext);
  });

  // Follows
  it("follows.list returns empty array initially", async () => {
    const result = await caller.follows.list();
    expect(result).toEqual([]);
  });

  it("follows.create creates a follow", async () => {
    const result = await caller.follows.create({
      platform: "twitter",
      username: "testuser",
      displayName: "Test User",
    });
    expect(result.id).toBe(1);
    expect(result.username).toBe("testuser");
  });

  it("follows.getById returns the created follow", async () => {
    const result = await caller.follows.getById({ id: 1 });
    expect(result).not.toBeNull();
    expect(result!.username).toBe("testuser");
  });

  it("follows.update updates a follow", async () => {
    const result = await caller.follows.update({
      id: 1,
      displayName: "Updated User",
    });
    expect(result!.displayName).toBe("Updated User");
  });

  // Categories
  it("categories.create creates a category", async () => {
    const result = await caller.categories.create({
      name: "DeFi",
      color: "#3b82f6",
    });
    expect(result.id).toBe(1);
    expect(result.name).toBe("DeFi");
  });

  it("categories.list returns categories sorted by sortOrder", async () => {
    await caller.categories.create({
      name: "Trading",
      color: "#ef4444",
      sortOrder: 1,
    });
    const result = await caller.categories.list();
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("DeFi");
  });

  it("categories.delete removes a category", async () => {
    await caller.categories.delete({ id: 2 });
    const result = await caller.categories.list();
    expect(result.length).toBe(1);
  });

  // Articles
  it("articles.create creates an article with tags", async () => {
    const result = await caller.articles.create({
      sourceId: "tweet123",
      platform: "twitter",
      contentType: "tweet",
      slug: "test-tweet",
      title: "Test Tweet",
      authorUsername: "testuser",
      authorDisplayName: "Test User",
      publishedAt: "2026-01-01T00:00:00Z",
      sourceUrl: "https://x.com/testuser/status/123",
      originalContent: "This is a test tweet about DeFi and trading.",
      tags: ["DeFi", "trading"],
    });
    expect(result.id).toBe(1);
  });

  it("articles.getBySlug returns article with tags", async () => {
    const result = await caller.articles.getBySlug({ slug: "test-tweet" });
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Test Tweet");
    expect(result!.tags).toEqual(["DeFi", "trading"]);
  });

  it("articles.list returns articles with pagination", async () => {
    const result = await caller.articles.list({ limit: 10 });
    expect(result.items.length).toBe(1);
    expect(result.nextCursor).toBeUndefined();
  });

  it("articles.listByAuthor returns articles for a username", async () => {
    const result = await caller.articles.listByAuthor({ username: "testuser" });
    expect(result.length).toBe(1);
  });

  it("articles.listByTag returns articles with a tag", async () => {
    const result = await caller.articles.listByTag({ tag: "DeFi" });
    expect(result.length).toBe(1);
  });

  // Search
  it("search.search finds articles by content", async () => {
    const result = await caller.search.search({ query: "DeFi" });
    expect(result.results.length).toBeGreaterThanOrEqual(1);
  });

  it("search.search returns empty for non-matching query", async () => {
    const result = await caller.search.search({ query: "nonexistent" });
    expect(result.results.length).toBe(0);
  });

  // Interpretation
  it("interpretation.getStatus returns counts", async () => {
    const result = await caller.interpretation.getStatus();
    expect(result.total).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.interpreted).toBe(0);
  });

  // Cleanup
  it("follows.delete removes a follow", async () => {
    await caller.follows.delete({ id: 1 });
    const result = await caller.follows.list();
    expect(result.length).toBe(0);
  });

  it("articles.delete removes an article", async () => {
    await caller.articles.delete({ id: 1 });
    const result = await caller.articles.list();
    expect(result.items.length).toBe(0);
  });
});
