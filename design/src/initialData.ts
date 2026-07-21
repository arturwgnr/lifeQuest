import { Task, UserProfile } from "./types";

export const INITIAL_USER: UserProfile = {
  name: "Maia Odetes",
  xp: 145,
  level: 3,
  avatarState: 2,
  isSetup: true,
  isLoggedIn: true
};

const now = new Date();
const formatDate = (daysOffset: number) => {
  const d = new Date();
  d.setDate(now.getDate() + daysOffset);
  return d.toISOString();
};

export const INITIAL_TASKS: Task[] = [
  // Chain 1: Finance Quest
  {
    id: "f-parent",
    title: "Q3 Personal Finance Reorganization",
    category: "Finance",
    priority: "Main",
    status: "In Progress",
    parentId: null,
    xp: 100,
    notes: "A comprehensive audit of Q3 savings goals, investment distribution, and subscription cancellations.",
    createdAt: formatDate(-10),
    updatedAt: formatDate(-4),
    dueDate: formatDate(3),
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-10) },
      { status: "In Progress", timestamp: formatDate(-4) }
    ]
  },
  {
    id: "f-sub1",
    title: "Audit and cancel inactive subscriptions",
    category: "Finance",
    priority: "Side",
    status: "Done",
    parentId: "f-parent",
    xp: 25,
    notes: "Identify services unused for >30 days. Target saves of at least $40/month.",
    createdAt: formatDate(-9),
    updatedAt: formatDate(-8),
    dueDate: null,
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-9) },
      { status: "In Progress", timestamp: formatDate(-9) },
      { status: "Done", timestamp: formatDate(-8) }
    ]
  },
  {
    id: "f-sub2",
    title: "Consolidate old retirement portfolios",
    category: "Finance",
    priority: "Main",
    status: "To Do",
    parentId: "f-parent",
    xp: 60,
    notes: "Initiate direct rollover paperwork for the previous employer's 401k plan into the current IRA.",
    createdAt: formatDate(-9),
    updatedAt: formatDate(-9),
    dueDate: formatDate(-1), // Overdue!
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-9) }
    ]
  },
  {
    id: "f-sub3",
    title: "Rebalance index fund allocation",
    category: "Finance",
    priority: "Side",
    status: "In Progress",
    parentId: "f-parent",
    xp: 30,
    notes: "Adjust equity/bond ratio to match the 85/15 target allocation profile.",
    createdAt: formatDate(-8),
    updatedAt: formatDate(-7), // Stagnant in In Progress for 7 days
    dueDate: null,
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-8) },
      { status: "In Progress", timestamp: formatDate(-7) }
    ]
  },

  // Chain 2: Health Audit Quest
  {
    id: "h-parent",
    title: "Comprehensive Health Audit",
    category: "Health",
    priority: "Main",
    status: "In Progress",
    parentId: null,
    xp: 80,
    notes: "Bi-annual review of personal fitness, physician screenings, and sleep metrics.",
    createdAt: formatDate(-12),
    updatedAt: formatDate(-12),
    dueDate: formatDate(5),
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-12) },
      { status: "In Progress", timestamp: formatDate(-12) }
    ]
  },
  {
    id: "h-sub1",
    title: "Schedule professional dental cleaning",
    category: "Health",
    priority: "Side",
    status: "Done",
    parentId: "h-parent",
    xp: 20,
    notes: "Call local clinic to lock in a slot for late Q3.",
    createdAt: formatDate(-12),
    updatedAt: formatDate(-10),
    dueDate: null,
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-12) },
      { status: "Done", timestamp: formatDate(-10) }
    ]
  },
  {
    id: "h-sub2",
    title: "Complete biometrics & blood panel screening",
    category: "Health",
    priority: "Main",
    status: "Blocked",
    parentId: "h-parent",
    xp: 50,
    notes: "Requires updated insurance verification documents. Currently stuck waiting for HR confirmation.",
    createdAt: formatDate(-11),
    updatedAt: formatDate(-8), // Stagnant in Blocked for 8 days
    dueDate: formatDate(2),
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-11) },
      { status: "In Progress", timestamp: formatDate(-10) },
      { status: "Blocked", timestamp: formatDate(-8) }
    ]
  },

  // Single tasks
  {
    id: "s-1",
    title: "Renew international passport application",
    category: "Bureaucracy",
    priority: "Main",
    status: "To Do",
    parentId: null,
    xp: 90,
    notes: "Fill out Form DS-82, take fresh passport photos, and mail with standard check processing.",
    createdAt: formatDate(-15),
    updatedAt: formatDate(-15),
    dueDate: formatDate(-3), // Overdue by 3 days!
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-15) }
    ]
  },
  {
    id: "s-2",
    title: "Read Chapter 4 of 'Atomic Habits'",
    category: "Personal Development",
    priority: "Side",
    status: "To Do",
    parentId: null,
    xp: 15,
    notes: "Focus on the visual triggers and design of your physical environment to sustain workflows.",
    createdAt: formatDate(-2),
    updatedAt: formatDate(-2),
    dueDate: null,
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-2) }
    ]
  },
  {
    id: "s-3",
    title: "Draft planning for colleague's farewell dinner",
    category: "Relationships",
    priority: "Side",
    status: "In Progress",
    parentId: null,
    xp: 30,
    notes: "Coordinate venue options, collect RSVP headcount, and prepare team card signature link.",
    createdAt: formatDate(-4),
    updatedAt: formatDate(-4), // Stagnant for 4 days
    dueDate: formatDate(1),
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-4) },
      { status: "In Progress", timestamp: formatDate(-4) }
    ]
  },
  {
    id: "s-4",
    title: "Complete monthly technical status report",
    category: "Work",
    priority: "Main",
    status: "Done",
    parentId: null,
    xp: 50,
    notes: "Summarize sprint velocities, resource usage, and blocker history.",
    createdAt: formatDate(-3),
    updatedAt: formatDate(-1),
    dueDate: null,
    statusHistory: [
      { status: "To Do", timestamp: formatDate(-3) },
      { status: "In Progress", timestamp: formatDate(-2) },
      { status: "Done", timestamp: formatDate(-1) }
    ]
  }
];

// Calculation Helpers
export function isTaskOverdue(task: Task): boolean {
  if (task.status === "Done") return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

export function getDaysStagnant(task: Task): number {
  if (task.status === "Done" || task.status === "To Do") return 0;
  
  const lastUpdate = new Date(task.updatedAt);
  const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function isTaskStagnant(task: Task, thresholdDays = 3): boolean {
  return getDaysStagnant(task) >= thresholdDays;
}

export function getChainCompletion(parentId: string, tasks: Task[]): { completed: number; total: number; percent: number } {
  const childTasks = tasks.filter(t => t.parentId === parentId);
  if (childTasks.length === 0) {
    return { completed: 0, total: 0, percent: 0 };
  }
  const completed = childTasks.filter(t => t.status === "Done").length;
  const total = childTasks.length;
  const percent = Math.round((completed / total) * 100);
  return { completed, total, percent };
}
