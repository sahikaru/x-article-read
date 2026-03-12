# x-article-read

Tweet analyzer: fetch tweets from X/Twitter and generate structured MDX articles with AI-powered Chinese interpretations.

## Project Structure

- `src/` — Core TypeScript modules (twitter-api, mdx-builder, articles, pipeline)
- `output/articles/` — Generated MDX articles (gitignored)

## Commands

```bash
npm run fetch -- <tweet_url>                          # Fetch single tweet
npm run batch -- --username=<handle> --ids-file=<f>   # Batch fetch
npm run interpret                                      # Check interpretation status
npm run pipeline -- --url=<tweet_url>                  # Full pipeline
```

## Team Workflow

Use the `x-article-read` team with 3 agents:

1. **fetcher** — Fetches tweets and saves as MDX files
2. **interpreter** — Writes Chinese interpretations for articles (parallel, 4 at a time)
3. **reviewer** — Reviews interpretation quality and completeness

## Interpretation Rules

- Write in Chinese (简体中文)
- Keep professional/technical terms in English (Martingale, Grid Trading, LP, DeFi, etc.)
- Use `<Callout type="warning">` for risk disclaimers
- Use `<Callout type="info">` for key insights
- Update frontmatter `tags` to relevant topics
