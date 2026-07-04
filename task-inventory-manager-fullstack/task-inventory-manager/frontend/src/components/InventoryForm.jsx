import { useState } from "react";

const emptyForm = {
  name: "",
  sku: "",
  category: "general",
  quantity: 0,
  unit_price: 0,
  reorder_level: 10,
};

export default function InventoryForm({ initial, isEdit, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        unit_price: Number(form.unit_price),
        reorder_level: Number(form.reorder_level),
      };
      if (isEdit) delete payload.sku; // SKU is immutable after creation
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't save this item.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="name">Item name</label>
        <input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required autoFocus />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="sku">SKU</label>
          <input
            id="sku"
            value={form.sku}
            onChange={(e) => update("sku", e.target.value)}
            required
            disabled={isEdit}
          />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <input id="category" value={form.category} onChange={(e) => update("category", e.target.value)} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="unit_price">Unit price ($)</label>
          <input
            id="unit_price"
            type="number"
            min="0"
            step="0.01"
            value={form.unit_price}
            onChange={(e) => update("unit_price", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="reorder_level">Reorder level</label>
        <input
          id="reorder_level"
          type="number"
          min="0"
          value={form.reorder_level}
          onChange={(e) => update("reorder_level", e.target.value)}
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save item"}
        </button>
      </div>
    </form>
  );
}
