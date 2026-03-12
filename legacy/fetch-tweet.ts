#!/usr/bin/env tsx
/**
 * Fetch a single tweet and save as MDX article.
 *
 * Usage:
 *   npx tsx src/fetch-tweet.ts <tweet_url>
 *   npx tsx src/fetch-tweet.ts https://x.com/user/status/123456
 */

import fs from 'fs';
import path from 'path';
import { extractTweetId, fetchTweet } from './twitter-api.js';
import { buildMdx, buildSlug } from './mdx-builder.js';

const OUTPUT_DIR = path.join(process.cwd(), 'output', 'articles');

async function main() {
  const url = process.argv.find((a, i) => i >= 2 && !a.startsWith('--'));

  if (!url) {
    console.error('Usage: npx tsx src/fetch-tweet.ts <tweet_url>');
    process.exit(1);
  }

  const info = extractTweetId(url);
  if (!info) {
    console.error('Invalid tweet URL. Expected: https://x.com/user/status/123456');
    process.exit(1);
  }

  console.log(`Fetching tweet ${info.id} from @${info.username}...`);
  const data = await fetchTweet(info.username, info.id);

  if (!data.tweet) {
    console.error('Tweet not found or API error');
    process.exit(1);
  }

  const mdx = buildMdx(data.tweet, url);
  const slug = buildSlug(data.tweet);
  const filePath = path.join(OUTPUT_DIR, `${slug}.mdx`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(filePath, mdx, 'utf-8');

  console.log(`Saved: ${path.relative(process.cwd(), filePath)}`);
  console.log(`  Title: ${data.tweet.text.split('\n')[0].slice(0, 60)}...`);
  console.log(`  Author: @${data.tweet.author.screen_name}`);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
