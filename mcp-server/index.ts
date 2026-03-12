import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { handleToolCall } from "./handlers";

const server = new McpServer({
  name: "tweet-analyzer",
  version: "1.0.0",
});

server.tool(
  "list_pending_articles",
  "List all articles that have not been interpreted yet",
  { limit: z.number().optional().describe("Max articles to return (default: 20)") },
  async (args) => handleToolCall("list_pending_articles", args)
);

server.tool(
  "get_article_content",
  "Get the full content of an article by slug",
  { slug: z.string().describe("The article slug") },
  async (args) => handleToolCall("get_article_content", args)
);

server.tool(
  "save_interpretation",
  "Save an AI-generated interpretation for an article",
  {
    slug: z.string().describe("The article slug"),
    interpretation: z.string().describe("Interpretation text in Chinese"),
    tags: z.array(z.string()).optional().describe("Suggested tags"),
  },
  async (args) => handleToolCall("save_interpretation", args)
);

server.tool(
  "batch_interpret",
  "Get a batch of pending articles for interpretation",
  { limit: z.number().optional().describe("Max articles to return (default: 5)") },
  async (args) => handleToolCall("batch_interpret", args)
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tweet Analyzer MCP server running on stdio");
}

main().catch(console.error);
