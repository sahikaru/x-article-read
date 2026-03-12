CREATE TABLE `article_tags` (
	`article_id` integer NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`article_id`, `tag`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` text NOT NULL,
	`platform` text NOT NULL,
	`content_type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`author_username` text NOT NULL,
	`author_display_name` text NOT NULL,
	`published_at` text NOT NULL,
	`source_url` text NOT NULL,
	`original_content` text NOT NULL,
	`mdx_content` text,
	`interpretation` text,
	`interpreted_at` text,
	`summary` text,
	`word_count` integer,
	`engagement` text,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `follow_categories` (
	`follow_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	PRIMARY KEY(`follow_id`, `category_id`),
	FOREIGN KEY (`follow_id`) REFERENCES `follows`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`bio` text,
	`added_at` text NOT NULL,
	`last_fetched_at` text
);
