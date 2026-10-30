require("dotenv").config();

const express = require("express");
// Express 4 never sees errors thrown inside async handlers, so the request
// just hangs. This forwards them to the error middleware below instead.
require("express-async-errors");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { router: authRouter } = require("./routes/auth.routes");
const { router: tasksRouter } = require("./routes/tasks.routes");
const { router: oracleRouter } = require("./routes/oracle.routes");
const { router: categoriesRouter } = require("./routes/categories.routes");
const { router: profileRouter } = require("./routes/profile.routes");
const { router: journalRouter } = require("./routes/journal.routes");
const { router: statsRouter } = require("./routes/stats.routes");
const { router: pillarsRouter } = require("./routes/pillars.routes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/oracle", oracleRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/profile", profileRouter);
app.use("/api/journal", journalRouter);
app.use("/api/stats", statsRouter);
app.use("/api/pillars", pillarsRouter);

// Prisma codes for "the database schema is behind the code"
const SCHEMA_ERROR_CODES = new Set(["P2021", "P2022"]);

app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  if (SCHEMA_ERROR_CODES.has(err.code)) {
    const missing = err.meta?.column || err.meta?.table;
    return res.status(500).json({
      error: `The database is missing ${missing ? `"${missing}"` : "a table or column"} that this version of the app needs. A pending migration hasn't been applied.`,
      code: err.code
    });
  }
  res.status(500).json({ error: "Internal server error", code: err.code });
});

app.listen(PORT, () => {
  console.log(`lifeQuest backend listening on http://localhost:${PORT}`);
});
