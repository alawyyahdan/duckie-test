import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { orderNumberSchema } from "@shared/schema";
import { put } from "@vercel/blob";
import multer from "multer";

const upload = multer();

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Create new order (protected, only for sellers)
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSeller) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const result = orderNumberSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid order number" });
    }

    // Check if order already exists
    const existingOrder = await storage.getOrder(result.data.orderNumber);
    if (existingOrder) {
      return res.status(400).json({ message: "Order number already exists" });
    }

    const order = await storage.createOrder(result.data.orderNumber);
    res.status(201).json(order);
  });

  // Get all orders (protected, only for sellers)
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSeller) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const orders = await storage.getAllOrders();
    res.json(orders);
  });

  app.post("/api/verify-order", async (req, res) => {
    const result = orderNumberSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid order number" });
    }

    const order = await storage.getOrder(result.data.orderNumber);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if files have already been uploaded
    if (order.hasUploaded) {
      return res.status(400).json({ message: "Files have already been uploaded for this order" });
    }

    res.json(order);
  });

  app.post(
    "/api/upload/:orderNumber",
    upload.fields([
      { name: "video", maxCount: 1 },
      { name: "image", maxCount: 1 },
    ]),
    async (req, res) => {
      const { orderNumber } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { songRequest } = req.body;

      const order = await storage.getOrder(orderNumber);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if files have already been uploaded
      if (order.hasUploaded) {
        return res.status(400).json({ message: "Files have already been uploaded for this order" });
      }

      try {
        // Upload files to Vercel Blob
        const videoBlob = await put(
          `orders/${orderNumber}/video.${files.video[0].originalname.split('.').pop()}`,
          files.video[0].buffer,
          { access: 'public' }
        );

        const imageBlob = await put(
          `orders/${orderNumber}/image.${files.image[0].originalname.split('.').pop()}`,
          files.image[0].buffer,
          { access: 'public' }
        );

        const updatedOrder = await storage.updateOrder(orderNumber, {
          videoUrl: videoBlob.url,
          imageUrl: imageBlob.url,
          songRequest,
          hasUploaded: true,
        });

        res.json(updatedOrder);
      } catch (error) {
        console.error("File upload error:", error);
        res.status(500).json({ message: "Failed to upload files" });
      }
    }
  );

  // Add this route after other order routes
  app.delete("/api/orders/:orderNumber", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSeller) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { orderNumber } = req.params;
    const order = await storage.getOrder(orderNumber);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow deletion of orders that have been uploaded
    if (!order.hasUploaded) {
      return res.status(400).json({ message: "Cannot delete orders that haven't been uploaded yet" });
    }

    await storage.deleteOrder(orderNumber);
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}