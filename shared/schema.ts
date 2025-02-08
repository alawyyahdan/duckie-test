import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isSeller: boolean("is_seller").notNull().default(false),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  songRequest: text("song_request"),
  hasUploaded: boolean("has_uploaded").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isSeller: true,
});

export const insertOrderSchema = createInsertSchema(orders);
export const orderNumberSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;