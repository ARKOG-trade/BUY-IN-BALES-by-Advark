CREATE TABLE `bale_deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`retailerId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`buyerName` varchar(120),
	`dealType` enum('own_business','fixed_return','profit_split') NOT NULL,
	`capital` int NOT NULL,
	`fixedProfitPercent` decimal(5,2),
	`currency` enum('NGN','GBP','USD') NOT NULL DEFAULT 'NGN',
	`dealStatus` enum('active','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bale_deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterType` enum('supplier','retailer') NOT NULL,
	`corridor` enum('china','london','local') NOT NULL,
	`contactName` varchar(120) NOT NULL,
	`companyName` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(48) NOT NULL,
	`message` varchar(1000) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`fullName` varchar(120) NOT NULL,
	`businessName` varchar(160) NOT NULL,
	`phone` varchar(48) NOT NULL,
	`location` varchar(160) NOT NULL,
	`portalRole` enum('retailer','wholesaler') NOT NULL,
	`performanceSharing` enum('private','shared') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portal_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `portal_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `progress_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`retailerId` int NOT NULL,
	`dealId` int NOT NULL,
	`itemsSold` int NOT NULL DEFAULT 0,
	`revenue` int NOT NULL DEFAULT 0,
	`expenses` int NOT NULL DEFAULT 0,
	`note` varchar(500),
	`reportDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(255);--> statement-breakpoint
ALTER TABLE `bale_deals` ADD CONSTRAINT `bale_deals_retailerId_portal_accounts_id_fk` FOREIGN KEY (`retailerId`) REFERENCES `portal_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_sessions` ADD CONSTRAINT `portal_sessions_accountId_portal_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `portal_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_reports` ADD CONSTRAINT `progress_reports_retailerId_portal_accounts_id_fk` FOREIGN KEY (`retailerId`) REFERENCES `portal_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_reports` ADD CONSTRAINT `progress_reports_dealId_bale_deals_id_fk` FOREIGN KEY (`dealId`) REFERENCES `bale_deals`(`id`) ON DELETE cascade ON UPDATE no action;