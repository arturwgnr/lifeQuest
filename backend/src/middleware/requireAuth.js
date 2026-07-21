const { readUserIdFromRequest } = require("../lib/auth");

function requireAuth(req, res, next) {
  const userId = readUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.userId = userId;
  next();
}

module.exports = { requireAuth };
