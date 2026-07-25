CREATE TABLE `asset_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quadrant` text NOT NULL,
	`amount` integer NOT NULL,
	`performance` text NOT NULL,
	`icon` text NOT NULL,
	`accent` text NOT NULL,
	`path` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `asset_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`detail` text NOT NULL,
	`icon` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `asset_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `asset_transactions_date_idx` ON `asset_transactions` (`date`);--> statement-breakpoint
CREATE TABLE `goal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text NOT NULL,
	`balance` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `goal_records_goal_date_idx` ON `goal_records` (`goal_id`,`date`);--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`icon` text NOT NULL,
	`status` text NOT NULL,
	`current_amount` integer DEFAULT 0 NOT NULL,
	`target_amount` integer NOT NULL,
	`estimate` text NOT NULL,
	`muted` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
