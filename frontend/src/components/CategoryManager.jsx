import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useCategories } from "../context/CategoriesContext.jsx";
import { ICON_OPTIONS, getIconComponent } from "../constants/icons.js";
import { TONE_OPTIONS } from "../constants/tones.js";
import "../styles/CategoryManager.css";

const EMPTY_DRAFT = { name: "", icon: ICON_OPTIONS[0], tone: TONE_OPTIONS[0].key };

function IconIn({ icon }) {
  const Icon = getIconComponent(icon);
  return <Icon size={16} />;
}

export default function CategoryManager() {
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [reassignToId, setReassignToId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startAdd = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = category => {
    setDraft({ name: category.name, icon: category.icon, tone: category.tone });
    setEditingId(category.id);
    setIsAdding(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, draft);
      } else {
        await createCategory(draft);
      }
      cancelForm();
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = category => {
    setPendingDeleteId(category.id);
    setReassignToId("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    setDeleteError("");
    try {
      await deleteCategory(pendingDeleteId, reassignToId || undefined);
      setPendingDeleteId(null);
    } catch (err) {
      if (err.status === 409) {
        setDeleteError(
          `This category is used by ${err.data.taskCount} task(s)${
            err.data.suggestionCount ? ` and ${err.data.suggestionCount} pending suggestion(s)` : ""
          }. Choose a category to move them to before deleting.`
        );
      } else {
        setDeleteError(err.message);
      }
    }
  };

  const otherCategories = categories.filter(c => c.id !== pendingDeleteId);

  return (
    <div className="category-manager">
      <div className="category-manager__header">
        <h3>Categories</h3>
        <button type="button" className="category-manager__add" onClick={startAdd}>
          <Plus size={14} />
          Add Category
        </button>
      </div>

      <div className="category-manager__list">
        {categories.map(category => {
          const isEditingThis = editingId === category.id;
          const isPendingDelete = pendingDeleteId === category.id;

          if (isPendingDelete) {
            return (
              <div key={category.id} className="category-manager__row category-manager__row--danger">
                <div className="category-manager__delete-prompt">
                  <p>
                    Delete <strong>{category.name}</strong>? {otherCategories.length > 0 && "Reassign its tasks first:"}
                  </p>
                  {otherCategories.length > 0 && (
                    <select value={reassignToId} onChange={e => setReassignToId(e.target.value)}>
                      <option value="">-- No reassignment needed --</option>
                      {otherCategories.map(c => (
                        <option key={c.id} value={c.id}>
                          Move tasks to {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {deleteError && <p className="category-manager__error">{deleteError}</p>}
                  <div className="category-manager__row-actions">
                    <button type="button" onClick={() => setPendingDeleteId(null)}>
                      Cancel
                    </button>
                    <button type="button" className="category-manager__confirm-delete" onClick={confirmDelete}>
                      Confirm Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (isEditingThis) {
            return (
              <CategoryForm
                key={category.id}
                draft={draft}
                setDraft={setDraft}
                onCancel={cancelForm}
                onSave={handleSave}
                isSaving={isSaving}
              />
            );
          }

          return (
            <div key={category.id} className="category-manager__row">
              <span className={`category-manager__badge category-manager__badge--${category.tone}`}>
                <IconIn icon={category.icon} />
              </span>
              <span className="category-manager__name">{category.name}</span>
              <div className="category-manager__row-actions">
                <button type="button" onClick={() => startEdit(category)} title="Edit category">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => requestDelete(category)} title="Delete category">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {isAdding && (
          <CategoryForm draft={draft} setDraft={setDraft} onCancel={cancelForm} onSave={handleSave} isSaving={isSaving} />
        )}
      </div>
    </div>
  );
}

function CategoryForm({ draft, setDraft, onCancel, onSave, isSaving }) {
  return (
    <div className="category-manager__form">
      <input
        type="text"
        placeholder="Category name"
        value={draft.name}
        onChange={e => setDraft({ ...draft, name: e.target.value })}
        autoFocus
      />

      <div className="category-manager__icon-grid">
        {ICON_OPTIONS.map(iconKey => {
          const Icon = getIconComponent(iconKey);
          return (
            <button
              key={iconKey}
              type="button"
              className={`category-manager__icon-option ${draft.icon === iconKey ? "category-manager__icon-option--active" : ""}`}
              onClick={() => setDraft({ ...draft, icon: iconKey })}
            >
              <Icon size={15} />
            </button>
          );
        })}
      </div>

      <div className="category-manager__tone-grid">
        {TONE_OPTIONS.map(tone => (
          <button
            key={tone.key}
            type="button"
            className={`category-manager__tone-option ${draft.tone === tone.key ? "category-manager__tone-option--active" : ""}`}
            style={{ background: tone.swatch }}
            onClick={() => setDraft({ ...draft, tone: tone.key })}
            title={tone.label}
          />
        ))}
      </div>

      <div className="category-manager__row-actions">
        <button type="button" onClick={onCancel}>
          <X size={14} />
          Cancel
        </button>
        <button type="button" className="category-manager__confirm-delete category-manager__save" onClick={onSave} disabled={isSaving}>
          <Check size={14} />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
