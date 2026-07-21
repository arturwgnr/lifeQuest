export type TaskCategory = 'Finance' | 'Personal Development' | 'Work' | 'Bureaucracy' | 'Health' | 'Relationships';
export type TaskPriority = 'Main' | 'Side';
export type TaskStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Done';

export interface StatusHistoryEntry {
  status: TaskStatus;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  parentId: string | null; // Null means it's a root task. If other tasks have this as parentId, it's a chain.
  xp: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null; // Optional due date to detect overdue tasks
  statusHistory: StatusHistoryEntry[];
}

export interface UserProfile {
  name: string;
  xp: number;
  level: number;
  avatarState: number; // 1 to 5 based on level milestone
  isSetup: boolean;
  isLoggedIn: boolean;
}

export interface AISuggestionCard {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  xp: number;
  notes: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'oracle-question';
  text: string;
  timestamp: string;
  suggestions?: AISuggestionCard[];
  confirmedAction?: {
    type: 'added' | 'updated' | 'completed';
    summary: string;
  };
}
