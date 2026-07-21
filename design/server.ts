import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Oracle suggestions
  app.post("/api/gemini/suggest", async (req: express.Request, res: express.Response) => {
    try {
      const { message, existingTasks } = req.body;
      
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.json({
          text: "Greetings, traveler. I am operating in Offline Oracle mode because the Gemini API Key is not set in secrets. Configure your GEMINI_API_KEY to unlock live quest parsing.",
          question: "Would you like me to suggest a sample Finance or Health quest to start your journey?",
          suggestions: [
            {
              title: "Establish a Weekly Savings Routine",
              category: "Finance",
              priority: "Main",
              xp: 40,
              notes: "Review subscriptions, transfer fixed amount to savings, and log current balance."
            },
            {
              title: "Begin 10-Minute Morning Stretching",
              category: "Health",
              priority: "Side",
              xp: 15,
              notes: "Boost daily health with a light full-body stretch right after waking up."
            }
          ]
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const existingTasksContext = existingTasks && Array.isArray(existingTasks)
        ? JSON.stringify(existingTasks.map((t: any) => ({
            title: t.title,
            category: t.category,
            priority: t.priority,
            status: t.status,
            id: t.id
          })))
        : "[]";

      const systemInstruction = `You are the AI Oracle for a serious productivity and quest-tracking application.
Your goal is to parse the user's natural language daily narration, reflect on what they did or plan to do, and generate highly constructive task suggestions and/or an optional clarifying question.
Keep your response supportive, clean, and concise, with a subtle light fantasy/RPG-inspired tone (like a wise advisor or mentor, e.g., "Greetings, traveler", "your journal shows progress", "new quests arise") but maintaining a serious productivity focus.
Never use childish parchment/game slang that makes it silly. It is a serious tool.

Based on the user's narration and the list of existing tasks, you should:
1. Provide a brief conversational feedback (1-3 sentences).
2. Generate structured task suggestions if appropriate (up to 3 suggestions). Categorize them precisely into one of: 'Finance', 'Personal Development', 'Work', 'Bureaucracy', 'Health', 'Relationships'. Assign a reasonable fixed XP value (e.g., 10-20 for simple side tasks, 40-60 for main tasks, 80-100 for large milestones).
3. Optionally ask exactly one clarifying question if there's an ambiguity (e.g. if a narration sounds like an existing task is being worked on or complete, ask "Is this related to X?"). Do not ask questions if none are needed.

Here are the existing tasks to avoid duplicates and cross-reference:
${existingTasksContext}`;

      const prompt = `User Narration: "${message}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "Brief conversational feedback with a subtle fantasy RPG mentor style (1-3 sentences)."
              },
              question: {
                type: Type.STRING,
                description: "Optional clarifying question if there's an ambiguity or cross-reference. Set to empty or null if none."
              },
              suggestions: {
                type: Type.ARRAY,
                description: "Suggested tasks extracted from the narration.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Descriptive title of the task." },
                    category: { 
                      type: Type.STRING, 
                      description: "Category of the task.",
                      enum: ['Finance', 'Personal Development', 'Work', 'Bureaucracy', 'Health', 'Relationships']
                    },
                    priority: { 
                      type: Type.STRING, 
                      description: "Priority level of the task.",
                      enum: ['Main', 'Side']
                    },
                    xp: { type: Type.INTEGER, description: "Fixed XP value (10 to 100)." },
                    notes: { type: Type.STRING, description: "Short description or context details for the task." }
                  },
                  required: ["title", "category", "priority", "xp", "notes"]
                }
              }
            },
            required: ["text", "suggestions"]
          }
        }
      });

      const parsedResponse = JSON.parse(response.text || "{}");
      res.json(parsedResponse);
    } catch (err: any) {
      console.error("Gemini suggestion error:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development or static file serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
