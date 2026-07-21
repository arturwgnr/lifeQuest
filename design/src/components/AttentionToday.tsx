import { ComponentType } from "react";
import { Task, TaskCategory } from "../types";
import { isTaskOverdue, getDaysStagnant, isTaskStagnant } from "../initialData";
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, Coins, BookOpen, Shield, Scroll, Leaf, Heart, AlertCircle } from "lucide-react";

interface AttentionTodayProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onQuickComplete: (taskId: string, xpGained: number) => void;
}

// Map categories to icons and colors
export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { icon: ComponentType<{ className?: string }>; color: string; bgColor: string; border: string }
> = {
  Finance: { icon: Coins, color: "text-amber-600", bgColor: "bg-amber-50/60", border: "border-amber-100" },
  "Personal Development": { icon: BookOpen, color: "text-indigo-600", bgColor: "bg-indigo-50/60", border: "border-indigo-100" },
  Work: { icon: Shield, color: "text-slate-700", bgColor: "bg-slate-50/60", border: "border-slate-200" },
  Bureaucracy: { icon: Scroll, color: "text-stone-600", bgColor: "bg-stone-50/60", border: "border-stone-200" },
  Health: { icon: Leaf, color: "text-emerald-600", bgColor: "bg-emerald-50/60", border: "border-emerald-100" },
  Relationships: { icon: Heart, color: "text-rose-600", bgColor: "bg-rose-50/60", border: "border-rose-100" }
};

export default function AttentionToday({ tasks, onTaskSelect, onQuickComplete }: AttentionTodayProps) {
  // Filter for tasks needing attention
  const attentionTasks = tasks.filter(task => {
    if (task.status === "Done") return false;
    return isTaskOverdue(task) || isTaskStagnant(task, 3);
  });

  if (attentionTasks.length === 0) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 text-center select-none" id="no-attention-banner">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-emerald-900 font-sans">Clear Horizon</h3>
        <p className="text-xs text-emerald-750 mt-1 max-w-md mx-auto">
          No quests are currently overdue or stagnant. You are maintaining an active and structured pace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="attention-today-section">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 font-sans flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Requires Active Attention Today
        </h2>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
          {attentionTasks.length} {attentionTasks.length === 1 ? "issue" : "issues"} flagged
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {attentionTasks.map(task => {
          const overdue = isTaskOverdue(task);
          const stagnantDays = getDaysStagnant(task);
          const config = CATEGORY_CONFIG[task.category];
          const CategoryIcon = config.icon;

          return (
            <div
              key={task.id}
              className={`group relative flex flex-col justify-between p-4 bg-white border rounded-xl hover:border-slate-300 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                overdue ? "border-rose-200 border-l-4 border-l-rose-500 bg-rose-50/10" : "border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/10"
              }`}
              id={`attention-task-${task.id}`}
            >
              <div>
                {/* Header Flag */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center justify-center p-1.5 rounded-md ${config.bgColor} ${config.color}`}>
                      <CategoryIcon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 font-mono">
                      {task.category}
                    </span>
                  </div>

                  {overdue ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                      <Clock className="w-3 h-3" />
                      OVERDUE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      <AlertTriangle className="w-3 h-3" />
                      STAGNANT
                    </span>
                  )}
                </div>

                {/* Task Title */}
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-1 font-sans">
                  {task.title}
                </h3>

                {/* Flag Reasons / Procrastination context */}
                <div className="text-xs text-slate-500 mt-1.5 font-mono space-y-0.5">
                  {overdue && task.dueDate && (
                    <span className="text-rose-600 font-semibold block">
                      • Due date passed on {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {stagnantDays >= 3 && (
                    <span className="text-amber-700 font-semibold block">
                      • Stuck in "{task.status}" state for {stagnantDays} days without movement
                    </span>
                  )}
                  <span className="text-slate-400 mt-1 block italic text-[11px] line-clamp-2">
                    {task.notes || "No context notes logged."}
                  </span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    +{task.xp} XP
                  </span>
                  <span className="capitalize">{task.priority} Quest</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onTaskSelect(task)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all text-xs flex items-center gap-1 font-sans font-medium cursor-pointer"
                    title="Inspect quest detail"
                  >
                    Details
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickComplete(task.id, task.xp)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg text-white font-sans transition-all shadow-sm cursor-pointer ${
                      overdue
                        ? "bg-rose-600 hover:bg-rose-700 active:scale-95"
                        : "bg-amber-600 hover:bg-amber-700 active:scale-95"
                    }`}
                  >
                    Mark Done
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
