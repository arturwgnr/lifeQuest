import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useCategories } from "../context/CategoriesContext.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/AddTaskModal.css";

const DEFAULT_XP = { MAIN: 60, SIDE: 25 };

// quickAdd: opens on the fast path (title + category only), with a
// "More options" toggle that reveals the rest of the same form.
export default function AddTaskModal({ rootTasks, onClose, onCreate, quickAdd = false, subtitle }) {
  const { categories, getCategoryDisplay } = useCategories();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priorityType, setPriorityType] = useState("SIDE");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(!quickAdd);

  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  // Esc cancels from anywhere in the form (Enter submits natively)
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!title.trim() || !categoryId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        title,
        categoryId,
        priorityType,
        notes,
        dueDate: dueDate || null,
        parentTaskId: parentTaskId || null,
        xpValue: DEFAULT_XP[priorityType]
      });
      onClose();
    } catch {
      // The parent already surfaced the error as a toast; keep the form open
      // with everything the user typed so they can retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="add-task-modal" role="dialog" aria-modal="true" aria-labelledby="add-task-modal-title">
        <div className="add-task-modal__header">
          <div>
            <h3 id="add-task-modal-title">Forge New Quest</h3>
            {subtitle && <p className="add-task-modal__subtitle">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-task-modal__form">
          <div className="add-task-modal__field">
            <label htmlFor="add-task-title">Title</label>
            <input
              id="add-task-title"
              type="text"
              required
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Audit monthly savings budget"
            />
          </div>

          <div className="add-task-modal__grid">
            <div className="add-task-modal__field">
              <label htmlFor="add-task-category">Category</label>
              <select id="add-task-category" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {showMore && (
              <div className="add-task-modal__field">
                <label htmlFor="add-task-priority">Priority</label>
                <select id="add-task-priority" value={priorityType} onChange={e => setPriorityType(e.target.value)}>
                  <option value="MAIN">Main Quest (60 XP)</option>
                  <option value="SIDE">Side Quest (25 XP)</option>
                </select>
              </div>
            )}
          </div>

          {showMore ? (
            <>
              <div className="add-task-modal__grid">
                <div className="add-task-modal__field">
                  <label htmlFor="add-task-due">Due Date (Optional)</label>
                  <input id="add-task-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div className="add-task-modal__field">
                  <label htmlFor="add-task-parent">Chain Parent (Optional)</label>
                  <select id="add-task-parent" value={parentTaskId} onChange={e => setParentTaskId(e.target.value)}>
                    <option value="">-- Standalone (No Chain) --</option>
                    {rootTasks.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({getCategoryDisplay(p.categoryId).name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="add-task-modal__field">
                <label htmlFor="add-task-notes">Notes / Description</label>
                <textarea
                  id="add-task-notes"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional context..."
                />
              </div>
            </>
          ) : (
            <button type="button" className="add-task-modal__more" onClick={() => setShowMore(true)} aria-expanded="false">
              <ChevronDown size={14} />
              More options
              <span>priority, due date, chain, notes</span>
            </button>
          )}

          <div className="add-task-modal__footer">
            <button type="button" className="add-task-modal__cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="add-task-modal__submit btn-lift" disabled={isSubmitting}>
              {isSubmitting ? <LoadingIndicator size="sm" tone="light" label="Forging..." /> : "Confirm Forge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
