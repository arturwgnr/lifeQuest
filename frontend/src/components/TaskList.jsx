import { useState } from "react";
import { ChevronDown, ChevronRight, Eye, CornerDownRight, CalendarPlus, Circle, Loader2, Ban, CheckCircle2 } from "lucide-react";
import { useCategories } from "../context/CategoriesContext.jsx";
import { STATUSES, STATUS_LABELS, STATUS_VISUAL } from "../constants/status.js";
import "../styles/TaskList.css";

function formatCreatedDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const STATUS_ICON = {
  TODO: Circle,
  IN_PROGRESS: Loader2,
  BLOCKED: Ban,
  DONE: CheckCircle2
};

function StatusMarker({ status }) {
  const Icon = STATUS_ICON[status];
  const tone = STATUS_VISUAL[status].tone;
  return (
    <span className={`status-marker status-marker--${tone}`}>
      <Icon size={11} className={status === "IN_PROGRESS" ? "status-marker__spin" : ""} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// Warns BEFORE a deadline is missed (0-5 days out); the overdue badge above
// takes over once it's actually passed, so the two never show at once.
function daysUntilDue(task) {
  if (!task.dueDate || task.status === "DONE" || task.overdue) return null;
  const diffMs = new Date(task.dueDate).getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 && days <= 5 ? days : null;
}

function TaskBadges({ task }) {
  const dueSoon = daysUntilDue(task);
  return (
    <>
      {task.overdue && <span className="task-badge task-badge--overdue">Overdue</span>}
      {task.stagnant && <span className="task-badge task-badge--stagnant">Stagnant ({task.daysStagnant}d)</span>}
      {dueSoon !== null && (
        <span className="task-badge task-badge--due-soon">
          {dueSoon === 0 ? "Due today" : `${dueSoon} ${dueSoon === 1 ? "day" : "days"} remaining`}
        </span>
      )}
    </>
  );
}

export default function TaskList({ tasks, filteredTasks, onTaskSelect, onStatusChange, onQuickComplete }) {
  const { getCategoryDisplay } = useCategories();
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = id => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const rootTasks = filteredTasks.filter(t => !t.parentTaskId);
  const parentsOfVisibleChildren = filteredTasks
    .filter(t => t.parentTaskId)
    .map(t => tasks.find(p => p.id === t.parentTaskId))
    .filter(Boolean);

  const visibleRoots = Array.from(new Map([...rootTasks, ...parentsOfVisibleChildren].map(t => [t.id, t])).values()).sort(
    (a, b) => {
      if (a.priorityType === "MAIN" && b.priorityType !== "MAIN") return -1;
      if (a.priorityType !== "MAIN" && b.priorityType === "MAIN") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  );

  if (visibleRoots.length === 0) {
    return (
      <div className="task-list__empty">
        <p>No quests match your selected parameters.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {visibleRoots.map(rootTask => {
        const subtasks = tasks.filter(t => t.parentTaskId === rootTask.id);
        const hasSubtasks = subtasks.length > 0;
        const visibleSubtasks = filteredTasks.filter(t => t.parentTaskId === rootTask.id);
        const isCollapsed = collapsed[rootTask.id] || false;
        const chain = rootTask.chain || { completed: 0, total: 0, percent: 0 };
        const config = getCategoryDisplay(rootTask.categoryId);
        const Icon = config.icon;

        const statusTone = STATUS_VISUAL[rootTask.status].tone;
        const isMainChain = rootTask.priorityType === "MAIN";

        return (
          <div key={rootTask.id} className={`task-root ${isMainChain ? "task-root--main" : ""}`}>
            <div
              className={`task-root__row task-root__row--status-${statusTone} ${
                rootTask.status === "DONE" ? "task-root__row--done" : ""
              }`}
            >
              <div className="task-root__main">
                <div className="task-root__gutter">
                  {hasSubtasks ? (
                    <button type="button" className="task-root__collapse" onClick={() => toggleCollapse(rootTask.id)}>
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                  ) : (
                    <span className="task-root__spacer" />
                  )}
                  <span className={`task-root__icon task-root__icon--${config.tone}`}>
                    <Icon size={16} />
                  </span>
                </div>

                <div className="task-root__text">
                  <div className="task-root__tags">
                    <StatusMarker status={rootTask.status} />
                    <span className={`task-root__priority ${isMainChain ? "task-root__priority--main" : ""}`}>
                      {rootTask.priorityType}
                    </span>
                    <span className="task-root__category">{config.name}</span>
                    {hasSubtasks && (
                      <span className="task-root__chain">
                        Chain: {chain.completed}/{chain.total} Complete ({chain.percent}%)
                      </span>
                    )}
                    <TaskBadges task={rootTask} />
                  </div>

                  <h3 className={`task-root__title ${rootTask.status === "DONE" ? "task-root__title--done" : ""}`}>
                    {rootTask.title}
                  </h3>

                  {rootTask.notes && <p className="task-root__notes">{rootTask.notes}</p>}

                  <span className="task-root__created">
                    <CalendarPlus size={11} />
                    Created {formatCreatedDate(rootTask.createdAt)}
                  </span>

                  {hasSubtasks && !isCollapsed && (
                    <div className="task-root__progress-track">
                      <div className="task-root__progress-fill" style={{ width: `${chain.percent}%` }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="task-root__actions">
                <span className="task-root__xp">+{rootTask.xpValue} XP</span>

                <select
                  value={rootTask.status}
                  onChange={e => onStatusChange(rootTask.id, e.target.value)}
                  className="task-root__status-select"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>

                <button type="button" className="task-root__view" onClick={() => onTaskSelect(rootTask.id)} title="Inspect quest detail">
                  <Eye size={16} />
                </button>

                {rootTask.status !== "DONE" && (
                  <button type="button" className="task-root__complete" onClick={() => onQuickComplete(rootTask.id)}>
                    Complete
                  </button>
                )}
              </div>
            </div>

            {hasSubtasks && !isCollapsed && visibleSubtasks.length > 0 && (
              <div className="task-subtasks">
                {visibleSubtasks.map(subtask => {
                  const subConfig = getCategoryDisplay(subtask.categoryId);
                  const SubIcon = subConfig.icon;
                  const subStatusTone = STATUS_VISUAL[subtask.status].tone;

                  return (
                    <div
                      key={subtask.id}
                      className={`task-sub task-sub--status-${subStatusTone} ${
                        subtask.status === "DONE" ? "task-sub--done" : ""
                      }`}
                    >
                      <div className="task-sub__main">
                        <CornerDownRight size={16} className="task-sub__corner" />
                        <span className={`task-sub__icon task-sub__icon--${subConfig.tone}`}>
                          <SubIcon size={12} />
                        </span>
                        <div className="task-sub__text">
                          <div className="task-sub__tags">
                            <StatusMarker status={subtask.status} />
                            <span className="task-sub__priority">{subtask.priorityType}</span>
                            <TaskBadges task={subtask} />
                          </div>
                          <h4 className={`task-sub__title ${subtask.status === "DONE" ? "task-sub__title--done" : ""}`}>
                            {subtask.title}
                          </h4>
                          {subtask.notes && <p className="task-sub__notes">{subtask.notes}</p>}
                          <span className="task-sub__created">
                            <CalendarPlus size={10} />
                            Created {formatCreatedDate(subtask.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="task-sub__actions">
                        <span className="task-sub__xp">+{subtask.xpValue} XP</span>
                        <select
                          value={subtask.status}
                          onChange={e => onStatusChange(subtask.id, e.target.value)}
                          className="task-sub__status-select"
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="task-sub__view" onClick={() => onTaskSelect(subtask.id)}>
                          <Eye size={14} />
                        </button>
                        {subtask.status !== "DONE" && (
                          <button type="button" className="task-sub__complete" onClick={() => onQuickComplete(subtask.id)}>
                            Done
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
