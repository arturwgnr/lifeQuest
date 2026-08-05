import { useEffect, useMemo, useState } from "react";
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Route, GripVertical, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { STATUSES, STATUS_LABELS, STATUS_VISUAL, PRIORITY_LABELS } from "../constants/status.js";
import { playTaskCompleted, playTaskBlocked } from "../utils/soundEffects.js";
import TaskDetailModal from "./TaskDetailModal.jsx";
import LevelUpNotification from "./LevelUpNotification.jsx";
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

function PlanningCard({ task, index, total, onStatusChange, onMove, onSelect }) {
  const { getCategoryDisplay } = useCategories();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const config = getCategoryDisplay(task.categoryId);
  const Icon = config.icon;
  const statusTone = STATUS_VISUAL[task.status].tone;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`planning-card ${task.status === "DONE" ? "planning-card--done" : ""} ${isDragging ? "planning-card--dragging" : ""}`}
    >
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
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadTasks = async () => {
    const { tasks: loaded } = await api.tasks.list();
    setTasks(loaded);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadTasks();
      setIsLoading(false);
    })();
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

  const persistOrder = async orderedIds => {
    setIsSaving(true);
    try {
      const { tasks: updated } = await api.tasks.reorder(orderedIds);
      setTasks(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = event => {
    const { active, over } = event;
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

  const applyStatusChange = async (taskId, status) => {
    const { leveledUpTo } = await api.tasks.changeStatus(taskId, status);
    await loadTasks();
    if (status === "DONE") await refresh();
    if (leveledUpTo) setLevelUp(leveledUpTo);
    if (status === "DONE") playTaskCompleted();
    if (status === "BLOCKED") playTaskBlocked();
  };

  // Mouse and touch are handled by separate sensors (rather than one shared
  // PointerSensor) so a touch drag doesn't fight page scrolling on a phone -
  // a short delay distinguishes "scrolling past this card" from "picking it up".
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  if (isLoading) return <div className="planning__loading">Loading your roadmap...</div>;

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

      {isSaving && <span className="planning__saving">Saving order…</span>}

      {sequence.length === 0 ? (
        <div className="planning__empty">
          <p>No open quests to sequence yet. Forge a quest from the Dashboard to start building your roadmap.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sequence.map(t => t.id)} strategy={rectSortingStrategy}>
            <div className="planning__sequence">
              {sequence.map((task, index) => (
                <PlanningCard
                  key={task.id}
                  task={task}
                  index={index}
                  total={sequence.length}
                  onStatusChange={applyStatusChange}
                  onMove={handleMove}
                  onSelect={setSelectedTaskId}
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
