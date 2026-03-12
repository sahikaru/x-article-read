#!/usr/bin/env tsx
/**
 * Full pipeline: fetch tweets -> check interpretations -> report.
 *
 * Usage:
 *   npx tsx src/pipeline.ts --username=gch_enbsbxbs --ids-file=tweet-ids.txt
 *   npx tsx src/pipeline.ts --username=gch_enbsbxbs --url=https://x.com/user/status/123
 *
 * This orchestrates the full workflow:
 * 1. Fetch tweets and save as MDX
 * 2. Report which articles need AI interpretation
 */

import fs from 'fs';
import path from 'path';
import { extractTweetId, fetchTweet } from './twitter-api.js';
import { buildMdx, buildSlug } from './mdx-builder.js';
import { getAllArticles, hasInterpretation, getExistingSlugs } from './articles.js';

const OUTPUT_DIR = path.join(process.cwd(), 'output', 'articles');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);

  // Parse single URL mode
  const urlArg = args.find((a) => a.startsWith('--url='));
  if (urlArg) {
    const url = urlArg.split('=')[1];
    const info = extractTweetId(url);
    if (!info) {
      console.error('Invalid tweet URL');
      process.exit(1);
    }

    console.log(`Fetching tweet from @${info.username}...`);
    const data = await fetchTweet(info.username, info.id);
    if (!data.tweet) {
      console.error('Tweet not found');
      process.exit(1);
    }

    const mdx = buildMdx(data.tweet, url);
    const slug = buildSlug(data.tweet);
    const filePath = path.join(OUTPUT_DIR, `${slug}.mdx`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(filePath, mdx, 'utf-8');
    console.log(`Saved: ${filePath}`);
    console.log(`\nNext: Run AI interpretation on this article.`);
    return;
  }

  // Parse batch mode
  const usernameArg = args.find((a) => a.startsWith('--username='));
  const idsFileArg = args.find((a) => a.startsWith('--ids-file='));
  const dryRun = args.includes('--dry-run');

  if (!usernameArg || !idsFileArg) {
    console.error('Usage:');
    console.error('  Single: npx tsx src/pipeline.ts --url=<tweet_url>');
    console.error('  Batch:  npx tsx src/pipeline.ts --username=<handle> --ids-file=<file>');
    process.exit(1);
  }

  const username = usernameArg.split('=')[1];
  const idsFile = idsFileArg.split('=')[1];
  const tweetIds = fs.readFileSync(idsFile, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const existingSlugs = getExistingSlugs(OUTPUT_DIR);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n=== Pipeline: @${username} ===`);
  console.log(`Tweets: ${tweetIds.length} | Existing: ${existingSlugs.size} | Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Phase 1: Fetch
  let fetched = 0;
  for (let i = 0; i < tweetIds.length; i++) {
    const tweetId = tweetIds[i];
    try {
      const data = await fetchTweet(username, tweetId);
      if (!data.tweet || data.tweet.text.length < 100) continue;

      const slug = buildSlug(data.tweet);
      if (existingSlugs.has(slug)) {
        console.log(`[${i + 1}/${tweetIds.length}] SKIP: ${slug.slice(0, 40)}...`);
        continue;
      }

      if (!dryRun) {
        const tweetUrl = `https://x.com/${username}/status/${tweetId}`;
        const mdx = buildMdx(data.tweet, tweetUrl);
        const filePath = path.join(OUTPUT_DIR, `${slug}.mdx`);
        fs.writeFileSync(filePath, mdx, 'utf-8');
        console.log(`[${i + 1}/${tweetIds.length}] SAVED: ${slug.slice(0, 40)}...`);
      }
      fetched++;

      if (i < tweetIds.length - 1) await sleep(60_000);
    } catch (err) {
      console.log(`[${i + 1}/${tweetIds.length}] ERROR: ${(err as Error).message}`);
      if (i < tweetIds.length - 1) await sleep(60_000);
    }
  }

  // Phase 2: Report
  console.log(`\n=== Fetch Complete: ${fetched} new articles ===\n`);

  const articles = getAllArticles(OUTPUT_DIR);
  const pending = articles.filter((a) => !hasInterpretation(a));

  if (pending.length > 0) {
    console.log(`${pending.length} articles need AI interpretation:`);
    for (const a of pending) {
      console.log(`  - ${a.meta.date} | ${a.meta.title.slice(0, 50)}`);
    }
  } else {
    console.log('All articles have interpretations.');
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
