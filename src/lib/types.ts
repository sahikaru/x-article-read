// Twitter API types (fxtwitter)
export interface FxTweetResponse {
  code: number;
  tweet?: TweetData;
}

export interface TweetData {
  text: string;
  author: { name: string; screen_name: string };
  created_at: string;
  likes: number;
  retweets: number;
  views: number;
  id: string;
  quote?: {
    text: string;
    author: { name: string; screen_name: string };
  };
  media?: {
    photos?: { url: string; alt_text?: string }[];
  };
}

// Engagement metrics stored as JSON in articles table
export interface Engagement {
  likes: number;
  retweets: number;
  views: number;
}

// Service layer types
export interface CreateArticleInput {
  sourceId: string;
  platform: "twitter" | "wechat";
  contentType: "tweet" | "thread" | "article";
  slug: string;
  title: string;
  authorUsername: string;
  authorDisplayName: string;
  publishedAt: string;
  sourceUrl: string;
  originalContent: string;
  mdxContent?: string;
  summary?: string;
  wordCount?: number;
  engagement?: Engagement;
  tags?: string[];
}

export interface CreateFollowInput {
  platform: "twitter" | "wechat";
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
  icon?: string;
  sortOrder?: number;
}
