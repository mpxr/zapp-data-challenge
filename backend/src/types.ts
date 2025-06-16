import { z } from "zod";

export interface Env {
  DB: D1Database;
}

export const StockItemSchema = z.object({
  sku: z.string().min(1, "SKU must not be empty"),
  store: z.string().min(1, "Store must not be empty"),
  quantity: z.number().int().min(0, "Quantity must be a non-negative integer"),
  description: z.string().optional(),
});

export type StockItemData = z.infer<typeof StockItemSchema>;
