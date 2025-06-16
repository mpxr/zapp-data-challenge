CREATE TABLE IF NOT EXISTS items (
    sku TEXT NOT NULL,
    store TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    description TEXT,
    PRIMARY KEY (sku, store)
);