CREATE TABLE `ai_request_limits` (
	`client_hash` text PRIMARY KEY NOT NULL,
	`window_started_at` integer NOT NULL,
	`request_count` integer NOT NULL
);
