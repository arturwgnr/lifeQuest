const { prisma } = require("./prisma");

const DAILY_LIMIT = 10;
const AI_LIMIT_MESSAGE = "You've used today's AI credits, more free tomorrow.";

function todayUtcMidnight() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Resets the counter (in-memory, not yet persisted) if the stored reset
// timestamp is from before today's UTC midnight.
function currentCount(user, midnight) {
  return new Date(user.aiCallsResetAt) < midnight ? 0 : user.aiCallsToday;
}

// Checks the daily cap and, if allowed, atomically records the call.
// Not row-locked: acceptable for this single-account personal app, where the
// frontend already disables inputs while a request is in flight.
async function checkAndConsumeAiCall(userId) {
  const midnight = todayUtcMidnight();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const count = currentCount(user, midnight);

  if (count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      aiCallsToday: count + 1,
      aiCallsResetAt: new Date(user.aiCallsResetAt) < midnight ? midnight : user.aiCallsResetAt
    }
  });

  return { allowed: true, remaining: DAILY_LIMIT - updated.aiCallsToday };
}

async function getAiUsage(userId) {
  const midnight = todayUtcMidnight();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const used = currentCount(user, midnight);
  return { used, remaining: DAILY_LIMIT - used, limit: DAILY_LIMIT };
}

module.exports = { checkAndConsumeAiCall, getAiUsage, DAILY_LIMIT, AI_LIMIT_MESSAGE };
