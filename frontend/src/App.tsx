import { useState, useEffect } from "react";
import CsvUploader from "./components/CsvUploader";
import "./App.css";

interface StockItem {
  sku: string;
  store: string;
  quantity: number;
  description?: string;
}

function App() {
  const [items, setItems] = useState<StockItem[]>([]);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        console.error("Failed to fetch items");
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUploadSuccess = () => {
    fetchItems();
  };

  const handleDelete = async (store: string, sku: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete item ${sku} from store ${store}?`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/items/${store}/${sku}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchItems();
      } else {
        const errorText = await response.text();
        console.error("Failed to delete item:", response.status, errorText);
        alert(`Failed to delete item: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(
        `Error deleting item: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleEdit = async (item: StockItem) => {
    const newQuantityStr = prompt(
      "Enter new quantity:",
      item.quantity.toString()
    );
    if (newQuantityStr === null) return;

    const newQuantity = +newQuantityStr;
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert("Invalid quantity. Please enter a non-negative number.");
      return;
    }

    const newDescription = prompt(
      "Enter new description (optional):",
      item.description || ""
    );

    const updateData: { quantity: number; description?: string | null } = {
      quantity: newQuantity,
      ...(newDescription !== null && { description: newDescription }),
    };

    try {
      const response = await fetch(`/api/items/${item.store}/${item.sku}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        fetchItems();
      } else {
        const errorText = await response.text();
        console.error("Failed to update item:", response.status, errorText);
        alert(`Failed to update item: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating item:", error);
      alert(
        `Error updating item: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <>
      <CsvUploader onUploadSuccess={handleUploadSuccess} />
      <h2>Stock Items</h2>
      {items.length === 0 ? (
        <p>No items to display.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Store</th>
              <th>Quantity</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.store}-${item.sku}`}>
                <td>{item.sku}</td>
                <td>{item.store}</td>
                <td>{item.quantity}</td>
                <td>{item.description || ""}</td>
                <td>
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.store, item.sku)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default App;
