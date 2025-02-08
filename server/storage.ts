import { User, InsertUser, Order, users, orders } from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getOrder(orderNumber: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  createOrder(orderNumber: string): Promise<Order>;
  updateOrder(orderNumber: string, data: Partial<Order>): Promise<Order>;
  deleteOrder(orderNumber: string): Promise<void>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async createOrder(orderNumber: string): Promise<Order> {
    const [order] = await db.insert(orders)
      .values({
        orderNumber,
        hasUploaded: false,
      })
      .returning();
    return order;
  }

  async updateOrder(orderNumber: string, data: Partial<Order>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.orderNumber, orderNumber))
      .returning();

    if (!order) throw new Error("Order not found");
    return order;
  }

  async deleteOrder(orderNumber: string): Promise<void> {
    await db.delete(orders).where(eq(orders.orderNumber, orderNumber));
  }
}

export const storage = new DatabaseStorage();