import { useState, useEffect, FormEvent } from "react";
import { Task, TaskCategory, TaskPriority, TaskStatus, UserProfile, ChatMessage, AISuggestionCard } from "./types";
import { INITIAL_USER, INITIAL_TASKS } from "./initialData";
import AvatarBadge from "./components/AvatarBadge";
import AttentionToday, { CATEGORY_CONFIG } from "./components/AttentionToday";
import TaskItem from "./components/TaskItem";
import TaskDetailModal from "./components/TaskDetailModal";
import OracleScreen from "./components/OracleScreen";
import LoginSetup from "./components/LoginSetup";
import LevelUpNotification from "./components/LevelUpNotification";
import { Sparkles, Compass, Plus, SlidersHorizontal, BookOpen, Clock, LogOut, CheckCircle, Flame, X } from "lucide-react";

export default function App() {
  // --- STATE INITIALIZATION & LOCALSTORAGE SYNCHRONIZATION ---
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("quest_tracker_user");
    return saved ? JSON.parse(saved) : { ...INITIAL_USER, isLoggedIn: false, isSetup: false };
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("quest_tracker_tasks");
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("quest_tracker_chat");
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'oracle'>('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);

  // Filters State
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem("quest_tracker_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("quest_tracker_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("quest_tracker_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // --- ADD TASK FORM STATE ---
  const [addTitle, setAddTitle] = useState("");
  const [addCategory, setAddCategory] = useState<TaskCategory>("Finance");
  const [addPriority, setAddPriority] = useState<TaskPriority>("Side");
  const [addNotes, setAddNotes] = useState("");
  const [addDueDate, setAddDueDate] = useState("");
  const [addParentId, setAddParentId] = useState<string | null>(null);

  // --- PROGRESSION & XP SYSTEM ---
  const handleGainXp = (xpGained: number) => {
    setUser(prev => {
      const newXp = prev.xp + xpGained;
      const currentLevel = prev.level;
      // Calculate level-up: 100 XP per level
      const newLevel = Math.floor(newXp / 100) + 1;
      
      let avatarState = prev.avatarState;
      if (newLevel >= 9) avatarState = 5;
      else if (newLevel >= 7) avatarState = 4;
      else if (newLevel >= 5) avatarState = 3;
      else if (newLevel >= 3) avatarState = 2;
      else avatarState = 1;

      if (newLevel > currentLevel) {
        setShowLevelUp(newLevel);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        avatarState
      };
    });
  };

  const handleQuickComplete = (taskId: string, xpGained: number) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const newStatus: TaskStatus = "Done";
          return {
            ...t,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            statusHistory: [
              ...t.statusHistory,
              { status: newStatus, timestamp: new Date().toISOString() }
            ]
          };
        }
        return t;
      })
    );
    handleGainXp(xpGained);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            statusHistory: [
              ...t.statusHistory,
              { status: newStatus, timestamp: new Date().toISOString() }
            ]
          };
        }
        return t;
      })
    );

    // If marked Done, grant XP
    if (newStatus === "Done" && taskToUpdate.status !== "Done") {
      handleGainXp(taskToUpdate.xp);
    }
  };

  // --- CRUD ACTIONS ---
  const handleSaveQuest = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    // Sync active task view in case it was modified
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleDeleteQuest = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  const handleAddQuest = (e: FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim()) return;

    const baseId = `q-${Date.now()}`;
    const xpValue = addPriority === "Main" ? 60 : 25;

    const newTask: Task = {
      id: baseId,
      title: addTitle,
      category: addCategory,
      priority: addPriority,
      status: "To Do",
      parentId: addParentId === "" ? null : addParentId,
      xp: xpValue,
      notes: addNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: addDueDate ? new Date(addDueDate).toISOString() : null,
      statusHistory: [{ status: "To Do", timestamp: new Date().toISOString() }]
    };

    setTasks(prev => [newTask, ...prev]);
    setShowAddModal(false);

    // Reset fields
    setAddTitle("");
    setAddCategory("Finance");
    setAddPriority("Side");
    setAddNotes("");
    setAddDueDate("");
    setAddParentId(null);
  };

  // --- AI SUGGESTION APPROVAL ---
  const handleApproveSuggestion = (sug: AISuggestionCard) => {
    const newTask: Task = {
      id: `q-ai-${Date.now()}`,
      title: sug.title,
      category: sug.category,
      priority: sug.priority,
      status: "To Do",
      parentId: null, // AI suggestions default to root, can be assigned inside Detail
      xp: sug.xp,
      notes: sug.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      statusHistory: [{ status: "To Do", timestamp: new Date().toISOString() }]
    };
    setTasks(prev => [newTask, ...prev]);
  };

  // --- FILTER & SORT TASK LIST ---
  const filteredTasks = tasks.filter(task => {
    const matchesCategory = filterCategory === "All" || task.category === filterCategory;
    const matchesPriority = filterPriority === "All" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "All" || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPriority && matchesStatus && matchesSearch;
  });

  const handleLogout = () => {
    setUser({ ...INITIAL_USER, isLoggedIn: false, isSetup: false });
    setTasks(INITIAL_TASKS);
    setChatHistory([]);
  };

  // If user is not logged in or onboarding has not finished, render Onboarding Screen
  if (!user.isLoggedIn || !user.isSetup) {
    return (
      <LoginSetup
        onComplete={(completedUser) => {
          setUser(completedUser);
        }}
      />
    );
  }

  // Count active quests in the system
  const activeQuestsCount = tasks.filter(t => t.status !== "Done").length;

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-slate-800 bg-slate-50 flex-col lg:flex-row selection:bg-indigo-100" id="quest-tracker-root">
      {/* --- DESKTOP LEFT SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col shrink-0 border-r border-slate-800">
        {/* Logo/Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-2.5 bg-slate-950/20">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
            <Compass className="w-4.5 h-4.5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Daily Codex</h1>
            <p className="text-[9px] text-slate-500 font-sans tracking-wide">Quest Intelligence</p>
          </div>
        </div>

        {/* Profile Panel */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="shrink-0">
              <AvatarBadge level={user.level} xp={user.xp} className="w-11 h-11" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white leading-tight truncate">{user.name}</h2>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono mt-0.5">
                {user.level >= 9 ? "Sovereign Tier" : user.level >= 7 ? "Champion Class" : user.level >= 5 ? "Pathfinder Class" : user.level >= 3 ? "Initiate Class" : "Novice Chronicle"}
              </p>
            </div>
          </div>
          
          {/* Progression Tracker */}
          <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${user.xp % 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-500">
            <span>{user.xp} Total XP</span>
            <span>{Math.floor(user.xp / 100) * 100 + 100} Target</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button 
            type="button"
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentTab === 'dashboard' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
            }`}
          >
            <span className="mr-2.5 text-sm opacity-85">⊞</span> Dashboard
          </button>
          <button 
            type="button"
            onClick={() => setCurrentTab('oracle')}
            className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-all relative cursor-pointer ${
              currentTab === 'oracle' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
            }`}
          >
            <span className="mr-2.5 text-sm opacity-85">✧</span> The Oracle
            <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800/40 space-y-2">
            <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3">Quick Actions</div>
            
            {/* simulated routine incrementor */}
            <button
              type="button"
              onClick={() => handleGainXp(15)}
              className="w-full flex items-center px-3 py-1.5 text-[11px] text-slate-400 hover:bg-slate-800/40 hover:text-amber-400 rounded-lg transition-all cursor-pointer"
              title="Simulate daily routine completion (+15 XP)"
            >
              <span className="mr-2.5 text-amber-500">🔥</span> Quick Routine +15XP
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-1.5 text-[11px] text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
            >
              <span className="mr-2.5">🚪</span> Log Out / Reset
            </button>
          </div>
        </nav>
      </aside>

      {/* --- MOBILE TOP HEADER --- */}
      <header className="lg:hidden flex h-16 bg-slate-900 text-white justify-between items-center px-4 shrink-0 shadow-md border-b border-slate-800 z-30 w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shrink-0">
            <Compass className="w-4.5 h-4.5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider font-mono">DAILY CODEX</h1>
            <p className="text-[9px] text-slate-400">Quest Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mini tabs */}
          <nav className="flex p-0.5 bg-slate-800 rounded-lg border border-slate-700/60 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setCurrentTab('dashboard')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                currentTab === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              Codex
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('oracle')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${
                currentTab === 'oracle' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              Oracle
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
            </button>
          </nav>

          {/* Routine Incrementor */}
          <button
            type="button"
            onClick={() => handleGainXp(15)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-400 cursor-pointer"
            title="Routine +15 XP"
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* --- MAIN PANEL --- */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative min-w-0">
        {/* Page Header (Inner header) */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 capitalize font-mono">
              {currentTab === 'dashboard' ? 'Daily Codex' : 'Oracle Whispers'}
            </h2>
            {currentTab === 'dashboard' && (
              <span className="text-[10px] bg-slate-100 font-mono text-slate-500 px-1.5 py-0.5 rounded font-bold">
                {activeQuestsCount} Active
              </span>
            )}
          </div>
          
          {currentTab === 'dashboard' && (
            <div className="flex items-center gap-2.5">
              {/* Priority Quick Filter Option */}
              <div className="hidden sm:flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterPriority("All")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                    filterPriority === "All" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPriority("Main")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                    filterPriority === "Main" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Main
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPriority("Side")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                    filterPriority === "Side" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Side
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Forge Quest
              </button>
            </div>
          )}
        </header>

        {/* Content viewport scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* Tab 1: Dashboard View */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6" id="dashboard-tab-view">
              {/* Needs Attention Panel (Overdue & Stagnant procrastination logs) */}
              <AttentionToday
                tasks={tasks}
                onTaskSelect={(task) => setSelectedTask(task)}
                onQuickComplete={handleQuickComplete}
              />

              {/* General Log Header & Filter Rail */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 font-sans flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-slate-600" />
                      Quest Log & Activity Chronicle
                    </h2>
                    <p className="text-xs text-slate-500 font-sans">
                      You have <span className="font-semibold text-slate-700">{activeQuestsCount}</span> unresolved quests. Align filters below to review.
                    </p>
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                  {/* Search */}
                  <div>
                    <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-1">Search Keywords</label>
                    <input
                      type="text"
                      placeholder="Search titles, notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-400 font-sans"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-1">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-slate-400 font-sans"
                    >
                      <option value="All">All Categories</option>
                      <option value="Finance">Finance</option>
                      <option value="Personal Development">Personal Development</option>
                      <option value="Work">Work</option>
                      <option value="Bureaucracy">Bureaucracy</option>
                      <option value="Health">Health</option>
                      <option value="Relationships">Relationships</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-1">Quest Priority</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-slate-400 font-sans"
                    >
                      <option value="All">All Priorities</option>
                      <option value="Main">Main Quests Only</option>
                      <option value="Side">Side Quests Only</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-slate-400 font-sans"
                    >
                      <option value="All">All Statuses</option>
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Done">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Hierarchical Collapsible Task Lists */}
              <TaskItem
                tasks={tasks}
                filteredTasks={filteredTasks}
                onTaskSelect={(task) => setSelectedTask(task)}
                onStatusChange={handleStatusChange}
                onQuickComplete={handleQuickComplete}
              />
            </div>
          )}

          {/* Tab 2: Oracle Screen (Conversational Guidance) */}
          {currentTab === 'oracle' && (
            <OracleScreen
              tasks={tasks}
              chatHistory={chatHistory}
              onAddMessage={(msg) => setChatHistory(prev => [...prev, msg])}
              onApproveSuggestion={handleApproveSuggestion}
              isLoading={isLoadingGemini}
              setIsLoading={setIsLoadingGemini}
            />
          )}

        </div>
      </div>

      {/* --- ADD QUEST MODAL FORM --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in" id="add-quest-modal">
          <div className="bg-white border border-stone-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/50">
              <h3 className="text-sm font-bold font-mono text-stone-900 uppercase">Forge New Quest</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuest} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold font-mono text-stone-600 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g., Audit monthly savings budget"
                  className="w-full text-xs border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold font-mono text-stone-600 uppercase mb-1">Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value as TaskCategory)}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2 py-2 bg-white focus:outline-none"
                  >
                    <option value="Finance">Finance</option>
                    <option value="Personal Development">Personal Development</option>
                    <option value="Work">Work</option>
                    <option value="Bureaucracy">Bureaucracy</option>
                    <option value="Health">Health</option>
                    <option value="Relationships">Relationships</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold font-mono text-stone-600 uppercase mb-1">Priority</label>
                  <select
                    value={addPriority}
                    onChange={(e) => setAddPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2 py-2 bg-white focus:outline-none"
                  >
                    <option value="Main">Main Quest (60 XP)</option>
                    <option value="Side">Side Quest (25 XP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold font-mono text-stone-600 uppercase mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={addDueDate}
                    onChange={(e) => setAddDueDate(e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold font-mono text-stone-600 uppercase mb-1">Chain Parent (Optional)</label>
                  <select
                    value={addParentId || ""}
                    onChange={(e) => setAddParentId(e.target.value === "" ? null : e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2 py-2 bg-white focus:outline-none"
                  >
                    <option value="">-- Standalone (No Chain) --</option>
                    {tasks.filter(t => t.parentId === null).map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold font-mono text-stone-600 uppercase mb-1">Notes / Description</label>
                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional context regarding this task..."
                  className="w-full text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-sm cursor-pointer"
                >
                  Confirm Forge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TASK DETAIL VIEW MODAL --- */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          tasks={tasks}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveQuest}
          onDelete={handleDeleteQuest}
        />
      )}

      {/* --- LEVEL-UP TOAST OVERLAY --- */}
      {showLevelUp !== null && (
        <LevelUpNotification
          level={showLevelUp}
          onClose={() => setShowLevelUp(null)}
        />
      )}
    </div>
  );
}
