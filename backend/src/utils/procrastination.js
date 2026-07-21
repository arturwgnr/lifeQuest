const STAGNANT_THRESHOLD_DAYS = 3;

function isOverdue(task) {
  if (task.status === "DONE") return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

function daysOverdue(task) {
  if (!isOverdue(task)) return 0;
  const diffMs = Date.now() - new Date(task.dueDate).getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function daysStagnant(task) {
  if (task.status === "DONE" || task.status === "TODO") return 0;
  const diffMs = Date.now() - new Date(task.updatedAt).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function isStagnant(task, thresholdDays = STAGNANT_THRESHOLD_DAYS) {
  return daysStagnant(task) >= thresholdDays;
}

function needsAttention(task) {
  return task.status !== "DONE" && (isOverdue(task) || isStagnant(task));
}

function withComputedFlags(task) {
  return {
    ...task,
    overdue: isOverdue(task),
    daysOverdue: daysOverdue(task),
    daysStagnant: daysStagnant(task),
    stagnant: isStagnant(task),
    needsAttention: needsAttention(task)
  };
}

function chainCompletion(parentTaskId, allTasks) {
  const children = allTasks.filter(t => t.parentTaskId === parentTaskId);
  if (children.length === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = children.filter(t => t.status === "DONE").length;
  return {
    completed,
    total: children.length,
    percent: Math.round((completed / children.length) * 100)
  };
}

module.exports = {
  STAGNANT_THRESHOLD_DAYS,
  isOverdue,
  daysOverdue,
  daysStagnant,
  isStagnant,
  needsAttention,
  withComputedFlags,
  chainCompletion
};
