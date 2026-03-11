# tweet-analyzer

Fetch tweets from X/Twitter and generate structured MDX articles with AI-powered Chinese interpretations.

## Features

- **Tweet Fetching**: Single or batch fetch via fxtwitter API (no auth required)
- **MDX Generation**: Structured articles with frontmatter, original content, and interpretation sections
- **Rate Limiting**: Configurable delay between requests for anti-scraping compliance
- **Interpretation Pipeline**: Identifies articles needing AI interpretation, provides prompt templates
- **Duplicate Detection**: Skips already-fetched articles automatically

## Quick Start

```bash
npm install

# Fetch a single tweet
npm run fetch -- https://x.com/user/status/123456

# Batch fetch from ID list
npm run batch -- --username=gch_enbsbxbs --ids-file=tweet-ids.txt

# Check interpretation status
npm run interpret

# Full pipeline (fetch + report)
npm run pipeline -- --url=https://x.com/user/status/123456
```

## Project Structure

```
tweet-analyzer/
├── src/
│   ├── types.ts          # Type definitions
│   ├── twitter-api.ts    # fxtwitter API client
│   ├── mdx-builder.ts    # MDX article generation
│   ├── articles.ts       # Article reading/parsing
│   ├── fetch-tweet.ts    # Single tweet CLI
│   ├── batch-fetch.ts    # Batch fetch CLI
│   ├── interpret.ts      # Interpretation status checker
│   └── pipeline.ts       # Full pipeline orchestrator
├── output/
│   └── articles/         # Generated MDX articles
├── package.json
└── tsconfig.json
```

## Article Format

Each article is an MDX file with:

```mdx
---
title: "..."
author: "Name (@handle)"
date: "2025-01-01"
source: "https://x.com/..."
slug: "2025-01-01-title-slug"
tags: ["tag1", "tag2"]
---

## Original

> Original tweet content...

---

## 解读

Chinese interpretation with English technical terms preserved.
```

## Interpretation Rules

- Write in Chinese (简体中文)
- Keep professional/technical terms in English (e.g., Martingale, Grid Trading, LP, DeFi)
- Use `<Callout type="warning">` for risk disclaimers
- Use `<Callout type="info">` for key insights
