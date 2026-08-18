import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Star, CheckCircle2 } from "lucide-react";
import { api } from "../api/client.js";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/EditPillars.css";

const EMPTY_DRAFT = { name: "", pillars: [{ title: "" }] };

function draftFromGroup(group) {
  return { name: group.name, pillars: group.pillars.map(p => ({ id: p.id, title: p.title })) };
}

export default function EditPillars() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadGroups = async () => {
    const { groups: loaded } = await api.pillars.groups.list();
    setGroups(loaded);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadGroups();
      setIsLoading(false);
    })();
  }, []);

  const startAdd = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setFormError("");
    setIsAdding(true);
  };

  const startEdit = group => {
    setDraft(draftFromGroup(group));
    setEditingId(group.id);
    setFormError("");
    setIsAdding(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError("");
  };

  const updatePillarTitle = (index, value) => {
    setDraft(d => ({ ...d, pillars: d.pillars.map((p, i) => (i === index ? { ...p, title: value } : p)) }));
  };

  const addPillarRow = () => setDraft(d => ({ ...d, pillars: [...d.pillars, { title: "" }] }));

  const removePillarRow = index => setDraft(d => ({ ...d, pillars: d.pillars.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    const pillars = draft.pillars.filter(p => p.title.trim());
    setFormError("");
    setIsSaving(true);
    try {
      if (editingId) {
        await api.pillars.groups.update(editingId, { name: draft.name, pillars });
      } else {
        await api.pillars.groups.create({ name: draft.name, pillars });
      }
      await loadGroups();
      cancelForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = group => {
    setPendingDeleteId(group.id);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    setDeleteError("");
    try {
      await api.pillars.groups.remove(pendingDeleteId);
      setPendingDeleteId(null);
      await loadGroups();
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  const handleActivate = async groupId => {
    const { groups: updated } = await api.pillars.groups.activate(groupId);
    setGroups(updated);
  };

  if (isLoading) {
    return (
      <div className="edit-pillars__loading">
        <LoadingIndicator variant="panel" size="lg" label="Loading your Pillar Groups..." />
      </div>
    );
  }

  return (
    <div className="edit-pillars">
      <div className="edit-pillars__header">
        <Link to="/app/pillars" className="edit-pillars__back">
          <ArrowLeft size={14} />
          Back to Pillars
        </Link>
        <h2>Edit Pillars</h2>
      </div>

      <div className="edit-pillars__list">
        {groups.map(group => {
          const isEditingThis = editingId === group.id;
          const isPendingDelete = pendingDeleteId === group.id;

          if (isPendingDelete) {
            return (
              <div key={group.id} className="edit-pillars__row edit-pillars__row--danger">
                <p>
                  Delete <strong>{group.name}</strong>? This only works if the group has no daily report history yet.
                </p>
                {deleteError && <p className="edit-pillars__error">{deleteError}</p>}
                <div className="edit-pillars__row-actions">
                  <button type="button" onClick={() => setPendingDeleteId(null)}>
                    Cancel
                  </button>
                  <button type="button" className="edit-pillars__confirm-delete" onClick={confirmDelete}>
                    Confirm Delete
                  </button>
                </div>
              </div>
            );
          }

          if (isEditingThis) {
            return (
              <GroupForm
                key={group.id}
                draft={draft}
                setDraft={setDraft}
                onUpdateTitle={updatePillarTitle}
                onAddRow={addPillarRow}
                onRemoveRow={removePillarRow}
                onCancel={cancelForm}
                onSave={handleSave}
                isSaving={isSaving}
                error={formError}
              />
            );
          }

          return (
            <div key={group.id} className="edit-pillars__row">
              <div className="edit-pillars__row-top">
                <span className="edit-pillars__name">
                  {group.name}
                  {group.isDefault && <span className="edit-pillars__badge">Default</span>}
                  {group.isActive && (
                    <span className="edit-pillars__badge edit-pillars__badge--active">
                      <CheckCircle2 size={11} />
                      Active
                    </span>
                  )}
                </span>
                <div className="edit-pillars__row-actions">
                  {!group.isActive && (
                    <button type="button" onClick={() => handleActivate(group.id)} title="Set as active group">
                      <Star size={14} />
                    </button>
                  )}
                  <button type="button" onClick={() => startEdit(group)} title="Edit group">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => requestDelete(group)} title="Delete group">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <ul className="edit-pillars__pillar-list">
                {group.pillars.map(p => (
                  <li key={p.id}>{p.title}</li>
                ))}
              </ul>
            </div>
          );
        })}

        {isAdding ? (
          <GroupForm
            draft={draft}
            setDraft={setDraft}
            onUpdateTitle={updatePillarTitle}
            onAddRow={addPillarRow}
            onRemoveRow={removePillarRow}
            onCancel={cancelForm}
            onSave={handleSave}
            isSaving={isSaving}
            error={formError}
          />
        ) : (
          <button type="button" className="edit-pillars__add" onClick={startAdd}>
            <Plus size={14} />
            Add Pillar Group
          </button>
        )}
      </div>
    </div>
  );
}

function GroupForm({ draft, setDraft, onUpdateTitle, onAddRow, onRemoveRow, onCancel, onSave, isSaving, error }) {
  return (
    <div className="edit-pillars__form">
      <input
        type="text"
        placeholder="Group name"
        value={draft.name}
        onChange={e => setDraft({ ...draft, name: e.target.value })}
        autoFocus
      />

      <div className="edit-pillars__pillar-rows">
        {draft.pillars.map((p, index) => (
          <div key={index} className="edit-pillars__pillar-row">
            <input
              type="text"
              placeholder="Pillar title"
              value={p.title}
              onChange={e => onUpdateTitle(index, e.target.value)}
            />
            <button type="button" onClick={() => onRemoveRow(index)} aria-label="Remove pillar">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="edit-pillars__add-row" onClick={onAddRow}>
        <Plus size={13} />
        Add Pillar
      </button>

      {error && <p className="edit-pillars__error">{error}</p>}

      <div className="edit-pillars__row-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="edit-pillars__save" onClick={onSave} disabled={isSaving}>
          <Check size={14} />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
