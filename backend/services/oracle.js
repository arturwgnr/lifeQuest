const { GoogleGenAI } = require("@google/genai");

const MODEL = "gemini-flash-latest";

const SYSTEM_INSTRUCTION = `You are the Oracle, an AI assistant inside lifeQuest, a personal task/quest tracking
productivity tool. You help the user track tasks (quests) across these categories: Finance, Personal Development,
Work, Bureaucracy, Health, Relationships.

Rules you must follow:
1. You can suggest new tasks based on what the user tells you, but you never create tasks directly, you only
   propose them. The user always reviews, edits, approves, or rejects a suggestion before it becomes a real task.
2. If you're unsure whether something the user mentions is a brand new task or an existing one that's already
   done, ask a clarifying question instead of assuming.`;

// Pure AI communication layer for the Oracle: no database access, no Express routes.
// Kept isolated so a route can wire this up later without coupling the two.
async function askOracle(userMessage, conversationHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const contents = [
    ...conversationHistory.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const result = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction: SYSTEM_INSTRUCTION },
  });
  return result.text;
}

module.exports = { askOracle };
