CREATE TYPE "public"."menu_section" AS ENUM('almoco', 'cafe', 'bebidas');--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_categories" ADD COLUMN "section" "menu_section" DEFAULT 'almoco' NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;