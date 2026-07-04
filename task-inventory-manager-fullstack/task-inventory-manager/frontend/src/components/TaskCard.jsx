const STATUS_COLOR = {
  todo: "var(--ink-muted)",
  in_progress: "var(--accent-amber-dark)",
  done: "var(--accent-teal-dark)",
};

const STATUS_LABEL = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_LABEL = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function TaskCard({ task, canEdit, canDelete, onEdit, onDelete, onCycleStatus }) {
  return (
    <div
      className="card task-card tag-row"
      style={{ "--tag-color": STATUS_COLOR[task.status] }}
    >
      <div className="task-card-main">
        <div className="task-card-title-row">
          <h3>{task.title}</h3>
          <span className={`priority-chip priority-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
        </div>
        {task.description && <p className="task-card-desc">{task.description}</p>}
        <div className="task-card-meta">
          <button
            className="status-pill"
            style={{ color: STATUS_COLOR[task.status] }}
            onClick={() => onCycleStatus(task)}
            title="Click to advance status"
          >
            ● {STATUS_LABEL[task.status]}
          </button>
          {task.due_date && (
            <span className="mono task-due">Due {new Date(task.due_date).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {(canEdit || canDelete) && (
        <div className="task-card-actions">
          {canEdit && (
            <button className="btn btn-ghost" onClick={() => onEdit(task)}>
              Edit
            </button>
          )}
          {canDelete && (
            <button className="btn btn-danger" onClick={() => onDelete(task)}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
