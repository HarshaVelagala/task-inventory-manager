import { useState } from "react";

const emptyForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: "",
};

export default function TaskForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...initial,
    due_date: initial?.due_date ? initial.due_date.slice(0, 10) : "",
  }));
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
      await onSubmit({
        ...form,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't save this task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} required autoFocus />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" value={form.priority} onChange={(e) => update("priority", e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="due_date">Due date</label>
        <input
          id="due_date"
          type="date"
          value={form.due_date}
          onChange={(e) => update("due_date", e.target.value)}
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save task"}
        </button>
      </div>
    </form>
  );
}
