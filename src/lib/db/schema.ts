import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const follows = sqliteTable(
  "follows",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    platform: text("platform", { enum: ["twitter", "wechat"] }).notNull(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    addedAt: text("added_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    lastFetchedAt: text("last_fetched_at"),
  },
  (table) => [
    uniqueIndex("follows_platform_username").on(table.platform, table.username),
  ]
);

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const followCategories = sqliteTable(
  "follow_categories",
  {
    followId: integer("follow_id")
      .notNull()
      .references(() => follows.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.followId, table.categoryId] })]
);

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceId: text("source_id").notNull(),
    platform: text("platform", { enum: ["twitter", "wechat"] }).notNull(),
    contentType: text("content_type", {
      enum: ["tweet", "thread", "article"],
    }).notNull(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    authorUsername: text("author_username").notNull(),
    authorDisplayName: text("author_display_name").notNull(),
    publishedAt: text("published_at").notNull(),
    sourceUrl: text("source_url").notNull(),
    originalContent: text("original_content").notNull(),
    mdxContent: text("mdx_content"),
    interpretation: text("interpretation"),
    interpretedAt: text("interpreted_at"),
    summary: text("summary"),
    wordCount: integer("word_count"),
    contentPreview: text("content_preview"),
    engagement: text("engagement", { mode: "json" }),
    fetchedAt: text("fetched_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("articles_platform_source").on(table.platform, table.sourceId),
  ]
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const articleTags = sqliteTable(
  "article_tags",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.tag] })]
);
