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

export interface ArticleMeta {
  title: string;
  author: string;
  date: string;
  source: string;
  slug: string;
  tags: string[];
}

export interface Article {
  meta: ArticleMeta;
  content: string;
  original: string;
  interpretation: string;
  filePath: string;
}

export interface FetchResult {
  tweetId: string;
  status: 'fetched' | 'skipped' | 'failed';
  slug?: string;
  filePath?: string;
  reason?: string;
}

export interface PipelineConfig {
  /** Twitter username to fetch from */
  username: string;
  /** Output directory for MDX files */
  outputDir: string;
  /** Delay between API requests in ms */
  delayMs: number;
  /** Minimum tweet text length to include */
  minLength: number;
  /** Whether to skip existing articles */
  skipExisting: boolean;
}
