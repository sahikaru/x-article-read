#!/usr/bin/env tsx
/**
 * Batch fetch tweets by ID list and save as MDX articles.
 * Rate-limited to avoid anti-scraping.
 *
 * Usage:
 *   npx tsx src/batch-fetch.ts --username=gch_enbsbxbs --ids=id1,id2,id3
 *   npx tsx src/batch-fetch.ts --username=gch_enbsbxbs --ids-file=tweet-ids.txt
 *   npx tsx src/batch-fetch.ts --username=gch_enbsbxbs --ids-file=tweet-ids.txt --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fetchTweet } from './twitter-api.js';
import { buildMdx, buildSlug, formatDate } from './mdx-builder.js';
import { getExistingSlugs } from './articles.js';
import type { FetchResult, PipelineConfig } from './types.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(): { username: string; ids: string[]; dryRun: boolean; config: Partial<PipelineConfig> } {
  const args = process.argv.slice(2);
  let username = '';
  let ids: string[] = [];
  let dryRun = false;
  const config: Partial<PipelineConfig> = {};

  for (const arg of args) {
    if (arg.startsWith('--username=')) {
      username = arg.split('=')[1];
    } else if (arg.startsWith('--ids=')) {
      ids = arg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--ids-file=')) {
      const file = arg.split('=')[1];
      const content = fs.readFileSync(file, 'utf-8');
      ids = content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--delay=')) {
      config.delayMs = parseInt(arg.split('=')[1]) * 1000;
    } else if (arg.startsWith('--min-length=')) {
      config.minLength = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
      config.outputDir = arg.split('=')[1];
    }
  }

  if (!username || ids.length === 0) {
    console.error('Usage: npx tsx src/batch-fetch.ts --username=<handle> --ids=<id1,id2,...>');
    console.error('       npx tsx src/batch-fetch.ts --username=<handle> --ids-file=<file>');
    console.error('Options: --dry-run --delay=60 --min-length=100 --output=<dir>');
    process.exit(1);
  }

  return { username, ids, dryRun, config };
}

export async function batchFetch(
  username: string,
  tweetIds: string[],
  options: { dryRun?: boolean; config?: Partial<PipelineConfig> } = {},
): Promise<FetchResult[]> {
  const outputDir = options.config?.outputDir ?? path.join(process.cwd(), 'output', 'articles');
  const delayMs = options.config?.delayMs ?? 60_000;
  const minLength = options.config?.minLength ?? 100;
  const dryRun = options.dryRun ?? false;

  const existingSlugs = getExistingSlugs(outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n=== Batch Fetch @${username} tweets ===`);
  console.log(`Total: ${tweetIds.length} | Existing: ${existingSlugs.size} | Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const results: FetchResult[] = [];

  for (let i = 0; i < tweetIds.length; i++) {
    const tweetId = tweetIds[i];
    const progress = `[${i + 1}/${tweetIds.length}]`;

    try {
      console.log(`${progress} Fetching ${tweetId}...`);
      const data = await fetchTweet(username, tweetId);

      if (!data.tweet) {
        console.log(`  SKIP: Tweet not found`);
        results.push({ tweetId, status: 'failed', reason: 'not found' });
        if (i < tweetIds.length - 1) await sleep(delayMs);
        continue;
      }

      const slug = buildSlug(data.tweet);

      if (existingSlugs.has(slug)) {
        console.log(`  SKIP: Already exists`);
        results.push({ tweetId, status: 'skipped', slug, reason: 'exists' });
        continue;
      }

      if (data.tweet.text.length < minLength) {
        console.log(`  SKIP: Too short (${data.tweet.text.length} chars)`);
        results.push({ tweetId, status: 'skipped', slug, reason: 'too short' });
        continue;
      }

      const title = data.tweet.text.split('\n')[0].slice(0, 60);
      console.log(`  Title: ${title}...`);

      if (!dryRun) {
        const tweetUrl = `https://x.com/${username}/status/${tweetId}`;
        const mdx = buildMdx(data.tweet, tweetUrl);
        const filePath = path.join(outputDir, `${slug}.mdx`);
        fs.writeFileSync(filePath, mdx, 'utf-8');
        console.log(`  SAVED: ${slug.slice(0, 50)}...`);
        results.push({ tweetId, status: 'fetched', slug, filePath });
      } else {
        console.log(`  [DRY RUN] Would save: ${slug.slice(0, 50)}...`);
        results.push({ tweetId, status: 'fetched', slug });
      }

      if (i < tweetIds.length - 1) {
        const remaining = tweetIds.length - i - 1;
        console.log(`  Waiting ${delayMs / 1000}s... (${remaining} left)\n`);
        await sleep(delayMs);
      }
    } catch (err) {
      console.log(`  ERROR: ${(err as Error).message}`);
      results.push({ tweetId, status: 'failed', reason: (err as Error).message });
      if (i < tweetIds.length - 1) await sleep(delayMs);
    }
  }

  const fetched = results.filter((r) => r.status === 'fetched').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  console.log(`\n=== Done === Fetched: ${fetched} | Skipped: ${skipped} | Failed: ${failed}`);

  return results;
}

// CLI entry point
const { username, ids, dryRun, config } = parseArgs();
batchFetch(username, ids, { dryRun, config });
