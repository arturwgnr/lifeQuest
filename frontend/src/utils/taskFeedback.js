import { STATUS_LABELS } from "../constants/status.js";

// Toast wording for a status change, shared by every screen with quick
// status actions. Completing a quest has no Undo: XP has already been added
// and is never taken back, so "undoing" would only let the same XP be earned
// twice. Every other status move can be reverted.
export function notifyStatusChange(toast, { task, status, onUndo }) {
  if (status === "DONE") {
    return toast.success(`Quest complete: ${task.title}`, {
      description: `+${task.xpValue} XP earned`
    });
  }
  return toast.info(`Moved to ${STATUS_LABELS[status]}`, {
    description: task.title,
    action: onUndo ? { label: "Undo", onClick: onUndo } : null
  });
}

// Optimistically patches one task's status in a list so selects and badges
// update instantly instead of snapping back until the server answers.
export function withStatus(tasks, taskId, status) {
  return tasks.map(t => (t.id === taskId ? { ...t, status } : t));
}
