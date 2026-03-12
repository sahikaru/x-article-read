import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import * as schema from "../schema";

let sqlite: InstanceType<typeof Database>;
let db: ReturnType<typeof drizzle>;

beforeAll(() => {
  sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./drizzle" });
});

afterAll(() => {
  sqlite.close();
});

describe("categories", () => {
  it("inserts and retrieves a category", async () => {
    await db
      .insert(schema.categories)
      .values({ name: "Test Cat", color: "#ff0000", sortOrder: 0 });
    const rows = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.name, "Test Cat"));
    expect(rows).toHaveLength(1);
    expect(rows[0].color).toBe("#ff0000");
  });

  it("enforces unique name", async () => {
    await db
      .insert(schema.categories)
      .values({ name: "Unique Cat", color: "#00ff00", sortOrder: 1 });
    expect(() =>
      db
        .insert(schema.categories)
        .values({ name: "Unique Cat", color: "#0000ff", sortOrder: 2 })
        .run()
    ).toThrow();
  });
});

describe("follows", () => {
  it("inserts a follow", async () => {
    await db.insert(schema.follows).values({
      platform: "twitter",
      username: "testuser",
      displayName: "Test User",
    });
    const rows = await db
      .select()
      .from(schema.follows)
      .where(eq(schema.follows.username, "testuser"));
    expect(rows).toHaveLength(1);
    expect(rows[0].platform).toBe("twitter");
  });
});

describe("follow_categories (M2M)", () => {
  it("links follow to category", async () => {
    const [follow] = await db
      .insert(schema.follows)
      .values({
        platform: "twitter",
        username: "m2muser",
        displayName: "M2M User",
      })
      .returning();
    const [cat] = await db
      .insert(schema.categories)
      .values({ name: "M2M Cat", color: "#abcdef", sortOrder: 10 })
      .returning();

    await db
      .insert(schema.followCategories)
      .values({ followId: follow.id, categoryId: cat.id });

    const rows = await db
      .select()
      .from(schema.followCategories)
      .where(eq(schema.followCategories.followId, follow.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].categoryId).toBe(cat.id);
  });

  it("cascade deletes when follow is removed", async () => {
    const [follow] = await db
      .insert(schema.follows)
      .values({
        platform: "twitter",
        username: "cascade_user",
        displayName: "Cascade",
      })
      .returning();
    const cats = await db.select().from(schema.categories).limit(1);
    await db
      .insert(schema.followCategories)
      .values({ followId: follow.id, categoryId: cats[0].id });

    await db.delete(schema.follows).where(eq(schema.follows.id, follow.id));

    const rows = await db
      .select()
      .from(schema.followCategories)
      .where(eq(schema.followCategories.followId, follow.id));
    expect(rows).toHaveLength(0);
  });
});

describe("articles and article_tags", () => {
  it("inserts an article with tags", async () => {
    const [article] = await db
      .insert(schema.articles)
      .values({
        sourceId: "12345",
        platform: "twitter",
        contentType: "tweet",
        slug: "test-tweet-12345",
        title: "Test Tweet",
        authorUsername: "author",
        authorDisplayName: "Author",
        publishedAt: new Date().toISOString(),
        sourceUrl: "https://x.com/author/status/12345",
        originalContent: "Hello world",
      })
      .returning();

    await db
      .insert(schema.articleTags)
      .values([
        { articleId: article.id, tag: "defi" },
        { articleId: article.id, tag: "trading" },
      ]);

    const tags = await db
      .select()
      .from(schema.articleTags)
      .where(eq(schema.articleTags.articleId, article.id));
    expect(tags).toHaveLength(2);
  });

  it("cascade deletes tags when article is removed", async () => {
    const [article] = await db
      .insert(schema.articles)
      .values({
        sourceId: "99999",
        platform: "twitter",
        contentType: "tweet",
        slug: "cascade-tweet-99999",
        title: "Cascade Test",
        authorUsername: "author",
        authorDisplayName: "Author",
        publishedAt: new Date().toISOString(),
        sourceUrl: "https://x.com/author/status/99999",
        originalContent: "Cascade test",
      })
      .returning();

    await db
      .insert(schema.articleTags)
      .values({ articleId: article.id, tag: "test" });

    await db
      .delete(schema.articles)
      .where(eq(schema.articles.id, article.id));

    const tags = await db
      .select()
      .from(schema.articleTags)
      .where(eq(schema.articleTags.articleId, article.id));
    expect(tags).toHaveLength(0);
  });
});
