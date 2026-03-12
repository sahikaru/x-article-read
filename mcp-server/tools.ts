export const TOOL_DEFINITIONS = [
  {
    name: "list_pending_articles",
    description:
      "List all articles that have not been interpreted yet. Returns article ID, slug, title, author, and published date.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of articles to return (default: 20)",
        },
      },
    },
  },
  {
    name: "get_article_content",
    description:
      "Get the full content of an article by its slug. Returns all article fields including original content.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "The article slug",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "save_interpretation",
    description:
      "Save an AI-generated interpretation for an article. The interpretation should be in Chinese with English technical terms.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "The article slug",
        },
        interpretation: {
          type: "string",
          description: "The interpretation text in Chinese",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Suggested tags for the article",
        },
      },
      required: ["slug", "interpretation"],
    },
  },
  {
    name: "batch_interpret",
    description:
      "Get a batch of pending articles with their full content for interpretation. Returns structured data for batch processing.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of articles to return (default: 5)",
        },
      },
    },
  },
] as const;
