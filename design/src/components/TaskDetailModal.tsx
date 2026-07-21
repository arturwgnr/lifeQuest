import React, { useState } from "react";
import { Task, TaskCategory, TaskPriority, TaskStatus } from "../types";
import { CATEGORY_CONFIG } from "./AttentionToday";
import { Calendar, Clock, GitCommit, GitPullRequest, LayoutList, MessageSquare, Save, X, Trash2 } from "lucide-react";

interface TaskDetailModalProps {
  task: Task;
  tasks: Task[]; // Need full list to build chain mini-map
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskDetailModal({
  task,
  tasks,
  onClose,
  onSave,
  onDelete
}: TaskDetailModalProps) {
  // Local state for all fields
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [notes, setNotes] = useState(task.notes);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [parentId, setParentId] = useState<string | null>(task.parentId);

  const [isEditing, setIsEditing] = useState(false);

  // Filter root tasks that could potentially be parents (exclude self to avoid cyclic dependency)
  const potentialParents = tasks.filter(t => t.id !== task.id && t.parentId === null);

  // Build the Chain Mini-Map
  const isPartofChain = task.parentId !== null || tasks.some(t => t.parentId === task.id);
  
  // Find the actual parent
  const parentTask = task.parentId ? tasks.find(t => t.id === task.parentId) : null;
  // Sibling tasks under the same parent
  const siblings = task.parentId 
    ? tasks.filter(t => t.parentId === task.parentId && t.id !== task.id)
    : [];
  // Sub-tasks if this task is a parent itself
  const subTasks = tasks.filter(t => t.parentId === task.id);

  // Handle Save
  const handleSave = () => {
    // Detect status change to append to history
    let updatedHistory = [...task.statusHistory];
    if (status !== task.status) {
      updatedHistory.push({
        status,
        timestamp: new Date().toISOString()
      });
    }

    const updatedTask: Task = {
      ...task,
      title,
      category,
      priority,
      status,
      notes,
      parentId: parentId === "" ? null : parentId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      statusHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    };
    
    onSave(updatedTask);
    setIsEditing(false);
  };

  // Timeline computation helper
  const computeTimelineDurations = () => {
    const timeline = [...task.statusHistory];
    const elements: { status: TaskStatus; timestamp: string; durationText: string }[] = [];

    for (let i = 0; i < timeline.length; i++) {
      const current = timeline[i];
      const next = timeline[i + 1];
      
      const startDate = new Date(current.timestamp);
      const endDate = next ? new Date(next.timestamp) : new Date(); // If last state, measure to "now"

      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let durationText = "";
      if (diffDays > 0) {
        durationText = `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
      } else if (diffHours > 0) {
        durationText = `${diffHours} ${diffHours === 1 ? "hour" : "hours"}`;
      } else {
        durationText = "less than an hour";
      }

      elements.push({
        status: current.status,
        timestamp: current.timestamp,
        durationText: next ? `Sat in this state for ${durationText}` : `Active in this state for ${durationText} (Current)`
      });
    }

    return elements.reverse(); // Show newest transitions at the top
  };

  const timelineEvents = computeTimelineDurations();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in" id="task-detail-modal">
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <LayoutList className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold tracking-tight text-stone-900 font-mono">
              Quest Log Detail
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Info */}
          {!isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${CATEGORY_CONFIG[task.category].bgColor} ${CATEGORY_CONFIG[task.category].color} border ${CATEGORY_CONFIG[task.category].border}`}>
                  {task.category}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600">
                  {task.priority} Priority
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  task.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  task.status === 'Blocked' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                  task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                  'bg-stone-100 text-stone-600 border-stone-200'
                } border`}>
                  {task.status}
                </span>
                <span className="text-xs font-mono font-bold text-stone-500 ml-auto">
                  Reward: +{task.xp} XP
                </span>
              </div>

              <h1 className="text-lg font-bold font-sans text-stone-950">
                {task.title}
              </h1>

              {task.dueDate && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-stone-500 bg-stone-50 border border-stone-100 px-3 py-1.5 rounded-lg w-fit">
                  <Calendar className="w-3.5 h-3.5" />
                  Due Date: <span className="font-semibold text-stone-700">{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}

              {task.notes ? (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 font-mono mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                    Quest Context & Notes
                  </div>
                  <p className="text-xs font-sans text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {task.notes}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-sans text-stone-400 italic">No notes logged for this quest.</p>
              )}
            </div>
          ) : (
            /* Editing State Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono text-stone-600 mb-1">Quest Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-mono text-stone-600 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-stone-400"
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
                  <label className="block text-xs font-bold font-mono text-stone-600 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-stone-400"
                  >
                    <option value="Main">Main Quest</option>
                    <option value="Side">Side Quest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-mono text-stone-600 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-stone-400"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-stone-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-stone-600 mb-1">Assign to Quest Chain</label>
                <select
                  value={parentId || ""}
                  onChange={(e) => setParentId(e.target.value === "" ? null : e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-stone-400"
                >
                  <option value="">-- No Chain (Standalone Quest) --</option>
                  {potentialParents.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-stone-600 mb-1">Quest Notes / Context</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Context, requirements, and logs regarding this task..."
                  className="w-full text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400 font-sans"
                />
              </div>
            </div>
          )}

          {/* Chain Mini-Map (Visible if part of chain) */}
          {isPartofChain && (
            <div className="border border-stone-200 bg-stone-50/30 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-stone-700 mb-3">
                <GitPullRequest className="w-4 h-4 text-indigo-500" />
                Quest Chain Tree Map
              </div>

              <div className="space-y-2 border-l-2 border-stone-200 pl-4 ml-2">
                {/* Parent Block */}
                {parentTask ? (
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-stone-300" />
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Parent Chain Goal</span>
                    <h4 className="text-xs font-bold text-stone-700">{parentTask.title}</h4>
                  </div>
                ) : (
                  // Current task is the parent
                  <div className="relative font-bold text-stone-900">
                    <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-mono text-indigo-600 uppercase">Parent Quest (This Task)</span>
                    <h4 className="text-xs font-bold">{title}</h4>
                  </div>
                )}

                {/* Subtasks or Siblings List */}
                <div className="space-y-1.5 pt-2 pl-3">
                  {/* Sibling Tasks */}
                  {siblings.map(sib => (
                    <div key={sib.id} className="relative flex items-center justify-between text-xs text-stone-500">
                      <div className="absolute -left-5 top-2 w-1.5 h-1.5 rounded-full bg-stone-200" />
                      <span>{sib.title}</span>
                      <span className="text-[10px] font-mono bg-stone-100 px-1 py-0.2 rounded font-semibold text-stone-500">{sib.status}</span>
                    </div>
                  ))}

                  {/* Highlight current task in mini-map if it's a subtask */}
                  {parentTask && (
                    <div className="relative flex items-center justify-between text-xs font-bold text-stone-950">
                      <div className="absolute -left-5 top-2 w-2 h-2 rounded-full bg-indigo-600" />
                      <span>{title} <span className="text-[10px] font-mono text-indigo-600">(Active Node)</span></span>
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">{status}</span>
                    </div>
                  )}

                  {/* Children Subtasks (If current task is parent) */}
                  {subTasks.map(child => (
                    <div key={child.id} className="relative flex items-center justify-between text-xs text-stone-500">
                      <div className="absolute -left-5 top-2 w-1.5 h-1.5 rounded-full bg-stone-200" />
                      <span>{child.title}</span>
                      <span className="text-[10px] font-mono bg-stone-100 px-1 py-0.2 rounded font-semibold text-stone-500">{child.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transition History / Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-stone-700">
              <Clock className="w-4 h-4 text-stone-500" />
              Procrastination & Status Logs
            </div>

            <div className="bg-stone-50/50 border border-stone-200 rounded-xl p-4 divide-y divide-stone-100 max-h-52 overflow-y-auto">
              {timelineEvents.map((event, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    event.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    event.status === 'Blocked' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    event.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    {event.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-700 font-medium font-sans">
                      {event.durationText}
                    </p>
                    <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs font-sans font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Abandon Quest
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Edit Quest
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
