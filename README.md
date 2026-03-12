# Tweet Analyzer

Cross-platform RSS+AI app for fetching tweets from X/Twitter and generating structured MDX articles with AI-powered Chinese interpretations.

## Features

- **Follow Management** — Categorized user follow system with M2M relationships
- **Article/Tweet Feed** — RSS-like browsing with filters (interpretation status, sort, tags)
- **AI Interpretation** — Dual mode: MCP Server (free, via Claude Code) + Claude API (optional)
- **Content Organization** — Browse by person, topic/tag, or search (FTS5)
- **GitHub Dark Theme** — Accurate color palette, responsive layout
- **MDX Rendering** — Rich content with Callout, Step, tables (GFM), and code blocks
- **Side-by-side View** — Original content and AI interpretation displayed left-right on desktop
- **MCP Server** — 4 tools for Claude Code integration (list, get, save, batch interpret)
- **CLI Tools** — Legacy fetch and interpret commands preserved

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + PWA |
| UI | Tailwind CSS + shadcn/ui, GitHub Dark theme |
| Database | SQLite + Drizzle ORM (local-first) |
| API | tRPC v11, end-to-end type-safe |
| State | TanStack Query v5 via tRPC |
| Search | SQLite FTS5 full-text search |
| AI | @anthropic-ai/sdk (Claude API) + MCP Server |
| MDX | next-mdx-remote + remark-gfm |
| Testing | Vitest (50 tests, 6 files) |

## Quick Start

```bash
npm install

# Run migrations and seed data
npx tsx scripts/migrate-mdx.ts

# Start dev server
npx next dev -p 3999

# Run tests
npx vitest run
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Feed — article list with filters and infinite scroll |
| `/follows` | Follow management with category sidebar |
| `/follows/[username]` | Person view — articles by author |
| `/articles/[slug]` | Article detail — side-by-side original + interpretation |
| `/topics` | Tag list with article counts |
| `/topics/[tag]` | Articles filtered by tag |
| `/search` | Full-text search (FTS5) |
| `/settings` | API key, model selector, mode detection |

## Project Structure

```
tweet-analyzer/
├── src/
│   ├── app/                  # Next.js pages and API routes
│   ├── components/           # React components (sidebar, cards, MDX renderer)
│   ├── lib/
│   │   ├── db/               # Drizzle schema, connection, seed
│   │   ├── services/         # Business logic (articles, follows, search, interpretation)
│   │   ├── mdx/              # MDX builder utilities
│   │   └── trpc/             # tRPC client
│   └── server/trpc/          # tRPC routers (articles, follows, categories, search, settings, interpretation)
├── mcp-server/               # MCP Server (stdio transport, 4 tools)
├── cli/                      # CLI tools (fetch, interpret)
├── legacy/                   # Original CLI source preserved
├── scripts/                  # Migration scripts
├── drizzle/                  # SQL migrations
└── data/                     # SQLite database (gitignored)
```

## AI Interpretation

### MCP Server (default, free)

Uses your local Claude Code. Configure via `.mcp.json`:

```json
{
  "mcpServers": {
    "tweet-analyzer": {
      "command": "npx",
      "args": ["tsx", "mcp-server/index.ts"]
    }
  }
}
```

### Claude API (optional)

Set your API key in Settings page. Supports Haiku 4.5 (fast) and Sonnet 4.6 (quality).

## Interpretation Rules

- Write in Chinese (simplified)
- Keep professional/technical terms in English (e.g., Martingale, Grid Trading, LP, DeFi)
- Use `<Callout type="warning">` for risk disclaimers
- Use `<Callout type="info">` for key insights
