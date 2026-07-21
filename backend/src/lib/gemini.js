const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const MODEL = "gemini-2.5-flash";

function isConfigured(apiKey) {
  return apiKey && apiKey !== "AIza...";
}

function buildProposeQuestsTool(categoryNames) {
  return {
    functionDeclarations: [
      {
        name: "propose_quests",
        description:
          "Record the Oracle's conversational reply, an optional single clarifying question, and any structured task suggestions parsed from the user's narration.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            reply: {
              type: SchemaType.STRING,
              description: "Brief supportive conversational feedback (1-3 sentences), subtle mentor tone, never childish."
            },
            question: {
              type: SchemaType.STRING,
              description:
                "Exactly one clarifying question if there's ambiguity about whether an existing task is done or this is a duplicate. Omit entirely if nothing is ambiguous."
            },
            suggestions: {
              type: SchemaType.ARRAY,
              description: "Up to 3 structured task suggestions extracted from the narration. Empty array if none apply.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  category: { type: SchemaType.STRING, enum: categoryNames, description: "Must be exactly one of the user's existing category names." },
                  priorityType: { type: SchemaType.STRING, enum: ["MAIN", "SIDE"] },
                  xpValue: { type: SchemaType.INTEGER, description: "10-20 for small side tasks, 40-60 for main tasks, 80-100 for large milestones." },
                  notes: { type: SchemaType.STRING }
                },
                required: ["title", "category", "priorityType", "xpValue"]
              }
            }
          },
          required: ["reply", "suggestions"]
        }
      }
    ]
  };
}

function buildSystemPrompt(existingTasks, categoryNames) {
  const context = JSON.stringify(
    existingTasks.map(t => ({
      id: t.id,
      title: t.title,
      category: t.categoryName,
      priorityType: t.priorityType,
      status: t.status
    }))
  );

  return `You are the Oracle, an AI assistant inside a serious personal task/quest tracking productivity tool.
Your job is to parse the user's natural language narration of what they did or plan to do, and turn it into
structured task suggestions. You never invent unrelated tasks; only propose what's grounded in the narration.

Rules you must follow:
1. Never assume an existing task is complete or duplicated without asking. If the narration is ambiguous about
   whether it refers to an existing task (from the list below) being finished, updated, or is a brand new task,
   ask exactly one clarifying question instead of guessing.
2. Categorize each suggestion into exactly one of the user's own categories: ${categoryNames.join(", ")}.
   Never invent a category name that isn't in that list.
3. Keep tone supportive and concise, with a light, subtle mentor/RPG flavor, but this is a real productivity tool,
   not a game - never silly, never childish fantasy slang.
4. Assign XP thoughtfully: 10-20 for small side tasks, 40-60 for main tasks, 80-100 for large milestones.

Existing tasks (for cross-referencing and duplicate detection):
${context}

Always respond by calling the propose_quests function, never as plain text.`;
}

async function getOracleResponse({ message, existingTasks, history, categories }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const categoryNames = categories.map(c => c.name);

  if (!isConfigured(apiKey)) {
    return {
      reply:
        "The Oracle is running in offline mode because no GEMINI_API_KEY is configured. Set it in your backend .env to unlock live narration parsing.",
      question: null,
      suggestions: []
    };
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(existingTasks, categoryNames),
    tools: [buildProposeQuestsTool(categoryNames)],
    toolConfig: {
      functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["propose_quests"] }
    }
  });

  const contents = [
    ...history.map(h => ({
      role: h.sender === "USER" ? "user" : "model",
      parts: [{ text: h.text }]
    })),
    { role: "user", parts: [{ text: message }] }
  ];

  const result = await model.generateContent({ contents });
  const call = result.response.functionCalls()?.[0];
  if (!call) {
    return { reply: "The Oracle could not parse a structured response. Please try rephrasing.", question: null, suggestions: [] };
  }

  const { reply, question, suggestions } = call.args;
  return {
    reply: reply || "",
    question: question || null,
    suggestions: Array.isArray(suggestions) ? suggestions : []
  };
}

async function getWeeklyJournalInsight({ entries, stagnantTaskCount }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!isConfigured(apiKey)) {
    return "Weekly insight is unavailable in offline mode because no GEMINI_API_KEY is configured. Once a key is set, the Oracle will summarize emotional patterns from your journal entries here.";
  }

  const client = new GoogleGenerativeAI(apiKey);

  const entrySummary = entries
    .map(e => `${e.entryDate}: rating ${e.dayRating}/5, moods: ${e.moods.join(", ") || "none"} - "${e.text.slice(0, 300)}"`)
    .join("\n");

  const system = `You are a supportive, non-clinical wellbeing companion inside a personal productivity app's journal feature.
Analyze the past week's journal entries (date, day rating 1-5, mood tags, free text) and write a SHORT (3-5 sentence)
supportive summary of emotional patterns and trends this week. You may gently note recurring low-rated days, recurring
emotions, or - if provided - a correlation with a high number of stagnant/blocked tasks in the user's tracker, but you
must NEVER make diagnostic or clinical claims and NEVER suggest therapy or medical treatment. Keep the tone warm,
encouraging, and grounded in what the entries actually say.`;

  const model = client.getGenerativeModel({ model: MODEL, systemInstruction: system });
  const userContent = `This week's journal entries:\n${entrySummary}\n\nCurrently stagnant/blocked tasks in the tracker: ${stagnantTaskCount}`;

  const result = await model.generateContent(userContent);
  return result.response.text() || "The Oracle could not generate an insight this week.";
}

async function getEntryInsight({ newEntry, recentEntries }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!isConfigured(apiKey)) {
    return "Offline mode: set GEMINI_API_KEY to unlock a short reflection on this entry after each save.";
  }

  const client = new GoogleGenerativeAI(apiKey);

  const history = recentEntries
    .map(e => `${e.entryDate}: rating ${e.dayRating}/5, moods: ${e.moods.join(", ") || "none"} - "${e.text.slice(0, 200)}"`)
    .join("\n");

  const system = `You are a supportive, non-clinical wellbeing companion inside a personal productivity app's journal feature.
The user just saved a new journal entry. Write a BRIEF (1-2 sentence) supportive reflection on this entry, using the
user's recent past entries as memory/context so you can notice patterns, recurring themes, or changes compared to
recent days when relevant - but only mention a pattern if the entries actually support it. Never make diagnostic or
clinical claims, never suggest therapy or medical treatment. Warm, grounded, concise tone. This supplements a weekly
summary, so keep it short and specific to today's entry.`;

  const model = client.getGenerativeModel({ model: MODEL, systemInstruction: system });
  const userContent = `Recent past entries (oldest to newest, may be empty if this is the first):\n${history || "(none yet)"}\n\nToday's new entry (${newEntry.entryDate}): rating ${newEntry.dayRating}/5, moods: ${newEntry.moods.join(", ") || "none"} - "${newEntry.text.slice(0, 500)}"`;

  const result = await model.generateContent(userContent);
  return result.response.text() || null;
}

module.exports = { getOracleResponse, getWeeklyJournalInsight, getEntryInsight };
