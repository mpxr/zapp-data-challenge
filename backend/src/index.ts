import { Env } from "./types";
import { StockItem, StockItemUpdateSchema } from "./domain/stock-item";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/items") {
      return handleInsertItems(request, env);
    } else if (
      request.method === "DELETE" &&
      url.pathname.startsWith("/api/items/")
    ) {
      return handleDeleteItem(url, env);
    } else if (
      request.method === "PUT" &&
      url.pathname.startsWith("/api/items/")
    ) {
      return handleUpdateItem(url, request, env);
    } else if (request.method === "GET" && url.pathname === "/api/items") {
      return handleGetItems(env);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

function parseStoreAndSkuFromUrl(url: URL): {
  store?: string;
  sku?: string;
  errorResponse?: Response;
} {
  const pathParts = url.pathname.split("/");
  // Expected path: /api/items/{store}/{sku} which results in ['', 'api', 'items', store, sku]
  if (
    pathParts.length !== 5 ||
    pathParts[0] !== "" ||
    pathParts[1] !== "api" ||
    pathParts[2] !== "items"
  ) {
    return {
      errorResponse: new Response(
        "Invalid URL format. Expected /api/items/{store}/{sku}",
        { status: 400 }
      ),
    };
  }

  const store = pathParts[3];
  const sku = pathParts[4];

  if (!store || !sku) {
    return {
      errorResponse: new Response("Missing store or SKU in URL parameters", {
        status: 400,
      }),
    };
  }
  return { store, sku };
}

async function handleInsertItems(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const rawBody = await request.json();
    const itemsToValidate = Array.isArray(rawBody) ? rawBody : [rawBody];

    if (itemsToValidate.length === 0) {
      return new Response("No items were provided for creation", {
        status: 400,
      });
    }

    const { validatedData, errors } = StockItem.validateMany(itemsToValidate);

    if (errors && errors.length > 0) {
      const errorDetails = errors.map((err) => ({
        input: err.input,
        issues: err.error.flatten(),
      }));
      return new Response(
        JSON.stringify({
          message: "Validation failed",
          details: errorDetails,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await StockItem.batchInsert(validatedData!, env);

    return new Response(null, {
      status: 201,
    });
  } catch (err) {
    console.error("Error processing insert request:", err);
    return new Response(null, {
      status: 500,
    });
  }
}

async function handleGetItems(env: Env): Promise<Response> {
  try {
    const items = await StockItem.getAll(env);
    return new Response(JSON.stringify(items), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Error fetching items:", err);
    return new Response(null, {
      status: 500,
    });
  }
}

async function handleDeleteItem(url: URL, env: Env): Promise<Response> {
  const { store, sku, errorResponse } = parseStoreAndSkuFromUrl(url);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const result = await StockItem.delete(store!, sku!, env);

    if (!result) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Error processing delete request:", err);
    return new Response(null, {
      status: 500,
    });
  }
}

async function handleUpdateItem(
  url: URL,
  request: Request,
  env: Env
): Promise<Response> {
  const { store, sku, errorResponse } = parseStoreAndSkuFromUrl(url);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const validationResult = StockItemUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid item data for update",
          details: validationResult.error.flatten(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await StockItem.update(
      store!,
      sku!,
      validationResult.data,
      env
    );

    if (result === null) {
      return new Response(JSON.stringify({ message: "No fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!result) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Error processing update request:", err);
    return new Response(null, {
      status: 500,
    });
  }
}
