import { useEffect, useState } from "react";
import { Calendar, CalendarPlus, Clock, GitPullRequest, LayoutList, MessageSquare, Save, X, Trash2 } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { STATUSES, STATUS_LABELS, PRIORITY_LABELS } from "../constants/status.js";
import "../styles/TaskDetailModal.css";

function computeTimeline(statusHistory) {
  const events = [];
  for (let i = 0; i < statusHistory.length; i++) {
    const current = statusHistory[i];
    const next = statusHistory[i + 1];
    const start = new Date(current.changedAt);
    const end = next ? new Date(next.changedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let durationText;
    if (diffDays > 0) durationText = `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
    else if (diffHours > 0) durationText = `${diffHours} ${diffHours === 1 ? "hour" : "hours"}`;
    else durationText = "less than an hour";

    events.push({
      status: current.status,
      changedAt: current.changedAt,
      durationText: next ? `Sat in this state for ${durationText}` : `Active in this state for ${durationText} (Current)`
    });
  }
  return events.reverse();
}

function statusPillClass(status) {
  if (status === "DONE") return "status-pill status-pill--done";
  if (status === "BLOCKED") return "status-pill status-pill--blocked";
  if (status === "IN_PROGRESS") return "status-pill status-pill--progress";
  return "status-pill status-pill--todo";
}

export default function TaskDetailModal({ task, tasks, onClose, onUpdated, onDeleted, onLeveledUp }) {
  const { refresh } = useAuth();
  const { categories, getCategoryDisplay } = useCategories();
  const [detail, setDetail] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [categoryId, setCategoryId] = useState(task.categoryId);
  const [priorityType, setPriorityType] = useState(task.priorityType);
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.notes || "");
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [parentTaskId, setParentTaskId] = useState(task.parentTaskId || "");

  useEffect(() => {
    let cancelled = false;
    api.tasks.get(task.id).then(({ task: full }) => {
      if (!cancelled) setDetail(full);
    });
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  const potentialParents = tasks.filter(t => t.id !== task.id && !t.parentTaskId);
  const parentTask = task.parentTaskId ? tasks.find(t => t.id === task.parentTaskId) : null;
  const siblings = task.parentTaskId ? tasks.filter(t => t.parentTaskId === task.parentTaskId && t.id !== task.id) : [];
  const subTasks = tasks.filter(t => t.parentTaskId === task.id);
  const isPartOfChain = Boolean(parentTask) || subTasks.length > 0;

  const config = getCategoryDisplay(task.categoryId);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { task: updated, leveledUpTo } = await api.tasks.update(task.id, {
        title,
        categoryId,
        priorityType,
        notes,
        dueDate: dueDate || null,
        parentTaskId: parentTaskId || null,
        status
      });
      onUpdated(updated);
      if (updated.status === "DONE") await refresh();
      if (leveledUpTo) onLeveledUp(leveledUpTo);
      const { task: full } = await api.tasks.get(task.id);
      setDetail(full);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const resetEditFields = () => {
    setTitle(task.title);
    setCategoryId(task.categoryId);
    setPriorityType(task.priorityType);
    setStatus(task.status);
    setNotes(task.notes || "");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setParentTaskId(task.parentTaskId || "");
  };

  const handleCancelEdit = () => {
    resetEditFields();
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await api.tasks.remove(task.id);
    onDeleted(task.id);
  };

  const timelineEvents = detail ? computeTimeline(detail.statusHistory) : [];

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="task-detail-modal">
        <div className="task-detail-modal__header">
          <div className="task-detail-modal__header-title">
            <LayoutList size={16} />
            <h2>Quest Log Detail</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="task-detail-modal__body">
          {!isEditing ? (
            <div className="task-detail-modal__summary">
              <div className="task-detail-modal__badges">
                <span className={`task-detail-modal__category task-detail-modal__category--${config.tone}`}>
                  {config.name}
                </span>
                <span className="task-detail-modal__priority">{PRIORITY_LABELS[task.priorityType]} Priority</span>
                <span className={statusPillClass(task.status)}>{STATUS_LABELS[task.status]}</span>
                <span className="task-detail-modal__xp">Reward: +{task.xpValue} XP</span>
              </div>

              <h1 className="task-detail-modal__title">{task.title}</h1>

              <div className="task-detail-modal__created">
                <CalendarPlus size={13} />
                Created on <strong>{new Date(task.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</strong>
              </div>

              {task.dueDate && (
                <div className="task-detail-modal__due">
                  <Calendar size={14} />
                  Due Date: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong>
                </div>
              )}

              {task.notes ? (
                <div className="task-detail-modal__notes-box">
                  <div className="task-detail-modal__notes-heading">
                    <MessageSquare size={14} />
                    Quest Context &amp; Notes
                  </div>
                  <p>{task.notes}</p>
                </div>
              ) : (
                <p className="task-detail-modal__no-notes">No notes logged for this quest.</p>
              )}
            </div>
          ) : (
            <div className="task-detail-modal__form">
              <div className="task-detail-modal__field">
                <label>Quest Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="task-detail-modal__grid">
                <div className="task-detail-modal__field">
                  <label>Category</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="task-detail-modal__field">
                  <label>Priority</label>
                  <select value={priorityType} onChange={e => setPriorityType(e.target.value)}>
                    <option value="MAIN">Main Quest</option>
                    <option value="SIDE">Side Quest</option>
                  </select>
                </div>
              </div>

              <div className="task-detail-modal__grid">
                <div className="task-detail-modal__field">
                  <label>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="task-detail-modal__field">
                  <label>Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="task-detail-modal__field">
                <label>Assign to Quest Chain</label>
                <select value={parentTaskId} onChange={e => setParentTaskId(e.target.value)}>
                  <option value="">-- No Chain (Standalone Quest) --</option>
                  {potentialParents.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({getCategoryDisplay(p.categoryId).name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="task-detail-modal__field">
                <label>Quest Notes / Context</label>
                <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          {isPartOfChain && (
            <div className="task-detail-modal__chain-map">
              <div className="task-detail-modal__chain-heading">
                <GitPullRequest size={16} />
                Quest Chain Tree Map
              </div>

              <div className="task-detail-modal__chain-tree">
                {parentTask ? (
                  <div className="task-detail-modal__chain-node">
                    <span className="task-detail-modal__chain-eyebrow">Parent Chain Goal</span>
                    <h4>{parentTask.title}</h4>
                  </div>
                ) : (
                  <div className="task-detail-modal__chain-node task-detail-modal__chain-node--self">
                    <span className="task-detail-modal__chain-eyebrow task-detail-modal__chain-eyebrow--active">
                      Parent Quest (This Task)
                    </span>
                    <h4>{title}</h4>
                  </div>
                )}

                <div className="task-detail-modal__chain-children">
                  {siblings.map(sib => (
                    <div key={sib.id} className="task-detail-modal__chain-item">
                      <span>{sib.title}</span>
                      <span className="task-detail-modal__chain-status">{STATUS_LABELS[sib.status]}</span>
                    </div>
                  ))}

                  {parentTask && (
                    <div className="task-detail-modal__chain-item task-detail-modal__chain-item--active">
                      <span>
                        {title} <em>(Active Node)</em>
                      </span>
                      <span className="task-detail-modal__chain-status task-detail-modal__chain-status--active">
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                  )}

                  {subTasks.map(child => (
                    <div key={child.id} className="task-detail-modal__chain-item">
                      <span>{child.title}</span>
                      <span className="task-detail-modal__chain-status">{STATUS_LABELS[child.status]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="task-detail-modal__timeline">
            <div className="task-detail-modal__timeline-heading">
              <Clock size={16} />
              Procrastination &amp; Status Logs
            </div>

            <div className="task-detail-modal__timeline-box">
              {timelineEvents.map((event, idx) => (
                <div key={idx} className="task-detail-modal__timeline-event">
                  <span className={statusPillClass(event.status)}>{STATUS_LABELS[event.status]}</span>
                  <div>
                    <p className="task-detail-modal__timeline-duration">{event.durationText}</p>
                    <p className="task-detail-modal__timeline-date">{new Date(event.changedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {timelineEvents.length === 0 && <p className="task-detail-modal__timeline-empty">Loading history...</p>}
            </div>
          </div>
        </div>

        <div className="task-detail-modal__footer">
          <button type="button" className="task-detail-modal__delete" onClick={handleDelete}>
            <Trash2 size={16} />
            Abandon Quest
          </button>

          <div className="task-detail-modal__footer-actions">
            {!isEditing ? (
              <>
                <button type="button" className="task-detail-modal__secondary" onClick={() => setIsEditing(true)}>
                  Edit Quest
                </button>
                <button type="button" className="task-detail-modal__primary" onClick={onClose}>
                  Close
                </button>
              </>
            ) : (
              <>
                <button type="button" className="task-detail-modal__secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="button" className="task-detail-modal__primary" onClick={handleSave} disabled={isSaving}>
                  <Save size={14} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
