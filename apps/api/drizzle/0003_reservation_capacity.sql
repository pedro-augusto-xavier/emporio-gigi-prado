ALTER TABLE "reservations" DROP CONSTRAINT "reservations_table_id_dining_tables_id_fk";
--> statement-breakpoint
ALTER TABLE "reservations" ALTER COLUMN "table_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_dining_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."dining_tables"("id") ON DELETE set null ON UPDATE no action;