CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `content_preview` text;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_platform_source` ON `articles` (`platform`,`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `follows_platform_username` ON `follows` (`platform`,`username`);