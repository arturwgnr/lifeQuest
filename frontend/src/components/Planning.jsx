import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Route, GripVertical, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useToast, errorToastFor } from "../context/ToastContext.jsx";
import { STATUSES, STATUS_LABELS, STATUS_VISUAL, PRIORITY_LABELS } from "../constants/status.js";
import { playTaskCompleted, playTaskBlocked } from "../utils/soundEffects.js";
import { notifyStatusChange, withStatus } from "../utils/taskFeedback.js";
import TaskDetailModal from "./TaskDetailModal.jsx";
import LevelUpNotification from "./LevelUpNotification.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/Planning.css";

// Tasks that already have a planningOrder sort by it; anything never dragged
// yet falls back to the same "newest first" default the Dashboard uses, and
// sorts after every already-ordered task so it doesn't jump into the middle
// of a sequence the user has already arranged.
function planningComparator(a, b) {
  const aHas = a.planningOrder !== null && a.planningOrder !== undefined;
  const bHas = b.planningOrder !== null && b.planningOrder !== undefined;
  if (aHas && bHas) return a.planningOrder - b.planningOrder;
  if (aHas !== bHas) return aHas ? -1 : 1;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

// Writes a sequence's positions into planningOrder locally, so the new order
// renders immediately (optimistic) while the save runs in the background.
function applyOrder(tasks, orderedIds) {
  const position = new Map(orderedIds.map((id, index) => [id, index]));
  return tasks.map(t => (position.has(t.id) ? { ...t, planningOrder: position.get(t.id) } : t));
}

function PlanningCard({ task, index, total, onStatusChange, onMove, onSelect, isDropTarget, justReordered }) {
  const { getCategoryDisplay } = useCategories();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const config = getCategoryDisplay(task.categoryId);
  const Icon = config.icon;
  const statusTone = STATUS_VISUAL[task.status].tone;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const classes = [
    "planning-card",
    `planning-card--status-${statusTone}`,
    task.status === "DONE" && "planning-card--done",
    isDragging && "planning-card--dragging",
    isDropTarget && "planning-card--drag-over",
    justReordered && "planning-card--drop-success"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={setNodeRef} style={style} className={classes}>
      <div className="planning-card__top">
        <span className="planning-card__index">{index + 1}</span>
        <button type="button" className="planning-card__handle" {...attributes} {...listeners} aria-label="Drag to reorder">
          <GripVertical size={16} />
        </button>
      </div>

      <span className={`planning-card__category planning-card__category--${config.tone}`}>
        <Icon size={13} />
        {config.name}
      </span>

      <button type="button" className="planning-card__title" onClick={() => onSelect(task.id)}>
        {task.title}
      </button>

      <div className="planning-card__tags">
        <span className={`planning-card__priority ${task.priorityType === "MAIN" ? "planning-card__priority--main" : ""}`}>
          {PRIORITY_LABELS[task.priorityType]}
        </span>
        <span className={`planning-card__status planning-card__status--${statusTone}`}>{STATUS_LABELS[task.status]}</span>
      </div>

      <div className="planning-card__footer">
        <select
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value)}
          className="planning-card__status-select"
          aria-label="Change status"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <div className="planning-card__reorder-buttons">
          <button type="button" disabled={index === 0} onClick={() => onMove(task.id, -1)} aria-label="Move earlier in sequence">
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(task.id, 1)}
            aria-label="Move later in sequence"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        <button type="button" className="planning-card__view" onClick={() => onSelect(task.id)} aria-label="View quest detail">
          <Eye size={15} />
        </button>
      </div>
    </div>
  );
}

