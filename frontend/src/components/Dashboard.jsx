import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Compass, Plus, Trash2, ArrowUpDown, Route } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useToast, errorToastFor } from "../context/ToastContext.jsx";
import { STATUSES, STATUS_LABELS } from "../constants/status.js";
import { DEFAULT_SORT, SORT_OPTIONS } from "../constants/sort.js";
import { playTaskCompleted, playTaskBlocked } from "../utils/soundEffects.js";
import { notifyStatusChange, withStatus } from "../utils/taskFeedback.js";
import AttentionToday from "./AttentionToday.jsx";
import TaskList from "./TaskList.jsx";
import AddTaskModal from "./AddTaskModal.jsx";
import TaskDetailModal from "./TaskDetailModal.jsx";
import LevelUpNotification from "./LevelUpNotification.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { refresh } = useAuth();
  const { categories } = useCategories();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [showDeleteCompletedConfirm, setShowDeleteCompletedConfirm] = useState(false);
  const [isDeletingCompleted, setIsDeletingCompleted] = useState(false);

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);

  // Latest list for callbacks that outlive a render (toast Undo actions)
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

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
        errorToastFor(toast, err, "Couldn't load your quests");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "View" actions elsewhere (e.g. an approved Oracle quest) land here with
  // the task to open; the state is cleared so a refresh doesn't reopen it.
  useEffect(() => {
    const openTaskId = location.state?.openTaskId;
    if (!openTaskId || isLoading) return;
    if (tasks.some(t => t.id === openTaskId)) setSelectedTaskId(openTaskId);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, isLoading, tasks, navigate, location.pathname]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const matchesCategory =
          filterCategory === "All" || t.categoryId === filterCategory;
        const matchesPriority =
          filterPriority === "All" || t.priorityType === filterPriority;
        const matchesStatus =
          filterStatus === "All" || t.status === filterStatus;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          t.title.toLowerCase().includes(q) ||
          (t.notes || "").toLowerCase().includes(q);
        return (
          matchesCategory && matchesPriority && matchesStatus && matchesSearch
        );
      }),
    [tasks, filterCategory, filterPriority, filterStatus, searchQuery],
  );

  // A single task's own status/fields aren't enough to keep chain progress correct on its
  // parent (and siblings), so every mutation reloads the full list from the server instead
  // of patching one row in place.
  //
  // The changed row is patched optimistically first so the select/badge never
  // snaps back while the request is in flight; failure rolls it back.
  const applyStatusChange = async (taskId, status, { silent = false } = {}) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    const previousStatus = task.status;
    setTasks((prev) => withStatus(prev, taskId, status));
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
          onUndo: () => applyStatusChange(taskId, previousStatus, { silent: true }),
        });
      }
    } catch (err) {
      setTasks((prev) => withStatus(prev, taskId, previousStatus));
      errorToastFor(toast, err, "Status change failed");
    }
  };

  const handleQuickComplete = (taskId) => applyStatusChange(taskId, "DONE");

  // Undo is a real delete of the quest that was just created - nothing else
  // can depend on it yet, so this is safe to offer.
  const handleCreateTask = async (payload) => {
    try {
      const { task: created } = await api.tasks.create(payload);
      await loadTasks();
      toast.success(`Quest forged: ${created.title}`, {
        description: `${created.priorityType === "MAIN" ? "Main" : "Side"} quest · +${created.xpValue} XP on completion`,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await api.tasks.remove(created.id);
              await loadTasks();
              toast.info("Quest removed", { description: created.title });
            } catch (err) {
              errorToastFor(toast, err, "Couldn't undo");
            }
          },
        },
      });
    } catch (err) {
      errorToastFor(toast, err, "Quest couldn't be created");
      throw err;
    }
  };

  const handleTaskUpdated = async () => {
    await loadTasks();
  };

  const handleTaskDeleted = async (taskId) => {
    await loadTasks();
    setSelectedTaskId(null);
  };

  const handleDeleteCompleted = async () => {
    setIsDeletingCompleted(true);
    try {
      const { deletedCount } = await api.tasks.removeCompleted();
      await loadTasks();
      toast.success(`Deleted ${deletedCount} completed quest${deletedCount === 1 ? "" : "s"}`);
    } catch (err) {
      errorToastFor(toast, err, "Couldn't delete completed quests");
    } finally {
      setIsDeletingCompleted(false);
      setShowDeleteCompletedConfirm(false);
    }
  };

  const rootTasks = tasks.filter((t) => !t.parentTaskId);
  const activeCount = tasks.filter((t) => t.status !== "DONE").length;
  const completedCount = tasks.filter((t) => t.status === "DONE").length;
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  if (isLoading)
    return (
      <div className="dashboard__loading">
        <LoadingIndicator variant="panel" size="lg" label="Loading your quest log..." />
      </div>
    );

  return (
    <div className="dashboard">
      <div className="dashboard__page-header">
        <div className="dashboard__page-title">
          <h2>Dashboard</h2>
          <span className="dashboard__active-badge">{activeCount} Active</span>
        </div>
        <div className="dashboard__page-actions">
          <div className="dashboard__priority-toggle">
            {["All", "MAIN", "SIDE"].map((p) => (
              <button
                key={p}
                type="button"
                className={
                  filterPriority === p
                    ? "dashboard__priority-toggle-btn--active"
                    : ""
                }
                onClick={() => setFilterPriority(p)}
              >
                {p === "All" ? "All" : p === "MAIN" ? "Main" : "Side"}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="dashboard__planning-button"
            onClick={() => navigate("/app/planning")}
          >
            <Route size={14} />
            Planning Mode
          </button>
          <button
            type="button"
            className="dashboard__add-button btn-lift"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={14} />
            Forge Quest
          </button>
        </div>
      </div>

      <div className="dashboard__content">
        <AttentionToday
          tasks={tasks}
          onTaskSelect={setSelectedTaskId}
          onQuickComplete={handleQuickComplete}
        />

        <div className="dashboard__filters-panel">
          <div className="dashboard__filters-heading">
            <div className="dashboard__filters-heading-text">
              <h3>
                <Compass size={16} />
                Quest Log &amp; Activity
              </h3>
              <p>
                You have <strong>{activeCount}</strong> unresolved quests.
                Align filters below to review.
              </p>
            </div>
            <div className="dashboard__filters-heading-actions">
              <div className="dashboard__sort-control">
                <label htmlFor="dashboard-sort">
                  <ArrowUpDown size={12} />
                  Sort By
                </label>
                <select
                  id="dashboard-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {completedCount > 0 && (
                <button
                  type="button"
                  className="dashboard__delete-completed"
                  onClick={() => setShowDeleteCompletedConfirm(true)}
                >
                  <Trash2 size={13} />
                  Delete Completed ({completedCount})
                </button>
              )}
            </div>
          </div>

          <div className="dashboard__filters-grid">
            <div>
              <label>Search Keywords</label>
              <input
                type="text"
                placeholder="Search titles, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label>Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Quest Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="MAIN">Main Quests Only</option>
                <option value="SIDE">Side Quests Only</option>
              </select>
            </div>
            <div>
              <label>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <TaskList
          tasks={tasks}
          filteredTasks={filteredTasks}
          sortBy={sortBy}
          onTaskSelect={setSelectedTaskId}
          onStatusChange={applyStatusChange}
          onQuickComplete={handleQuickComplete}
        />
      </div>

      {showAddModal && (
        <AddTaskModal
          rootTasks={rootTasks}
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          tasks={tasks}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          onLeveledUp={setLevelUp}
        />
      )}

      {levelUp !== null && (
        <LevelUpNotification level={levelUp} onClose={() => setLevelUp(null)} />
      )}

      {showDeleteCompletedConfirm && (
        <ConfirmModal
          title="Delete all completed quests?"
          message={`${completedCount} completed quest${completedCount === 1 ? "" : "s"} will be permanently deleted. This action cannot be undone.`}
          confirmLabel="Delete Completed"
          isProcessing={isDeletingCompleted}
          onConfirm={handleDeleteCompleted}
          onCancel={() => setShowDeleteCompletedConfirm(false)}
        />
      )}
    </div>
  );
}
