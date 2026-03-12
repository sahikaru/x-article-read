import { describe, it, expect } from "vitest";
import { slugify, formatDate, buildSlug, buildMdx } from "../builder";
import type { TweetData } from "../../types";

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("handles Chinese characters", () => {
    expect(slugify("你好世界 test")).toBe("你好世界-test");
  });

  it("truncates to 60 chars", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe("formatDate", () => {
  it("formats ISO date to YYYY-MM-DD", () => {
    expect(formatDate("2024-03-15T10:30:00Z")).toBe("2024-03-15");
  });
});

describe("buildSlug", () => {
  it("builds slug from tweet data", () => {
    const tweet: TweetData = {
      text: "Hello World tweet",
      author: { name: "Test", screen_name: "test" },
      created_at: "2024-03-15T10:30:00Z",
      likes: 10,
      retweets: 5,
      views: 100,
      id: "123",
    };
    const slug = buildSlug(tweet);
    expect(slug).toContain("2024-03-15");
    expect(slug).toContain("hello-world-tweet");
  });
});

describe("buildMdx", () => {
  it("generates MDX with frontmatter", () => {
    const tweet: TweetData = {
      text: "This is a test tweet\nSecond line",
      author: { name: "Author", screen_name: "author" },
      created_at: "2024-03-15T10:30:00Z",
      likes: 42,
      retweets: 10,
      views: 1000,
      id: "456",
    };
    const mdx = buildMdx(tweet, "https://x.com/author/status/456");

    expect(mdx).toContain('title: "This is a test tweet"');
    expect(mdx).toContain('platform: "twitter"');
    expect(mdx).toContain('contentType: "tweet"');
    expect(mdx).toContain("42 likes");
    expect(mdx).toContain("Second line");
    expect(mdx).toContain("待解读");
  });

  it("includes quoted tweet when present", () => {
    const tweet: TweetData = {
      text: "Quote this",
      author: { name: "A", screen_name: "a" },
      created_at: "2024-01-01T00:00:00Z",
      likes: 1,
      retweets: 0,
      views: 10,
      id: "789",
      quote: {
        text: "Original tweet",
        author: { name: "B", screen_name: "b" },
      },
    };
    const mdx = buildMdx(tweet, "https://x.com/a/status/789");
    expect(mdx).toContain("Quoted Tweet");
    expect(mdx).toContain("Original tweet");
  });
});