export default function Planning() {
  const { refresh } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [justReorderedIds, setJustReorderedIds] = useState(new Set());

  // Latest list for callbacks that outlive a render (toast Undo actions)
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  // Saves are serialized by a counter so a slow earlier response can't
  // overwrite the order from a newer move.
  const saveSeqRef = useRef(0);

  const loadTasks = async () => {
    const { tasks: loaded } = await api.tasks.list();
    setTasks(loaded);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await loadTasks();
      } catch (err) {
        errorToastFor(toast, err, "Couldn't load your roadmap");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Done quests sink to the end of the sequence (same "auto-move" behavior as the
  // Dashboard's sunk tasks) instead of being hidden outright once shown.
  const sequence = useMemo(() => {
    const visible = tasks.filter(t => showCompleted || t.status !== "DONE");
    return [...visible].sort((a, b) => {
      const aDone = a.status === "DONE";
      const bDone = b.status === "DONE";
      if (aDone !== bDone) return aDone ? 1 : -1;
      return planningComparator(a, b);
    });
  }, [tasks, showCompleted]);

  // Optimistic reorder: the list is re-sorted locally first and stays
  // rendered while the save runs (overlay pill only, never an empty view).
  // On failure the previous order is restored and an error toast explains it.
  const persistOrder = async (orderedIds, { isUndo = false } = {}) => {
    const snapshot = tasksRef.current;
    const previousIds = sequence.map(t => t.id);
    const seq = ++saveSeqRef.current;

    setTasks(prev => applyOrder(prev, orderedIds));
    setJustReorderedIds(new Set(orderedIds));
    setTimeout(() => setJustReorderedIds(new Set()), 900);
    setIsSaving(true);

    try {
      const { tasks: updated } = await api.tasks.reorder(orderedIds);
      if (seq !== saveSeqRef.current) return;
      setTasks(updated);
      if (isUndo) {
        toast.info("Order restored");
      } else {
        toast.success("Planning order saved", {
          action: { label: "Undo", onClick: () => persistOrder(previousIds, { isUndo: true }) }
        });
      }
    } catch (err) {
      if (seq !== saveSeqRef.current) return;
      setTasks(snapshot);
      errorToastFor(toast, err, "Order couldn't be saved, so it was rolled back");
    } finally {
      if (seq === saveSeqRef.current) setIsSaving(false);
    }
  };

  const handleDragStart = event => setActiveId(event.active.id);
  const handleDragOver = event => setOverId(event.over ? event.over.id : null);

  const handleDragEnd = event => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = sequence.findIndex(t => t.id === active.id);
    const newIndex = sequence.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    persistOrder(arrayMove(sequence, oldIndex, newIndex).map(t => t.id));
  };

  const handleMove = (taskId, direction) => {
    const index = sequence.findIndex(t => t.id === taskId);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= sequence.length) return;
    persistOrder(arrayMove(sequence, index, targetIndex).map(t => t.id));
  };

  const applyStatusChange = async (taskId, status, { silent = false } = {}) => {
    const task = tasksRef.current.find(t => t.id === taskId);
    if (!task || task.status === status) return;
    const previousStatus = task.status;
    setTasks(prev => withStatus(prev, taskId, status));
    try {
      const { leveledUpTo } = await api.tasks.changeStatus(taskId, status);
      await loadTasks();
      if (status === "DONE") refresh();
      if (leveledUpTo) setLevelUp(leveledUpTo);
      if (status === "DONE") playTaskCompleted();
      if (status === "BLOCKED") playTaskBlocked();
      if (!silent) {
        notifyStatusChange(toast, {
          task,
          status,
          onUndo: () => applyStatusChange(taskId, previousStatus, { silent: true })
        });
      }
    } catch (err) {
      setTasks(prev => withStatus(prev, taskId, previousStatus));
      errorToastFor(toast, err, "Status change failed");
    }
  };

  // Mouse and touch are handled by separate sensors (rather than one shared
  // PointerSensor) so a touch drag doesn't fight page scrolling on a phone -
  // a short delay distinguishes "scrolling past this card" from "picking it up".
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  if (isLoading) {
    return (
      <div className="planning__loading">
        <LoadingIndicator variant="panel" size="lg" label="Loading your roadmap..." />
      </div>
    );
  }

  return (
    <div className="planning">
      <div className="planning__header">
        <div className="planning__header-text">
          <h2>
            <Route size={18} />
            Planning Mode
          </h2>
          <p>Drag quests into the order you actually intend to work through them. Your sequence saves automatically.</p>
        </div>
        <label className="planning__toggle">
          <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} />
          Show completed
        </label>
      </div>

      {sequence.length === 0 ? (
        <div className="planning__empty">
          <p>No open quests to sequence yet. Forge a quest from the Dashboard to start building your roadmap.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sequence.map(t => t.id)} strategy={rectSortingStrategy}>
            <div className={`planning__sequence${isSaving ? " planning__sequence--saving" : ""}`} aria-busy={isSaving}>
              {isSaving && <LoadingIndicator variant="overlay" size="sm" label="Saving order…" />}
              {sequence.map((task, index) => (
                <PlanningCard
                  key={task.id}
                  task={task}
                  index={index}
                  total={sequence.length}
                  onStatusChange={applyStatusChange}
                  onMove={handleMove}
                  onSelect={setSelectedTaskId}
                  isDropTarget={overId === task.id && activeId !== task.id}
                  justReordered={justReorderedIds.has(task.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          tasks={tasks}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={loadTasks}
          onDeleted={() => {
            setSelectedTaskId(null);
            loadTasks();
          }}
          onLeveledUp={setLevelUp}
        />
      )}

      {levelUp !== null && <LevelUpNotification level={levelUp} onClose={() => setLevelUp(null)} />}
    </div>
  );
}
