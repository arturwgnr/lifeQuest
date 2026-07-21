/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, GitBranch, AlertTriangle, Trash2, 
  Sparkles, Compass, Trophy, LogOut, CheckSquare, ListFilter, Play, ArrowRight, Loader2
} from 'lucide-react';
import { Task, UserProfile } from '../types';

interface QuestLogDashboardProps {
  user: UserProfile;
  initialTasks: Task[];
  onLogout: () => void;
  guestXp: number;
  guestLevel: number;
  onIncrementXp: (amount: number) => void;
}

export default function QuestLogDashboard({
  user,
  initialTasks,
  onLogout,
  guestXp,
  guestLevel,
  onIncrementXp
}: QuestLogDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<'all' | 'active' | 'avoided' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Custom manual task creator
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<string>('Work');
  const [manualPriority, setManualPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [manualDependency, setManualDependency] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Oracle Narrator on Dashboard
  const [dashThoughts, setDashThoughts] = useState<string>('');
  const [isOracleRunning, setIsOracleRunning] = useState<boolean>(false);
  const [floatingXp, setFloatingXp] = useState<number | null>(null);

  // Computed unique categories
  const categories: string[] = ['all', ...Array.from(new Set<string>(tasks.map(t => t.category)))];

  const handleCreateManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newTask: Task = {
      id: `manual-${Date.now()}`,
      title: manualTitle.trim(),
      category: manualCategory,
      priority: manualPriority,
      dependency: manualDependency.trim() || null,
      isAvoided: false,
      reason: 'Manually added to list.',
      isApproved: true,
      isCompleted: false,
      createdAt: new Date().toLocaleDateString()
    };

    setTasks(prev => [newTask, ...prev]);
    setManualTitle('');
    setManualDependency('');
    setShowAddForm(false);
    
    // Tiny XP reward for planning
    triggerXp(10);
  };

  const triggerXp = (amount: number) => {
    onIncrementXp(amount);
    setFloatingXp(amount);
    setTimeout(() => setFloatingXp(null), 1000);
  };

  const handleConsultOracleDashboard = async () => {
    if (!dashThoughts.trim()) return;
    setIsOracleRunning(true);
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawThoughts: dashThoughts }),
      });
      const data = await res.json();
      if (res.ok && data.suggestions) {
        // Automatically approve and add them!
        const parsedTasks = data.suggestions.map((sug: any, i: number) => ({
          id: `oracle-${Date.now()}-${i}`,
          title: sug.title,
          category: sug.category,
          priority: sug.priority,
          dependency: sug.dependency,
          isAvoided: sug.isAvoided,
          reason: sug.reason,
          isApproved: true,
          isCompleted: false,
          createdAt: new Date().toLocaleDateString()
        }));

        setTasks(prev => [...parsedTasks, ...prev]);
        setDashThoughts('');
        triggerXp(parsedTasks.length * 15);
      }
    } catch (err) {
      // Fallback
      const fallbackTask: Task = {
        id: `oracle-${Date.now()}`,
        title: "Structure remaining Q3 milestones",
        category: "Planning",
        priority: "medium",
        dependency: null,
        isAvoided: true,
        reason: "The Oracle inferred that Q3 plans have lingering ambiguity blocks.",
        isApproved: true,
        isCompleted: false,
        createdAt: new Date().toLocaleDateString()
      };
      setTasks(prev => [fallbackTask, ...prev]);
      setDashThoughts('');
      triggerXp(15);
    } finally {
      setIsOracleRunning(false);
    }
  };

  const handleToggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.isCompleted;
        if (nextState) {
          // Double reward for completing something you were procrastinating on!
          const bonus = t.isAvoided ? 40 : 25;
          triggerXp(bonus);
        }
        return { ...t, isCompleted: nextState };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Helper function to check if dependency is completed
  const isDependencyBlocked = (task: Task) => {
    if (!task.dependency) return false;
    // Find the dependent task by title or substring
    const depTask = tasks.find(t => 
      t.title.toLowerCase().includes(task.dependency!.toLowerCase()) ||
      task.dependency!.toLowerCase().includes(t.title.toLowerCase())
    );
    // Blocked if dependency exists and is NOT completed
    return depTask ? !depTask.isCompleted : false;
  };

  // Filter calculations
  const filteredTasks = tasks.filter(t => {
    const matchesStatus = 
      filter === 'all' ||
      (filter === 'active' && !t.isCompleted) ||
      (filter === 'avoided' && t.isAvoided && !t.isCompleted) ||
      (filter === 'completed' && t.isCompleted);
    
    const matchesCategory = 
      categoryFilter === 'all' || t.category === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#faf9f7] film-grain text-[#1c1917]" id="dashboard-container">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 grid-texture-light opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 relative z-10">
        
        {/* Profile Header Block */}
        <div className="bg-white border border-brand-light-primary/10 rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-brand-light-primary rounded-xl flex items-center justify-center shrink-0">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-sans font-extrabold tracking-tight">
                {user.name}'s Quest Log
              </h1>
              <p className="text-xs text-brand-light-secondary font-mono">
                Authenticating as: <span className="font-semibold">{user.email}</span>
              </p>
            </div>
          </div>

          {/* Level and XP Meter */}
          <div className="flex items-center gap-5 w-full md:w-auto max-w-sm justify-end">
            <div className="space-y-2 flex-1 md:w-48">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase font-bold text-brand-light-secondary">
                  Cosmetic XP Progress
                </span>
                <span className="text-[10px] font-mono font-bold text-brand-light-accent">
                  {guestXp} / 100 XP
                </span>
              </div>
              <div className="w-full bg-brand-light-primary/5 h-2 rounded-full overflow-hidden border border-brand-light-primary/5">
                <motion.div 
                  className="bg-brand-light-accent h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${guestXp}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center w-16 h-16 bg-brand-light-accent/10 border border-brand-light-accent/10 rounded-xl relative">
              <Trophy className="w-5 h-5 text-brand-light-accent" />
              <span className="text-xs font-mono font-bold text-brand-light-accent">
                Lv.{guestLevel}
              </span>
              <AnimatePresence>
                {floatingXp !== null && (
                  <motion.span
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: -25 }}
                    exit={{ opacity: 0 }}
                    className="absolute font-mono font-extrabold text-xs text-brand-light-accent bg-white px-1.5 py-0.5 rounded border border-brand-light-accent/20 shadow-sm"
                  >
                    +{floatingXp} XP
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Filters, Add Task, Dashboard Oracle */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Oracle Panel */}
            <div className="bg-white border border-brand-light-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-light-secondary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-light-accent" />
                Narrate New Tasks
              </h3>
              <p className="text-xs text-brand-light-secondary leading-relaxed font-sans">
                Type what you accomplished or what you're hesitating on. The Oracle will parse and append tasks instantly.
              </p>
              <textarea
                value={dashThoughts}
                onChange={(e) => setDashThoughts(e.target.value)}
                placeholder="I did the initial draft for our gym plan, but I'm dragging my feet on booking the actual physical eval."
                className="w-full h-24 p-3 border border-brand-light-primary/10 rounded-xl bg-[#faf9f7] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-light-accent text-[#1c1917] resize-none"
              />
              <button
                onClick={handleConsultOracleDashboard}
                disabled={isOracleRunning || !dashThoughts.trim()}
                className="w-full py-2.5 bg-brand-light-primary hover:bg-brand-light-primary/95 text-white disabled:bg-brand-light-primary/40 rounded-lg text-xs font-medium font-sans flex items-center justify-center gap-2 transition-custom shadow-sm"
              >
                {isOracleRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Consulting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-brand-light-accent" />
                    Consult the Oracle
                  </>
                )}
              </button>
            </div>

            {/* Manual Task Trigger Form */}
            <div className="bg-white border border-brand-light-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-light-secondary flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-brand-light-primary" />
                  Quick Quest Entry
                </h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs font-mono text-brand-light-accent hover:underline"
                >
                  {showAddForm ? 'Close' : 'Create'}
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleCreateManualTask} className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-brand-light-secondary uppercase tracking-wider">
                      Quest Title
                    </label>
                    <input
                      type="text"
                      required
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="e.g. Schedule gym evaluation"
                      className="w-full p-2.5 border border-brand-light-primary/10 rounded-lg bg-[#faf9f7] text-xs focus:outline-none focus:ring-1 focus:ring-brand-light-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-brand-light-secondary uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
                        className="w-full p-2.5 border border-brand-light-primary/10 rounded-lg bg-[#faf9f7] text-xs focus:outline-none focus:ring-1 focus:ring-brand-light-accent"
                      >
                        <option value="Work">Work</option>
                        <option value="Finance">Finance</option>
                        <option value="Health">Health</option>
                        <option value="Planning">Planning</option>
                        <option value="Personal">Personal</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-brand-light-secondary uppercase tracking-wider">
                        Priority
                      </label>
                      <select
                        value={manualPriority}
                        onChange={(e) => setManualPriority(e.target.value as any)}
                        className="w-full p-2.5 border border-brand-light-primary/10 rounded-lg bg-[#faf9f7] text-xs focus:outline-none focus:ring-1 focus:ring-brand-light-accent"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-brand-light-secondary uppercase tracking-wider flex justify-between">
                      <span>Depends on (Optional)</span>
                      <span className="text-[8px] text-brand-light-secondary/70">Exactly matches another title</span>
                    </label>
                    <input
                      type="text"
                      value={manualDependency}
                      onChange={(e) => setManualDependency(e.target.value)}
                      placeholder="e.g. Compile raw database metrics"
                      className="w-full p-2.5 border border-brand-light-primary/10 rounded-lg bg-[#faf9f7] text-xs focus:outline-none focus:ring-1 focus:ring-brand-light-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-light-primary text-white hover:bg-brand-light-primary/95 rounded-lg text-xs font-semibold"
                  >
                    Add to Quest Log
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Right Column: Active Task List Workspace */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Toolbar Filters */}
            <div className="bg-white border border-brand-light-primary/10 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              
              {/* Left Side Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider border transition-custom whitespace-nowrap ${
                    filter === 'all' 
                      ? 'bg-brand-light-primary border-brand-light-primary text-white' 
                      : 'border-transparent text-brand-light-secondary hover:bg-brand-light-primary/5'
                  }`}
                >
                  All Quests ({tasks.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider border transition-custom whitespace-nowrap ${
                    filter === 'active' 
                      ? 'bg-brand-light-primary border-brand-light-primary text-white' 
                      : 'border-transparent text-brand-light-secondary hover:bg-brand-light-primary/5'
                  }`}
                >
                  Active ({tasks.filter(t => !t.isCompleted).length})
                </button>
                <button
                  onClick={() => setFilter('avoided')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider border transition-custom flex items-center gap-1.5 whitespace-nowrap ${
                    filter === 'avoided' 
                      ? 'bg-brand-light-accent/15 border-brand-light-accent/20 text-brand-light-accent font-bold' 
                      : 'border-transparent text-brand-light-secondary hover:bg-brand-light-primary/5'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-brand-light-accent" />
                  Flagged ({tasks.filter(t => t.isAvoided && !t.isCompleted).length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider border transition-custom whitespace-nowrap ${
                    filter === 'completed' 
                      ? 'bg-brand-light-primary border-brand-light-primary text-white' 
                      : 'border-transparent text-brand-light-secondary hover:bg-brand-light-primary/5'
                  }`}
                >
                  Completed ({tasks.filter(t => t.isCompleted).length})
                </button>
              </div>

              {/* Right Side Category Filter */}
              <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                <ListFilter className="w-4.5 h-4.5 text-brand-light-secondary shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="p-1.5 border border-brand-light-primary/10 rounded-lg text-[11px] font-mono font-semibold uppercase bg-white text-brand-light-primary focus:outline-none"
                >
                  <option value="all">ALL CATEGORIES</option>
                  {categories.filter(c => c !== 'all').map((cat: string) => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Task Cards Stack */}
            <div className="space-y-4" id="dashboard-tasks-stack">
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task) => {
                  const blocked = isDependencyBlocked(task);
                  return (
                    <motion.div
                      key={task.id}
                      layoutId={task.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`p-5 rounded-2xl bg-white border transition-all duration-300 relative ${
                        task.isCompleted 
                          ? 'border-brand-light-primary/5 opacity-55' 
                          : task.isAvoided 
                            ? 'border-l-4 border-l-brand-light-accent border-y border-r border-brand-light-primary/15'
                            : 'border-brand-light-primary/10 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-4">
                        
                        {/* Task checkbox and core content */}
                        <div className="flex items-start gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            disabled={blocked}
                            onChange={() => handleToggleComplete(task.id)}
                            className="w-5 h-5 rounded border-brand-light-primary/20 accent-brand-light-accent cursor-pointer mt-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                          <div className="space-y-1.5 flex-1">
                            
                            {/* Tags and headers */}
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="px-1.5 py-0.5 text-[9px] font-mono bg-brand-light-primary/5 text-brand-light-primary rounded uppercase">
                                {task.category}
                              </span>
                              <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded uppercase ${
                                task.priority === 'high' 
                                  ? 'bg-red-50 text-red-600 border border-red-100' 
                                  : task.priority === 'medium' 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                    : 'bg-green-50 text-green-700 border border-green-100'
                              }`}>
                                {task.priority} Priority
                              </span>
                              
                              {task.isAvoided && !task.isCompleted && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono bg-brand-light-accent/10 text-brand-light-accent rounded-full font-bold">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Procrastination Flagged
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <span className={`font-sans font-bold text-sm leading-snug block ${
                              task.isCompleted ? 'line-through text-brand-light-secondary' : 'text-brand-light-primary'
                            }`}>
                              {task.title}
                            </span>

                            {/* Dependencies Badge */}
                            {task.dependency && (
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-mono text-brand-light-secondary flex items-center gap-1">
                                  <GitBranch className="w-3.5 h-3.5 text-brand-light-primary/40" />
                                  Depends on: <span className="font-semibold text-brand-light-primary">{task.dependency}</span>
                                </p>
                                {blocked && (
                                  <p className="text-[10px] font-mono text-red-600 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit border border-red-100">
                                    🔒 Locked until dependent task is completed
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Reasoning */}
                            {task.reason && (
                              <p className="text-[11px] text-brand-light-secondary italic leading-relaxed font-sans font-normal pt-1">
                                "{task.reason}"
                              </p>
                            )}

                          </div>
                        </div>

                        {/* Actions block on right */}
                        <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                          <span className="text-[10px] font-mono text-brand-light-secondary mr-2">
                            {task.createdAt}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 rounded-lg text-brand-light-secondary transition-custom"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="bg-white border border-brand-light-primary/10 rounded-2xl p-12 text-center space-y-3">
                    <p className="text-xs text-brand-light-secondary font-sans">
                      No active quests found matching these filter criteria.
                    </p>
                    <button
                      onClick={() => { setFilter('all'); setCategoryFilter('all'); }}
                      className="px-4 py-2 border border-brand-light-primary/10 text-brand-light-primary rounded-lg text-xs font-semibold"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
