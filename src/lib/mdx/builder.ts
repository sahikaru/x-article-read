import type { TweetData, Engagement } from "../types";

export function slugify(text: string): string {
  return text
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .toLowerCase();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10);
}

export function buildSlug(tweet: TweetData): string {
  const date = formatDate(tweet.created_at);
  return `${date}-${slugify(tweet.text.slice(0, 40))}`;
}

/**
 * Build an MDX article from tweet data.
 * Generates frontmatter + original content + interpretation placeholder.
 */
export function buildMdx(
  tweet: TweetData,
  tweetUrl: string,
  options?: { platform?: string; contentType?: string }
): string {
  const date = formatDate(tweet.created_at);
  const slug = buildSlug(tweet);
  const title = tweet.text.split("\n")[0].slice(0, 80);
  const platform = options?.platform ?? "twitter";
  const contentType = options?.contentType ?? "tweet";
  const engagement: Engagement = {
    likes: tweet.likes ?? 0,
    retweets: tweet.retweets ?? 0,
    views: tweet.views ?? 0,
  };

  let mdx = `---
title: "${title.replace(/"/g, '\\"')}"
author: "${tweet.author.name} (@${tweet.author.screen_name})"
date: "${date}"
source: "${tweetUrl}"
slug: "${slug}"
platform: "${platform}"
contentType: "${contentType}"
engagement: ${JSON.stringify(engagement)}
tags: []
---

## Original

> Source: [${tweetUrl}](${tweetUrl})
> Author: **${tweet.author.name}** (@${tweet.author.screen_name})
> Date: ${date} · ${engagement.likes} likes · ${engagement.views} views

`;

  const paragraphs = tweet.text.split("\n").filter((l) => l.trim());
  for (const p of paragraphs) {
    mdx += `${p}\n\n`;
  }

  if (tweet.quote) {
    mdx += `---\n\n### Quoted Tweet\n\n`;
    mdx += `> by **${tweet.quote.author.name}** (@${tweet.quote.author.screen_name})\n\n`;
    const qParagraphs = tweet.quote.text
      .split("\n")
      .filter((l) => l.trim());
    for (const p of qParagraphs) {
      mdx += `> ${p}\n>\n`;
    }
    mdx += "\n";
  }

  mdx += `---

## 解读

<Callout type="info">
  待解读 — 需要 AI 解读或手动撰写解读内容。
</Callout>
`;

  return mdx;
}
