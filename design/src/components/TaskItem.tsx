import { useState } from "react";
import { Task, TaskStatus } from "../types";
import { CATEGORY_CONFIG } from "./AttentionToday";
import { getChainCompletion, getDaysStagnant, isTaskOverdue } from "../initialData";
import { ChevronDown, ChevronRight, CheckCircle2, Clock, Eye, AlertTriangle, CornerDownRight } from "lucide-react";

interface TaskItemProps {
  tasks: Task[]; // All tasks in the system
  filteredTasks: Task[]; // Only the filtered tasks to display
  onTaskSelect: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onQuickComplete: (taskId: string, xpGained: number) => void;
}

export default function TaskItem({
  tasks,
  filteredTasks,
  onTaskSelect,
  onStatusChange,
  onQuickComplete
}: TaskItemProps) {
  // State to track collapsed parent tasks (by task ID)
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});

  const toggleCollapse = (parentId: string) => {
    setCollapsedParents(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  // Find root tasks (parentId === null) that exist in the system
  const rootTasks = filteredTasks.filter(t => t.parentId === null);

  // If a subtask matches the filter but its parent doesn't, we should still show the parent, or flatten?
  // Let's list root tasks first. If a parent is not in filtered list but has matching children,
  // we can display it as part of the tree. Let's make sure the root tasks include any parent
  // of visible child tasks to maintain context, or simply display them clearly.
  const visibleRoots = Array.from(new Set([
    ...rootTasks,
    ...filteredTasks
      .filter(t => t.parentId !== null)
      .map(t => tasks.find(p => p.id === t.parentId))
      .filter((p): p is Task => p !== undefined)
  ])).sort((a, b) => {
    // Sort main tasks / chains first by default
    if (a.priority === "Main" && b.priority !== "Main") return -1;
    if (a.priority !== "Main" && b.priority === "Main") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (visibleRoots.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 border border-slate-200 border-dashed rounded-xl" id="empty-task-state">
        <p className="text-sm text-slate-500 font-mono">No quests match your selected parameters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="task-list-container">
      {visibleRoots.map(rootTask => {
        // Find subtasks of this root task in the system
        const subtasks = tasks.filter(t => t.parentId === rootTask.id);
        const hasSubtasks = subtasks.length > 0;
        
        // Filter subtasks based on active filters
        const visibleSubtasks = filteredTasks.filter(t => t.parentId === rootTask.id);
        
        // Check if root is collapsed
        const isCollapsed = collapsedParents[rootTask.id] || false;
        
        // Chain stats
        const { completed, total, percent } = getChainCompletion(rootTask.id, tasks);

        // Styling config for root task
        const rootConfig = CATEGORY_CONFIG[rootTask.category];
        const CategoryIcon = rootConfig.icon;
        const overdue = isTaskOverdue(rootTask);
        const stagnantDays = getDaysStagnant(rootTask);

        return (
          <div key={rootTask.id} className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]" id={`root-task-block-${rootTask.id}`}>
            {/* Parent Task Container */}
            <div className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${rootTask.status === "Done" ? "bg-slate-50/50" : "bg-white"}`}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Collapse Chevron & Category Icon */}
                <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
                  {hasSubtasks ? (
                    <button
                      type="button"
                      onClick={() => toggleCollapse(rootTask.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
                      title={isCollapsed ? "Expand chain" : "Collapse chain"}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <div className="w-6" /> // spacer
                  )}

                  <span className={`inline-flex items-center justify-center p-2 rounded-lg ${rootConfig.bgColor} ${rootConfig.color} border ${rootConfig.border}`}>
                    <CategoryIcon className="w-4 h-4" />
                  </span>
                </div>

                {/* Text Context */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-250 uppercase">
                      {rootTask.priority}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {rootTask.category}
                    </span>
                    {hasSubtasks && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Chain: {completed}/{total} Complete ({percent}%)
                      </span>
                    )}
                    {overdue && (
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-rose-50/80 text-rose-700 border border-rose-100 animate-pulse">
                        Overdue
                      </span>
                    )}
                    {stagnantDays >= 3 && (
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-amber-50/80 text-amber-750 border border-amber-100">
                        Stagnant ({stagnantDays}d)
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm font-semibold font-sans leading-snug ${rootTask.status === "Done" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                    {rootTask.title}
                  </h3>

                  {rootTask.notes && (
                    <p className="text-xs text-slate-400 font-sans mt-0.5 line-clamp-1 italic">
                      {rootTask.notes}
                    </p>
                  )}
                  
                  {/* Progress bar for task chains */}
                  {hasSubtasks && !isCollapsed && (
                    <div className="w-full max-w-xs bg-slate-105 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0 font-mono text-xs">
                {/* XP badge */}
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                    +{rootTask.xp} XP
                  </span>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={rootTask.status}
                    onChange={(e) => onStatusChange(rootTask.id, e.target.value as TaskStatus)}
                    className="text-xs rounded-lg border border-slate-200 bg-white text-slate-700 px-2 py-1 focus:outline-none focus:border-slate-400 font-sans font-medium hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Done">Done</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => onTaskSelect(rootTask)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all shrink-0 cursor-pointer"
                    title="Edit quest details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {rootTask.status !== "Done" && (
                    <button
                      type="button"
                      onClick={() => onQuickComplete(rootTask.id, rootTask.xp)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible Subtask Chain List */}
            {hasSubtasks && !isCollapsed && visibleSubtasks.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/20 divide-y divide-slate-100/60 pb-1" id={`subtasks-of-${rootTask.id}`}>
                {visibleSubtasks.map(subtask => {
                  const subConfig = CATEGORY_CONFIG[subtask.category];
                  const SubIcon = subConfig.icon;
                  const subOverdue = isTaskOverdue(subtask);
                  const subStagnant = getDaysStagnant(subtask);

                  return (
                    <div
                      key={subtask.id}
                      className={`py-3 pl-8 pr-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors ${
                        subtask.status === "Done" ? "opacity-60" : ""
                      }`}
                      id={`subtask-${subtask.id}`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <CornerDownRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        <span className={`inline-flex items-center justify-center p-1 rounded-md mt-0.5 ${subConfig.bgColor} ${subConfig.color}`}>
                          <SubIcon className="w-3 h-3" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono font-semibold px-1 py-0.1 rounded bg-slate-100 text-slate-500">
                              {subtask.priority}
                            </span>
                            {subOverdue && (
                              <span className="text-[9px] font-bold font-mono px-1 py-0.1 bg-rose-50 text-rose-600">
                                Overdue
                              </span>
                            )}
                            {subStagnant >= 3 && (
                              <span className="text-[9px] font-bold font-mono px-1 py-0.1 bg-amber-50 text-amber-600">
                                Stagnant
                              </span>
                            )}
                          </div>
                          <h4 className={`text-xs font-medium font-sans leading-tight mt-0.5 ${subtask.status === "Done" ? "text-slate-400 line-through" : "text-slate-800"}`}>
                            {subtask.title}
                          </h4>
                          {subtask.notes && (
                            <p className="text-[11px] text-slate-400 mt-0.5 italic line-clamp-1">
                              {subtask.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subtask Status Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 md:pt-0 font-mono text-[11px] pl-6 md:pl-0">
                        <span className="font-bold text-slate-500">+{subtask.xp} XP</span>
                        
                        <div className="flex items-center gap-1.5">
                          <select
                            value={subtask.status}
                            onChange={(e) => onStatusChange(subtask.id, e.target.value as TaskStatus)}
                            className="text-[11px] rounded bg-white border border-slate-205 px-1.5 py-0.5 text-slate-750 focus:outline-none font-sans font-medium cursor-pointer"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Done">Done</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => onTaskSelect(subtask)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Inspect sub-quest detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {subtask.status !== "Done" && (
                            <button
                              type="button"
                              onClick={() => onQuickComplete(subtask.id, subtask.xp)}
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-sm cursor-pointer"
                            >
                              Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
