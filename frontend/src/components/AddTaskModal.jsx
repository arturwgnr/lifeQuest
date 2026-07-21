import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCategories } from "../context/CategoriesContext.jsx";
import "../styles/AddTaskModal.css";

const DEFAULT_XP = { MAIN: 60, SIDE: 25 };

export default function AddTaskModal({ rootTasks, onClose, onCreate }) {
  const { categories, getCategoryDisplay } = useCategories();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priorityType, setPriorityType] = useState("SIDE");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="add-task-modal">
        <div className="add-task-modal__header">
          <h3>Forge New Quest</h3>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-task-modal__form">
          <div className="add-task-modal__field">
            <label>Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Audit monthly savings budget"
            />
          </div>

          <div className="add-task-modal__grid">
            <div className="add-task-modal__field">
              <label>Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="add-task-modal__field">
              <label>Priority</label>
              <select value={priorityType} onChange={e => setPriorityType(e.target.value)}>
                <option value="MAIN">Main Quest (60 XP)</option>
                <option value="SIDE">Side Quest (25 XP)</option>
              </select>
            </div>
          </div>

          <div className="add-task-modal__grid">
            <div className="add-task-modal__field">
              <label>Due Date (Optional)</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="add-task-modal__field">
              <label>Chain Parent (Optional)</label>
              <select value={parentTaskId} onChange={e => setParentTaskId(e.target.value)}>
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
            <label>Notes / Description</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional context..." />
          </div>

          <div className="add-task-modal__footer">
            <button type="button" className="add-task-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-task-modal__submit" disabled={isSubmitting}>
              {isSubmitting ? "Forging..." : "Confirm Forge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
