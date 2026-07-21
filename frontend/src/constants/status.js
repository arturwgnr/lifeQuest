export const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

export const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done"
};

export const PRIORITY_LABELS = {
  MAIN: "Main",
  SIDE: "Side"
};

// Drives the per-status visual treatment on task rows (border, icon, tone) so
// status is readable at a glance, not just via the dropdown text.
export const STATUS_VISUAL = {
  TODO: { tone: "todo" },
  IN_PROGRESS: { tone: "progress" },
  BLOCKED: { tone: "blocked" },
  DONE: { tone: "done" }
};
