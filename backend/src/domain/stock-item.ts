import { z } from "zod";
import { Env, StockItemData, StockItemSchema } from "../types";

export const StockItemUpdateSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(0, "Quantity must be a non-negative integer")
    .optional(),
  description: z.string().nullable().optional(),
});
export type StockItemUpdateData = z.infer<typeof StockItemUpdateSchema>;

export class StockItem {
  public readonly sku: string;
  public readonly store: string;
  public quantity: number;
  public description?: string;

  private constructor(props: StockItemData) {
    this.sku = props.sku;
    this.store = props.store;
    this.quantity = props.quantity;
    this.description = props.description;
  }

  public static validateMany(rawDataArray: unknown[]): {
    validatedData?: StockItemData[];
    errors?: { input: unknown; error: z.ZodError }[];
  } {
    const validatedData: StockItemData[] = [];
    const errors: { input: unknown; error: z.ZodError }[] = [];

    for (const rawData of rawDataArray) {
      const validationResult = StockItemSchema.safeParse(rawData);
      if (validationResult.success) {
        validatedData.push(validationResult.data);
      } else {
        errors.push({ input: rawData, error: validationResult.error });
      }
    }

    if (errors.length > 0) {
      return { errors };
    }
    return { validatedData };
  }

  public static async batchInsert(
    itemsData: StockItemData[],
    env: Env
  ): Promise<void> {
    if (itemsData.length === 0) {
      return;
    }
    const statements: D1PreparedStatement[] = itemsData.map((item) =>
      env.DB.prepare(
        `INSERT INTO items (sku, store, quantity, description)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (sku, store) DO UPDATE SET
           quantity = excluded.quantity,
           description = excluded.description`
      ).bind(item.sku, item.store, item.quantity, item.description ?? null)
    );
    await env.DB.batch(statements);
  }

  public static async update(
    store: string,
    sku: string,
    data: StockItemUpdateData,
    env: Env
  ): Promise<boolean | null> {
    const setClauses: string[] = [];
    const bindings: (string | number | null)[] = [];

    if (data.quantity !== undefined) {
      setClauses.push("quantity = ?");
      bindings.push(data.quantity);
    }
    if (data.hasOwnProperty("description")) {
      setClauses.push("description = ?");
      bindings.push(data.description ?? null);
    }

    if (setClauses.length === 0) {
      return null;
    }

    const sql = `UPDATE items SET ${setClauses.join(
      ", "
    )} WHERE store = ? AND sku = ?`;
    bindings.push(store, sku);

    const stmt = env.DB.prepare(sql);
    const result = await stmt.bind(...bindings).run();
    return result.meta.changes > 0;
  }

  public static async delete(
    store: string,
    sku: string,
    env: Env
  ): Promise<boolean> {
    const stmt = env.DB.prepare(
      "DELETE FROM items WHERE store = ? AND sku = ?"
    );
    const result = await stmt.bind(store, sku).run();
    return result.meta.changes > 0;
  }

  public static async getAll(env: Env): Promise<StockItemData[]> {
    const statement = env.DB.prepare(
      "SELECT sku, store, quantity, description FROM items"
    );
    const { results } = await statement.all<StockItemData>();
    return results || [];
  }
}
