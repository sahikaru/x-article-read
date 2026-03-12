import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { initFts, rebuildFtsIndex } from "../src/lib/services/search";

const OUTPUT_DIR = path.join(process.cwd(), "output", "articles");
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), "data", "tweets.db");

async function main() {
  // Ensure data dir exists
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // Run migrations
  migrate(db, { migrationsFolder: "./drizzle" });
  initFts(sqlite);

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log("No output/articles directory found. Nothing to migrate.");
    sqlite.close();
    return;
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".mdx"));
  console.log(`Found ${files.length} MDX files to migrate`);

  const authorsSet = new Set<string>();
  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    const slug = data.slug || file.replace(/\.mdx$/, "");

    // Check if already imported
    const existing = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.slug, slug));
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    // Parse author from frontmatter "Author Name (@username)" format
    const authorMatch = (data.author as string)?.match(
      /^(.+?)\s*\(@(\w+)\)$/
    );
    const authorDisplayName = authorMatch ? authorMatch[1].trim() : (data.author || "Unknown");
    const authorUsername = authorMatch ? authorMatch[2] : "unknown";

    // Parse engagement from content if available
    const engMatch = content.match(/(\d+)\s*likes\s*·\s*(\d+)\s*views/);
    const engagement = engMatch
      ? { likes: parseInt(engMatch[1]), retweets: 0, views: parseInt(engMatch[2]) }
      : null;

    // Split content at interpretation section
    const splitRe = /^---\s*\n+##\s+(Interpretation|解读)/m;
    const match = content.match(splitRe);
    let originalContent = content;
    let interpretation: string | null = null;
    if (match && match.index !== undefined) {
      originalContent = content.slice(0, match.index).trim();
      const interpSection = content.slice(match.index).replace(/^---\s*\n+/, "").trim();
      // Check if it has real interpretation (not just placeholder)
      if (interpSection.length > 0 && !interpSection.includes("待解读")) {
        interpretation = interpSection;
      }
    }

    // Extract source URL
    const sourceUrl = data.source || "";
    const sourceIdMatch = sourceUrl.match(/status\/(\d+)/);
    const sourceId = sourceIdMatch ? sourceIdMatch[1] : slug;

    const tags: string[] = data.tags || [];

    // Insert article
    const [article] = await db
      .insert(schema.articles)
      .values({
        sourceId,
        platform: "twitter" as const,
        contentType: "tweet" as const,
        slug,
        title: data.title || slug,
        authorUsername,
        authorDisplayName,
        publishedAt: data.date || new Date().toISOString(),
        sourceUrl,
        originalContent,
        mdxContent: content,
        interpretation,
        interpretedAt: interpretation ? new Date().toISOString() : null,
        wordCount: originalContent.split(/\s+/).length,
        engagement: engagement ? JSON.stringify(engagement) : null,
      })
      .returning();

    // Insert tags
    if (tags.length > 0) {
      await db
        .insert(schema.articleTags)
        .values(tags.map((tag) => ({ articleId: article.id, tag })))
        .onConflictDoNothing();
    }

    authorsSet.add(authorUsername);
    imported++;
  }

  // Create follow entries for unique authors
  for (const username of authorsSet) {
    const existing = await db
      .select()
      .from(schema.follows)
      .where(eq(schema.follows.username, username));
    if (existing.length === 0) {
      await db.insert(schema.follows).values({
        platform: "twitter",
        username,
        displayName: username,
      });
    }
  }

  // Rebuild FTS index
  rebuildFtsIndex(sqlite);

  console.log(`Migration complete: ${imported} imported, ${skipped} skipped`);
  console.log(`Created ${authorsSet.size} follow entries`);

  sqlite.close();
}

main().catch(console.error);
