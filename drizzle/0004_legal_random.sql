CREATE TABLE `buyer_remittances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`retailerId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`note` varchar(500),
	`remittanceStatus` enum('recorded','successful','failed') NOT NULL DEFAULT 'recorded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buyer_remittances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`category` varchar(100) NOT NULL,
	`grade` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` varchar(500),
	`quantityAvailable` int NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`currency` enum('NGN') NOT NULL DEFAULT 'NGN',
	`location` varchar(160) NOT NULL,
	`listingStatus` enum('published','archived') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_order_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`listingId` int NOT NULL,
	`supplierId` int NOT NULL,
	`titleSnapshot` varchar(180) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`lineAmount` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_order_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderRef` varchar(40) NOT NULL,
	`buyerName` varchar(120) NOT NULL,
	`buyerEmail` varchar(320) NOT NULL,
	`buyerPhone` varchar(48) NOT NULL,
	`deliveryLocation` varchar(200) NOT NULL,
	`orderMode` enum('direct','retailer_partner') NOT NULL,
	`retailerId` int,
	`investmentAmount` decimal(12,2) NOT NULL,
	`profitAmount` decimal(12,2) NOT NULL,
	`totalPayoutAmount` decimal(12,2) NOT NULL,
	`paymentStatus` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
	`marketplaceOrderStatus` enum('payment_pending','funded','cancelled') NOT NULL DEFAULT 'payment_pending',
	`manualPaymentConfirmed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_orders_orderRef_unique` UNIQUE(`orderRef`)
);
--> statement-breakpoint
CREATE TABLE `retailer_order_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`retailerId` int NOT NULL,
	`itemsSold` int NOT NULL,
	`revenue` decimal(12,2) NOT NULL,
	`expenses` decimal(12,2) NOT NULL,
	`note` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retailer_order_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `portal_accounts` MODIFY COLUMN `phone` varchar(48);--> statement-breakpoint
ALTER TABLE `portal_accounts` MODIFY COLUMN `portalRole` enum('retailer','wholesaler','supplier') NOT NULL;--> statement-breakpoint
ALTER TABLE `portal_accounts` ADD `approvalStatus` enum('pending','approved','rejected');--> statement-breakpoint
ALTER TABLE `buyer_remittances` ADD CONSTRAINT `buyer_remittances_orderId_marketplace_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `marketplace_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buyer_remittances` ADD CONSTRAINT `buyer_remittances_retailerId_portal_accounts_id_fk` FOREIGN KEY (`retailerId`) REFERENCES `portal_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_listings` ADD CONSTRAINT `marketplace_listings_supplierId_portal_accounts_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `portal_accounts`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_order_lines` ADD CONSTRAINT `marketplace_order_lines_orderId_marketplace_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `marketplace_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_order_lines` ADD CONSTRAINT `marketplace_order_lines_listingId_marketplace_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `marketplace_listings`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_order_lines` ADD CONSTRAINT `marketplace_order_lines_supplierId_portal_accounts_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `portal_accounts`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_orders` ADD CONSTRAINT `marketplace_orders_retailerId_portal_accounts_id_fk` FOREIGN KEY (`retailerId`) REFERENCES `portal_accounts`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retailer_order_progress` ADD CONSTRAINT `retailer_order_progress_orderId_marketplace_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `marketplace_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retailer_order_progress` ADD CONSTRAINT `retailer_order_progress_retailerId_portal_accounts_id_fk` FOREIGN KEY (`retailerId`) REFERENCES `portal_accounts`(`id`) ON DELETE cascade ON UPDATE no action;