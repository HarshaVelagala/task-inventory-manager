import { useEffect, useState } from "react";
import { taskApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import Modal from "../components/Modal";
import "../styles/tasks.css";

const STATUS_CYCLE = { todo: "in_progress", in_progress: "done", done: "todo" };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalTask, setModalTask] = useState(null); // null = closed, {} = new, {...} = edit
  const [error, setError] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const { data } = await taskApi.list(statusFilter || undefined);
      setTasks(data);
    } catch {
      setError("Couldn't load tasks. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleSave(payload) {
    if (modalTask?.id) {
      await taskApi.update(modalTask.id, payload);
    } else {
      await taskApi.create(payload);
    }
    setModalTask(null);
    loadTasks();
  }

  async function handleDelete(task) {
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    await taskApi.remove(task.id);
    loadTasks();
  }

  async function handleCycleStatus(task) {
    const nextStatus = STATUS_CYCLE[task.status];
    await taskApi.update(task.id, { status: nextStatus });
    loadTasks();
  }

  function canEdit(task) {
    return user.role !== "user" || task.owner_id === user.id || task.assigned_to === user.id;
  }
  function canDelete(task) {
    return user.role !== "user" || task.owner_id === user.id;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Manifest / Tasks</div>
          <h1>Task board</h1>
        </div>
        <button className="btn btn-accent" onClick={() => setModalTask({})}>
          + New task
        </button>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <strong>No tasks here yet</strong>
          Create your first task to start tracking work.
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canEdit(task)}
              canDelete={canDelete(task)}
              onEdit={setModalTask}
              onDelete={handleDelete}
              onCycleStatus={handleCycleStatus}
            />
          ))}
        </div>
      )}

      {modalTask && (
        <Modal title={modalTask.id ? "Edit task" : "New task"} onClose={() => setModalTask(null)}>
          <TaskForm initial={modalTask} onSubmit={handleSave} onCancel={() => setModalTask(null)} />
        </Modal>
      )}
    </div>
  );
}
