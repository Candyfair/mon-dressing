-- "Soirée" is merged into "Festif" (Candice, 2026-11-18): the two tags overlapped.
INSERT OR IGNORE INTO `garmentUsages` (`garmentId`, `usage`)
SELECT `garmentId`, 'occasion.festive' FROM `garmentUsages` WHERE `usage` = 'occasion.evening';
--> statement-breakpoint
DELETE FROM `garmentUsages` WHERE `usage` = 'occasion.evening';
--> statement-breakpoint
UPDATE `dayOverrides` SET `occasion` = 'festive' WHERE `occasion` = 'evening';
--> statement-breakpoint
UPDATE `outfits` SET `occasion` = 'festive' WHERE `occasion` = 'evening';
