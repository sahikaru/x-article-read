# Changelog

## [1.0.0] - 2026-03-12

### Added
- **Full cross-platform app** — Next.js 15 (App Router) + PWA
- **Follow management** — CRUD with M2M category assignments, 6 default categories
- **Article feed** — Infinite scroll, filter by interpretation status/tags, sort by date/likes/views
- **Article detail** — Side-by-side layout (original left, interpretation right) on desktop
- **AI interpretation** — Dual mode: MCP Server (free) + Claude API (optional, Haiku/Sonnet)
- **MDX rendering** — next-mdx-remote with remark-gfm, custom components (Callout, Step, tables)
- **Full-text search** — SQLite FTS5 with snippet highlighting
- **Topics/tags** — Tag list with article counts, filter by tag
- **Settings page** — API key persistence (SQLite), model selector, real API key validation
- **MCP Server** — 4 tools: list_pending_articles, get_article_content, save_interpretation, batch_interpret
- **GitHub Dark theme** — Accurate hex values (#0d1117, #161b22, #30363d, #58a6ff, etc.)
- **Database** — SQLite + Drizzle ORM with unique constraints, FTS5 triggers, WAL mode
- **tRPC v11** — 6 routers (articles, follows, categories, search, settings, interpretation)
- **50 tests** — Schema, services, interpretation, MDX builder, tRPC routers, MCP handlers
- **MDX migration script** — Imported 28 existing articles from file-based storage
- **CLI tools preserved** — fetch and interpret commands still available
- **.mcp.json** — Ready-to-use MCP server config for Claude Code
- **Claude Code skill** — Bundled interpretation skill at `.claude/skills/interpret-article.md`

### Fixed (post-review)
- tRPC interpretation router wired to actual service (was stub)
- `removeCategory` now correctly filters by categoryId (was deleting all)
- Unique constraints on follows (platform+username) and articles (platform+sourceId)
- Settings API key persisted to SQLite (was lost on refresh)
- MCP save_interpretation now saves tags to articleTags table
- Engagement JSON no longer double-encoded
- FTS5 initialized on app startup, search router uses FTS5 service
- N+1 queries replaced with Drizzle `inArray()`
- Feed tags populated from `getAllTags()` tRPC procedure
- `contentPreview` field added, strips MDX markup for clean previews
- Duplicate Callout component removed
- Article detail: `decodeURIComponent` for Chinese slug URLs
- Article detail: defensive engagement JSON parsing
- MDX renderer: `<Step>` component registered
- MDX renderer: `remark-gfm` added for table/GFM support
- MDX renderer: table, thead, tbody, tr, th, td, hr components styled
- Content area expanded from `max-w-3xl` to `max-w-7xl` for side-by-side layout
