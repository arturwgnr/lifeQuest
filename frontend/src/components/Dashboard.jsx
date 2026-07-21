import { useEffect, useMemo, useState } from "react";
import { Compass, Plus } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { STATUSES, STATUS_LABELS } from "../constants/status.js";
import AttentionToday from "./AttentionToday.jsx";
import TaskList from "./TaskList.jsx";
import AddTaskModal from "./AddTaskModal.jsx";
import TaskDetailModal from "./TaskDetailModal.jsx";
import LevelUpNotification from "./LevelUpNotification.jsx";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { refresh } = useAuth();
  const { categories } = useCategories();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [levelUp, setLevelUp] = useState(null);

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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
  const applyStatusChange = async (taskId, status) => {
    const { leveledUpTo } = await api.tasks.changeStatus(taskId, status);
    await loadTasks();
    if (status === "DONE") await refresh();
    if (leveledUpTo) setLevelUp(leveledUpTo);
  };

  const handleQuickComplete = (taskId) => applyStatusChange(taskId, "DONE");

  const handleCreateTask = async (payload) => {
    await api.tasks.create(payload);
    await loadTasks();
  };

  const handleTaskUpdated = async () => {
    await loadTasks();
  };

  const handleTaskDeleted = async (taskId) => {
    await loadTasks();
    setSelectedTaskId(null);
  };

  const rootTasks = tasks.filter((t) => !t.parentTaskId);
  const activeCount = tasks.filter((t) => t.status !== "DONE").length;
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  if (isLoading)
    return <div className="dashboard__loading">Loading your quest log...</div>;

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
            className="dashboard__add-button"
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
            <h3>
              <Compass size={16} />
              Quest Log &amp; Activity
            </h3>
            <p>
              You have <strong>{activeCount}</strong> unresolved quests. Align
              filters below to review.
            </p>
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
    </div>
  );
}
