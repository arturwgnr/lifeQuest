import { AlertTriangle, Clock, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { useCategories } from "../context/CategoriesContext.jsx";
import { PRIORITY_LABELS } from "../constants/status.js";
import "../styles/AttentionToday.css";

const MAX_VISIBLE = 4;

function AttentionCard({ task, config, onTaskSelect, onQuickComplete }) {
  const CategoryIcon = config.icon;

  return (
    <div className={`attention-card ${task.overdue ? "attention-card--overdue" : "attention-card--stagnant"}`}>
      <div>
        <div className="attention-card__top">
          <span className={`attention-card__category attention-card__category--${config.tone}`}>
            <CategoryIcon size={14} />
            {config.name}
          </span>

          {task.overdue ? (
            <span className="attention-card__flag attention-card__flag--overdue">
              <Clock size={12} />
              {task.daysOverdue} {task.daysOverdue === 1 ? "DAY" : "DAYS"} OVERDUE
            </span>
          ) : (
            <span className="attention-card__flag attention-card__flag--stagnant">
              <AlertTriangle size={12} />
              STAGNANT
            </span>
          )}
        </div>

        <h3 className="attention-card__title">{task.title}</h3>

        <div className="attention-card__reasons">
          {task.overdue && task.dueDate && (
            <span className="attention-card__reason attention-card__reason--overdue">
              Due date passed on{" "}
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {task.stagnant && (
            <span className="attention-card__reason attention-card__reason--stagnant">
              Stuck in this state for {task.daysStagnant} days without movement
            </span>
          )}
          <span className="attention-card__notes">{task.notes || "No context notes logged."}</span>
        </div>
      </div>

      <div className="attention-card__footer">
        <div className="attention-card__meta">
          <span className="attention-card__xp">+{task.xpValue} XP</span>
          <span>{PRIORITY_LABELS[task.priorityType]} Quest</span>
        </div>

        <div className="attention-card__actions">
          <button type="button" className="attention-card__details" onClick={() => onTaskSelect(task.id)}>
            Details
            <ChevronRight size={12} />
          </button>
          <button
            type="button"
            className={`attention-card__complete ${task.overdue ? "attention-card__complete--overdue" : ""}`}
            onClick={() => onQuickComplete(task.id)}
          >
            Mark Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttentionToday({ tasks, onTaskSelect, onQuickComplete }) {
  const { getCategoryDisplay } = useCategories();
  const attentionTasks = tasks.filter(t => t.status !== "DONE" && t.needsAttention);

  if (attentionTasks.length === 0) {
    return (
      <div className="attention-today attention-today--clear">
        <div className="attention-today__clear-icon">
          <CheckCircle2 size={24} />
        </div>
        <h3>Clear Horizon</h3>
        <p>No quests are currently overdue or stagnant. You are maintaining an active and structured pace.</p>
      </div>
    );
  }

  // Most-overdue-first, then stagnant-only tasks by longest stuck. Only the
  // first 4 render in the main grid; anything past that moves into a carousel
  // instead of growing the dashboard unbounded.
  const sorted = [...attentionTasks].sort((a, b) => {
    if (a.overdue && b.overdue) return b.daysOverdue - a.daysOverdue;
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return b.daysStagnant - a.daysStagnant;
  });

  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.slice(MAX_VISIBLE);

  return (
    <div className="attention-today">
      <div className="attention-today__header">
        <h2>
          <AlertCircle size={16} />
          Requires Active Attention Today
        </h2>
        <span className="attention-today__count">
          {attentionTasks.length} {attentionTasks.length === 1 ? "issue" : "issues"} flagged
        </span>
      </div>

      <div className="attention-today__grid">
        {visible.map(task => (
          <AttentionCard
            key={task.id}
            task={task}
            config={getCategoryDisplay(task.categoryId)}
            onTaskSelect={onTaskSelect}
            onQuickComplete={onQuickComplete}
          />
        ))}
      </div>

      {overflow.length > 0 && (
        <div className="attention-today__carousel-wrap">
          <span className="attention-today__carousel-label">
            {overflow.length} more {overflow.length === 1 ? "issue" : "issues"} &mdash; scroll to review
          </span>
          <div className="attention-today__carousel">
            {overflow.map(task => (
              <div className="attention-today__carousel-item" key={task.id}>
                <AttentionCard
                  task={task}
                  config={getCategoryDisplay(task.categoryId)}
                  onTaskSelect={onTaskSelect}
                  onQuickComplete={onQuickComplete}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
