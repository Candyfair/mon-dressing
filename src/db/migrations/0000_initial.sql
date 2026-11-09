CREATE TABLE `dayOverrides` (
	`date` text PRIMARY KEY NOT NULL,
	`activity` text,
	`commuteModes` text,
	`occasion` text
);
--> statement-breakpoint
CREATE TABLE `garmentEvents` (
	`id` text PRIMARY KEY NOT NULL,
	`garmentId` text NOT NULL,
	`type` text NOT NULL,
	`source` text NOT NULL,
	`fromLocation` text,
	`toLocation` text,
	`toIron` integer,
	`outfitId` text,
	`occurredAt` integer NOT NULL,
	FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`outfitId`) REFERENCES `outfits`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `garment_events_garment_type_occurred_idx` ON `garmentEvents` (`garmentId`,`type`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `garment_events_type_occurred_idx` ON `garmentEvents` (`type`,`occurredAt`);--> statement-breakpoint
CREATE TABLE `garmentUsages` (
	`garmentId` text NOT NULL,
	`usage` text NOT NULL,
	PRIMARY KEY(`garmentId`, `usage`),
	FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `garments` (
	`id` text PRIMARY KEY NOT NULL,
	`wardrobeId` text NOT NULL,
	`name` text,
	`slot` text NOT NULL,
	`subtype` text NOT NULL,
	`statementPiece` integer DEFAULT false NOT NULL,
	`needsIroning` integer DEFAULT false NOT NULL,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isDemo` integer DEFAULT false NOT NULL,
	`wearCount` integer DEFAULT 0 NOT NULL,
	`location` text DEFAULT 'stored' NOT NULL,
	`locationSince` integer NOT NULL,
	`toIron` integer DEFAULT false NOT NULL,
	`photoOriginalPath` text NOT NULL,
	`photoCutoutPath` text,
	`cutoutStatus` text DEFAULT 'pending' NOT NULL,
	`useCutout` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`wardrobeId`) REFERENCES `wardrobes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "garments_wear_count_check" CHECK("garments"."wearCount" >= 0)
);
--> statement-breakpoint
CREATE INDEX `garments_wardrobe_slot_idx` ON `garments` (`wardrobeId`,`slot`);--> statement-breakpoint
CREATE INDEX `garments_wardrobe_location_idx` ON `garments` (`wardrobeId`,`location`);--> statement-breakpoint
CREATE TABLE `outfitItems` (
	`outfitId` text NOT NULL,
	`slot` text NOT NULL,
	`garmentId` text,
	PRIMARY KEY(`outfitId`, `slot`),
	FOREIGN KEY (`outfitId`) REFERENCES `outfits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `outfits` (
	`id` text PRIMARY KEY NOT NULL,
	`wardrobeId` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`activity` text NOT NULL,
	`commuteModes` text NOT NULL,
	`occasion` text NOT NULL,
	`validatedAt` integer,
	`sortedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`wardrobeId`) REFERENCES `wardrobes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outfits_wardrobe_date_status_idx` ON `outfits` (`wardrobeId`,`date`,`status`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`activeWardrobeId` text NOT NULL,
	`commuteModes` text DEFAULT '[]' NOT NULL,
	`officeDepartureTime` text DEFAULT '08:30' NOT NULL,
	`officeReturnTime` text DEFAULT '18:30' NOT NULL,
	`lunchOutingEnabled` integer DEFAULT false NOT NULL,
	`activeDayStart` text DEFAULT '09:00' NOT NULL,
	`activeDayEnd` text DEFAULT '20:00' NOT NULL,
	`outfitReadyTime` text DEFAULT '07:00' NOT NULL,
	`eveningSortTime` text DEFAULT '20:00' NOT NULL,
	`airingEnabled` integer,
	`dryingRackCountsAsStorage` integer DEFAULT true NOT NULL,
	`dryingDelayHours` integer DEFAULT 24 NOT NULL,
	`morningNotification` integer DEFAULT false NOT NULL,
	`eveningSortNotification` integer DEFAULT false NOT NULL,
	`laundryDryNotification` integer DEFAULT false NOT NULL,
	`useGeolocation` integer DEFAULT false NOT NULL,
	`language` text DEFAULT 'fr' NOT NULL,
	`onboardingCompletedAt` integer,
	`demoCleanupOfferedAt` integer,
	`hintsSeen` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`activeWardrobeId`) REFERENCES `wardrobes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wardrobes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`cityName` text,
	`latitude` real,
	`longitude` real,
	`timeZone` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wearLimits` (
	`subtype` text PRIMARY KEY NOT NULL,
	`maxWears` integer NOT NULL,
	CONSTRAINT "wear_limits_max_wears_check" CHECK("wearLimits"."maxWears" >= 1)
);
--> statement-breakpoint
CREATE TABLE `weeklyProgram` (
	`weekday` integer PRIMARY KEY NOT NULL,
	`activity` text NOT NULL
);
