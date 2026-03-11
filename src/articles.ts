import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Article, ArticleMeta } from './types.js';

/**
 * Get all existing article slugs in the output directory.
 */
export function getExistingSlugs(outputDir: string): Set<string> {
  if (!fs.existsSync(outputDir)) return new Set();
  return new Set(
    fs.readdirSync(outputDir)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.replace(/\.mdx$/, ''))
  );
}

/**
 * Read and parse a single article by slug.
 */
export function getArticleBySlug(outputDir: string, slug: string): Article | null {
  const filePath = path.join(outputDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  // Split content into original and interpretation at "## 解读" or "## Interpretation"
  const splitRe = /^---\s*\n+##\s+(Interpretation|解读)/m;
  const match = content.match(splitRe);
  let original = content;
  let interpretation = '';
  if (match && match.index !== undefined) {
    original = content.slice(0, match.index).trim();
    interpretation = content.slice(match.index).replace(/^---\s*\n+/, '').trim();
  }

  return {
    meta: {
      title: data.title ?? slug,
      author: data.author ?? 'Unknown',
      date: data.date ?? '',
      source: data.source ?? '',
      slug: data.slug ?? slug,
      tags: data.tags ?? [],
    },
    content,
    original,
    interpretation,
    filePath,
  };
}

/**
 * Get all articles sorted by date (newest first).
 */
export function getAllArticles(outputDir: string): Article[] {
  const slugs = getExistingSlugs(outputDir);
  return [...slugs]
    .map((slug) => getArticleBySlug(outputDir, slug))
    .filter((a): a is Article => a !== null)
    .sort((a, b) => (a.meta.date > b.meta.date ? -1 : 1));
}

/**
 * Check if an article has a real interpretation (not just a placeholder).
 */
export function hasInterpretation(article: Article): boolean {
  return article.interpretation.length > 0 && !article.interpretation.includes('待解读');
}
