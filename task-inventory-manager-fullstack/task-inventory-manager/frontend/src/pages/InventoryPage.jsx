import { useEffect, useState } from "react";
import { inventoryApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import InventoryRow from "../components/InventoryRow";
import InventoryForm from "../components/InventoryForm";
import Modal from "../components/Modal";
import "../styles/inventory.css";

export default function InventoryPage() {
  const { user } = useAuth();
  const canManage = user.role === "admin" || user.role === "manager";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const { data } = lowStockOnly ? await inventoryApi.lowStock() : await inventoryApi.list();
      setItems(data);
    } catch {
      setError("Couldn't load inventory. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly]);

  async function handleSave(payload) {
    if (modalItem?.id) {
      await inventoryApi.update(modalItem.id, payload);
    } else {
      await inventoryApi.create(payload);
    }
    setModalItem(null);
    loadItems();
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    await inventoryApi.remove(item.id);
    loadItems();
  }

  async function handleAdjust(item, delta) {
    try {
      await inventoryApi.adjustStock(item.id, delta);
      loadItems();
    } catch (err) {
      alert(err.response?.data?.detail || "Couldn't adjust stock.");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Manifest / Inventory</div>
          <h1>Stock ledger</h1>
        </div>
        {canManage && (
          <button className="btn btn-accent" onClick={() => setModalItem({})}>
            + New item
          </button>
        )}
      </div>

      <div className="toolbar">
        <label className="checkbox-toggle">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading inventory…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <strong>Nothing on the shelf</strong>
          {lowStockOnly ? "No items are currently low on stock." : "Add your first inventory item to get started."}
        </div>
      ) : (
        <div className="card inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Unit price</th>
                <th>Quantity</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <InventoryRow
                  key={item.id}
                  item={item}
                  canManage={canManage}
                  onEdit={setModalItem}
                  onDelete={handleDelete}
                  onAdjust={handleAdjust}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalItem && (
        <Modal title={modalItem.id ? "Edit item" : "New item"} onClose={() => setModalItem(null)}>
          <InventoryForm
            initial={modalItem}
            isEdit={Boolean(modalItem.id)}
            onSubmit={handleSave}
            onCancel={() => setModalItem(null)}
          />
        </Modal>
      )}
    </div>
  );
}
