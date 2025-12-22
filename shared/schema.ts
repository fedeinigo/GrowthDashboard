import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, serial, timestamp, decimal, date, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models
export * from "./models/auth";

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// People table
export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  pipedriveUserId: integer("pipedrive_user_id"),
});

export const insertPersonSchema = createInsertSchema(people).omit({ id: true });
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;

// Sources table
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
});

export const insertSourceSchema = createInsertSchema(sources).omit({ id: true });
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Regions table
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertRegionSchema = createInsertSchema(regions).omit({ id: true });
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  companySize: text("company_size").notNull(), // "1-10", "11-50", etc.
  sourceId: integer("source_id").references(() => sources.id),
  regionId: integer("region_id").references(() => regions.id),
  assignedToId: integer("assigned_to_id").references(() => people.id),
  teamId: integer("team_id").references(() => teams.id),
  status: text("status").notNull().default("new"), // new, contacted, proposal, closed-won, closed-lost
  dealValue: decimal("deal_value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Activities table (meetings, proposals, closings)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  type: text("type").notNull(), // "meeting", "proposal", "closing"
  date: date("date").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }), // For proposals and closings
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Sales table (product sales)
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull(),
  saleDate: date("sale_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

// Pipedrive deals cache table
export const pipedriveDeals = pgTable("pipedrive_deals", {
  id: integer("id").primaryKey(), // Pipedrive deal ID
  title: text("title"),
  value: decimal("value", { precision: 12, scale: 2 }),
  currency: text("currency"),
  status: text("status"), // open, won, lost
  stageId: integer("stage_id"),
  pipelineId: integer("pipeline_id"),
  userId: integer("user_id"), // Current owner (BDR)
  creatorUserId: integer("creator_user_id"), // Creator (SDR)
  personId: integer("person_id"),
  orgId: integer("org_id"),
  addTime: timestamp("add_time"),
  updateTime: timestamp("update_time"),
  wonTime: timestamp("won_time"),
  lostTime: timestamp("lost_time"),
  // Custom fields from Pipedrive
  dealType: text("deal_type"), // New Customer, Upselling
  country: text("country"), // Country ID
  origin: text("origin"), // Origin ID
  employeeCount: text("employee_count"), // Q de empleados field
  sourceField: text("source_field"), // Source field (552c1914dddd36582917f20f82b71c475bfbd132)
  // Calculated fields for faster queries
  salesCycleDays: integer("sales_cycle_days"),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

export type PipedriveDeal = typeof pipedriveDeals.$inferSelect;

// Cache metadata table
export const cacheMetadata = pgTable("cache_metadata", {
  id: serial("id").primaryKey(),
  cacheKey: text("cache_key").notNull().unique(), // e.g., "pipedrive_deals"
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: text("last_sync_status"), // success, error, in_progress
  lastSyncError: text("last_sync_error"),
  totalRecords: integer("total_records"),
  syncDurationMs: integer("sync_duration_ms"),
});

export type CacheMetadata = typeof cacheMetadata.$inferSelect;

// Pipedrive deal products cache table
export const pipedriveDealProducts = pgTable("pipedrive_deal_products", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name"),
  quantity: integer("quantity").default(1),
  itemPrice: decimal("item_price", { precision: 12, scale: 2 }),
  discount: decimal("discount", { precision: 5, scale: 2 }),
  sum: decimal("sum", { precision: 12, scale: 2 }),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

export type PipedriveDealProduct = typeof pipedriveDealProducts.$inferSelect;
