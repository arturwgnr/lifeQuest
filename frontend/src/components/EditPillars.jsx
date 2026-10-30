import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Star,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Stamp
} from "lucide-react";
import { api } from "../api/client.js";
import { useToast, errorToastFor } from "../context/ToastContext.jsx";
import { localDateKey, pluralDays } from "../constants/pillars.js";
import { guessStampFromName, resolveStamp } from "../constants/stamps.js";
import LoadingIndicator from "./LoadingIndicator.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import StampBadge from "./StampBadge.jsx";
import StampPicker from "./StampPicker.jsx";
import PillarTitleForm from "./PillarTitleForm.jsx";
import "../styles/EditPillars.css";

const EMPTY_DRAFT = { name: "", stampIcon: null, stampTone: "slate", pillars: [{ title: "" }] };

function draftFromGroup(group) {
  const stamp = resolveStamp(group);
  return { name: group.name, stampIcon: stamp.key, stampTone: stamp.tone, pillars: [] };
}

function entryCount(pillar) {
  return pillar._count?.entries ?? 0;
}

export default function EditPillars() {
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  // { kind: "group" | "pillar", group, pillar? }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addingToGroupId, setAddingToGroupId] = useState(null);
  const [renamingPillarId, setRenamingPillarId] = useState(null);
  const [busyPillarId, setBusyPillarId] = useState(null);

  // Latest groups for rollbacks that run after an await
  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  const loadGroups = async () => {
    const { groups: loaded } = await api.pillars.groups.list();
    setGroups(loaded);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await loadGroups();
      } catch (err) {
        errorToastFor(toast, err, "Couldn't load your pillar groups");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replaceGroup = updated => setGroups(prev => prev.map(g => (g.id === updated.id ? updated : g)));
  const patchGroup = (groupId, fn) => setGroups(prev => prev.map(g => (g.id === groupId ? fn(g) : g)));

  // --- Group create / edit --------------------------------------------------

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

  const handleSaveGroup = async () => {
    const name = draft.name.trim();
    if (!name) {
      setFormError("Give the group a name.");
      return;
    }
    const stampIcon = draft.stampIcon || guessStampFromName(name);
    setFormError("");
    setIsSaving(true);

    if (editingId) {
      // Optimistic: name and stamp change in the list right away
      const snapshot = groupsRef.current;
      const before = snapshot.find(g => g.id === editingId);
      patchGroup(editingId, g => ({ ...g, name, stampIcon, stampTone: draft.stampTone }));
      const id = editingId;
      cancelForm();
      try {
        const { group } = await api.pillars.groups.update(id, { name, stampIcon, stampTone: draft.stampTone });
        replaceGroup(group);
        toast.success(before && before.name !== name ? `Group renamed: ${name}` : `Group updated: ${name}`, {
          description: "Past days now show the new name and stamp too."
        });
      } catch (err) {
        setGroups(snapshot);
        errorToastFor(toast, err, "Group couldn't be updated, so it was restored");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const pillars = draft.pillars.filter(p => p.title.trim());
    try {
      const { group } = await api.pillars.groups.create({ name, stampIcon, stampTone: draft.stampTone, pillars });
      setGroups(prev => [...prev, group]);
      toast.success(`Pillar group created: ${name}`, {
        description: `${pillars.length} pillar${pillars.length === 1 ? "" : "s"}`
      });
      cancelForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async groupId => {
    try {
      const { groups: updated } = await api.pillars.groups.activate(groupId);
      setGroups(updated);
      toast.success(`Active group: ${updated.find(g => g.id === groupId)?.name || "updated"}`);
    } catch (err) {
      errorToastFor(toast, err, "Couldn't switch the active group");
    }
  };

  // --- Single pillars (all optimistic, rolled back on failure) ---------------

  const handleAddPillar = async (group, title) => {
    const tempId = `pending-${Date.now()}`;
    const snapshot = groupsRef.current;
    patchGroup(group.id, g => ({
      ...g,
      pillars: [...g.pillars, { id: tempId, title, order: g.pillars.length, _count: { entries: 0 }, isPending: true }]
    }));
    setAddingToGroupId(null);
    setBusyPillarId(tempId);
    try {
      const { pillar } = await api.pillars.items.add(group.id, { title });
      patchGroup(group.id, g => ({ ...g, pillars: g.pillars.map(p => (p.id === tempId ? pillar : p)) }));
      toast.success(`Pillar added: ${title}`, {
        description: `Counts in ${group.name} from today on. Past days keep their score.`
      });
    } catch (err) {
      setGroups(snapshot);
      setAddingToGroupId(group.id);
      errorToastFor(toast, err, "Pillar couldn't be added");
    } finally {
      setBusyPillarId(null);
    }
  };

  const handleRenamePillar = async (group, pillar, title) => {
    const snapshot = groupsRef.current;
    patchGroup(group.id, g => ({ ...g, pillars: g.pillars.map(p => (p.id === pillar.id ? { ...p, title } : p)) }));
    setRenamingPillarId(null);
    setBusyPillarId(pillar.id);
    try {
      const { group: updated } = await api.pillars.items.update(pillar.id, { title });
      replaceGroup(updated);
      toast.success(`Pillar renamed: ${title}`, {
        description: `Was "${pillar.title}". Past days show the new name.`
      });
    } catch (err) {
      setGroups(snapshot);
      errorToastFor(toast, err, "Pillar couldn't be renamed, so it was restored");
    } finally {
      setBusyPillarId(null);
    }
  };

  const handleMovePillar = async (group, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= group.pillars.length) return;
    const snapshot = groupsRef.current;
    const pillar = group.pillars[index];
    const reordered = [...group.pillars];
    reordered.splice(index, 1);
    reordered.splice(target, 0, pillar);
    patchGroup(group.id, g => ({ ...g, pillars: reordered }));
    setBusyPillarId(pillar.id);
    try {
      const { group: updated } = await api.pillars.items.update(pillar.id, { order: target });
      replaceGroup(updated);
    } catch (err) {
      setGroups(snapshot);
      errorToastFor(toast, err, "Order couldn't be saved, so it was rolled back");
    } finally {
      setBusyPillarId(null);
    }
  };

  // --- Deletes (confirmed in a modal, no Undo) -------------------------------

  const confirmDelete = async () => {
    if (!pendingDelete || isDeleting) return;
    const { kind, group, pillar } = pendingDelete;
    const snapshot = groupsRef.current;
    setIsDeleting(true);

    if (kind === "pillar") {
      patchGroup(group.id, g => ({ ...g, pillars: g.pillars.filter(p => p.id !== pillar.id) }));
      setPendingDelete(null);
      try {
        const { group: updated } = await api.pillars.items.remove(pillar.id, localDateKey());
        replaceGroup(updated);
        toast.info(`Pillar deleted: ${pillar.title}`, {
          description: `Removed from ${group.name}. Past days keep their score.`
        });
      } catch (err) {
        setGroups(snapshot);
        errorToastFor(toast, err, "Pillar couldn't be deleted, so it was restored");
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    setGroups(prev => prev.filter(g => g.id !== group.id));
    setPendingDelete(null);
    try {
      const { groups: updated } = await api.pillars.groups.remove(group.id);
      setGroups(updated);
      const nextActive = group.isActive ? updated.find(g => g.isActive) : null;
      toast.info(`Pillar group deleted: ${group.name}`, {
        description: nextActive
          ? `${nextActive.name} is now your active group.`
          : "Days reported with it stay on your calendar."
      });
    } catch (err) {
      setGroups(snapshot);
      errorToastFor(toast, err, "Group couldn't be deleted, so it was restored");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="edit-pillars__loading">
        <LoadingIndicator variant="panel" size="lg" label="Loading your Pillar Groups..." />
      </div>
    );
  }

  const isOnlyGroup = groups.length <= 1;

  return (
    <div className="edit-pillars">
      <div className="edit-pillars__header">
        <Link to="/app/pillars" className="edit-pillars__back">
          <ArrowLeft size={14} />
          Back to Pillars
        </Link>
        <h2>Edit Pillars</h2>
        <p className="edit-pillars__intro">
          Each group is a day type with its own stamp on the calendar. Add, rename, reorder or delete pillars any time:
          days you already reported keep the score they were saved with.
        </p>
      </div>

      <div className="edit-pillars__list">
        {groups.map(group => {
          if (editingId === group.id) {
            return (
              <GroupForm
                key={group.id}
                mode="edit"
                draft={draft}
                setDraft={setDraft}
                onCancel={cancelForm}
                onSave={handleSaveGroup}
                isSaving={isSaving}
                error={formError}
              />
            );
          }

          const stamp = resolveStamp(group);
          const logCount = group._count?.logs ?? 0;

          return (
            <div key={group.id} className="edit-pillars__row">
              <div className="edit-pillars__row-top">
                <span className="edit-pillars__name">
                  <StampBadge {...group} size="sm" title={`Stamp: ${stamp.label}`} />
                  <span className="edit-pillars__name-text">{group.name}</span>
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
                    <button type="button" onClick={() => handleActivate(group.id)} title="Set as active group" aria-label={`Set ${group.name} as active group`}>
                      <Star size={14} />
                    </button>
                  )}
                  <button type="button" onClick={() => startEdit(group)} title="Edit name and stamp" aria-label={`Edit ${group.name}`}>
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete({ kind: "group", group })}
                    disabled={isOnlyGroup}
                    title={isOnlyGroup ? "Create another group before deleting your only one" : "Delete group"}
                    aria-label={`Delete group ${group.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="edit-pillars__meta">{logCount === 0 ? "No days reported yet" : pluralDays(logCount)}</p>

              {stamp.isGuessed && (
                <button type="button" className="edit-pillars__nudge" onClick={() => startEdit(group)}>
                  <Stamp size={13} />
                  Pick a stamp so this day type is easy to spot on the calendar
                </button>
              )}

              {group.pillars.length === 0 ? (
                <p className="edit-pillars__empty">
                  No pillars in this group yet. Add one below so days of this type have something to check off.
                </p>
              ) : (
                <ul className="edit-pillars__pillar-list">
                  {group.pillars.map((p, index) => (
                    <li key={p.id} className={`edit-pillars__pillar${p.isPending ? " edit-pillars__pillar--pending" : ""}`}>
                      {renamingPillarId === p.id ? (
                        <PillarTitleForm
                          initialTitle={p.title}
                          submitLabel="Rename"
                          onSubmit={title => handleRenamePillar(group, p, title)}
                          onCancel={() => setRenamingPillarId(null)}
                        />
                      ) : (
                        <>
                          <span className="edit-pillars__pillar-title">{p.title}</span>
                          {busyPillarId === p.id ? (
                            <LoadingIndicator size="sm" label="Saving..." />
                          ) : (
                            <span className="edit-pillars__pillar-count">{entryCount(p) > 0 ? pluralDays(entryCount(p)) : "new"}</span>
                          )}
                          <div className="edit-pillars__pillar-actions">
                            <button
                              type="button"
                              onClick={() => handleMovePillar(group, index, -1)}
                              disabled={index === 0 || p.isPending || Boolean(busyPillarId)}
                              aria-label={`Move ${p.title} up`}
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePillar(group, index, 1)}
                              disabled={index === group.pillars.length - 1 || p.isPending || Boolean(busyPillarId)}
                              aria-label={`Move ${p.title} down`}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingPillarId(p.id)}
                              disabled={p.isPending}
                              aria-label={`Rename ${p.title}`}
                              title="Rename"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className="edit-pillars__pillar-delete"
                              onClick={() => setPendingDelete({ kind: "pillar", group, pillar: p })}
                              disabled={p.isPending}
                              aria-label={`Delete ${p.title}`}
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {addingToGroupId === group.id ? (
                <div className="edit-pillars__add-pillar-form">
                  <PillarTitleForm
                    placeholder="New pillar title"
                    submitLabel="Add"
                    onSubmit={title => handleAddPillar(group, title)}
                    onCancel={() => setAddingToGroupId(null)}
                  />
                </div>
              ) : (
                <button type="button" className="edit-pillars__add-row" onClick={() => setAddingToGroupId(group.id)}>
                  <Plus size={13} />
                  Add pillar
                </button>
              )}
            </div>
          );
        })}

        {isAdding ? (
          <GroupForm
            mode="create"
            draft={draft}
            setDraft={setDraft}
            onCancel={cancelForm}
            onSave={handleSaveGroup}
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

      {pendingDelete && (
        <ConfirmModal
          title={pendingDelete.kind === "pillar" ? "Delete this pillar?" : "Delete this pillar group?"}
          message={<DeleteMessage pending={pendingDelete} groups={groups} />}
          confirmLabel={pendingDelete.kind === "pillar" ? "Delete pillar" : "Delete group"}
          isProcessing={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function DeleteMessage({ pending, groups }) {
  const { kind, group, pillar } = pending;

  if (kind === "pillar") {
    const count = entryCount(pillar);
    const isLast = group.pillars.length === 1;
    return (
      <>
        <p>
          <strong>{pillar.title}</strong> in {group.name}
        </p>
        <p>{count > 0 ? `This pillar has ${pluralDays(count)}.` : "This pillar has no logged days yet."}</p>
        <p>
          Its check marks are removed. Days you already reported keep the score they were saved with, and from today on it
          no longer counts toward {group.name}'s total.
        </p>
        {isLast && (
          <p className="confirm-modal__note">
            This is the last pillar in {group.name}, so the group will be empty until you add a new one.
          </p>
        )}
        <p>This cannot be undone.</p>
      </>
    );
  }

  const count = group._count?.logs ?? 0;
  const nextActive = group.isActive ? groups.find(g => g.id !== group.id) : null;
  return (
    <>
      <p>
        <strong>{group.name}</strong> with {group.pillars.length} pillar{group.pillars.length === 1 ? "" : "s"}
      </p>
      <p>{count > 0 ? `This day type has ${pluralDays(count)}.` : "This day type has no logged days yet."}</p>
      <p>
        Its pillars and their check marks are removed. Days reported with it stay on your calendar with their saved
        score, marked as a deleted day type.
      </p>
      {nextActive && <p className="confirm-modal__note">It's your active group, so {nextActive.name} becomes active.</p>}
      <p>This cannot be undone.</p>
    </>
  );
}

// Create: name, stamp and the starting pillars. Edit: name and stamp only,
// since pillars are added, renamed and deleted inline in the group row.
function GroupForm({ mode, draft, setDraft, onCancel, onSave, isSaving, error }) {
  const previewStamp = resolveStamp({ ...draft, name: draft.name });

  const updatePillarTitle = (index, value) =>
    setDraft(d => ({ ...d, pillars: d.pillars.map((p, i) => (i === index ? { ...p, title: value } : p)) }));
  const addPillarRow = () => setDraft(d => ({ ...d, pillars: [...d.pillars, { title: "" }] }));
  const removePillarRow = index => setDraft(d => ({ ...d, pillars: d.pillars.filter((_, i) => i !== index) }));

  const handleKeyDown = e => {
    if (e.key === "Escape" && !isSaving) {
      e.preventDefault();
      onCancel();
    }
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <div className="edit-pillars__form" onKeyDown={handleKeyDown}>
      <div className="edit-pillars__name-field">
        <StampBadge stampIcon={previewStamp.key} stampTone={draft.stampTone} size="lg" title={`Stamp preview: ${previewStamp.label}`} />
        <input
          type="text"
          placeholder="Group name, e.g. Day off or Worked day"
          aria-label="Group name"
          value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          autoFocus
        />
      </div>

      <div className="edit-pillars__field">
        <span className="edit-pillars__field-label">Stamp</span>
        <StampPicker
          stampIcon={previewStamp.key}
          stampTone={draft.stampTone}
          onChange={stamp => setDraft(d => ({ ...d, ...stamp }))}
        />
      </div>

      {mode === "create" && (
        <div className="edit-pillars__field">
          <span className="edit-pillars__field-label">Pillars</span>
          <div className="edit-pillars__pillar-rows">
            {draft.pillars.map((p, index) => (
              <div key={index} className="edit-pillars__pillar-row">
                <input
                  type="text"
                  placeholder="Pillar title"
                  aria-label={`Pillar ${index + 1}`}
                  value={p.title}
                  onChange={e => updatePillarTitle(index, e.target.value)}
                />
                <button type="button" onClick={() => removePillarRow(index)} aria-label="Remove pillar">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="edit-pillars__add-row" onClick={addPillarRow}>
            <Plus size={13} />
            Add pillar
          </button>
        </div>
      )}

      {error && <p className="edit-pillars__error">{error}</p>}

      <div className="edit-pillars__row-actions edit-pillars__form-actions">
        <button type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="button" className="edit-pillars__save" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <LoadingIndicator size="sm" tone="light" label="Saving..." />
          ) : (
            <>
              <Check size={14} />
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
