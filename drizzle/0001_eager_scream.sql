CREATE TABLE `monitor_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`applicationUrl` text NOT NULL,
	`healthUrl` text,
	`cronTaskUid` varchar(65),
	`cronExpression` varchar(64) NOT NULL DEFAULT '0 * * * * *',
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`runbookMarkdown` text NOT NULL,
	`responseMode` enum('dashboard','email','omnidim') NOT NULL DEFAULT 'dashboard',
	`responseContact` varchar(320),
	`failureThreshold` int NOT NULL DEFAULT 2,
	`approvedAction` varchar(180) NOT NULL DEFAULT 'Review the incident and restore the service after approval.',
	`enabled` int NOT NULL DEFAULT 1,
	`lastCheckedAt` timestamp,
	`lastStatus` enum('healthy','unhealthy','unreachable','degraded'),
	`lastResult` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitor_configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `monitor_configurations_user_idx` ON `monitor_configurations` (`userId`);--> statement-breakpoint
CREATE INDEX `monitor_configurations_cron_idx` ON `monitor_configurations` (`cronTaskUid`);