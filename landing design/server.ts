/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully on the server.");
  } catch (error) {
    console.error("Failed to initialize Gemini API Client:", error);
  }
} else {
  console.log("GEMINI_API_KEY is not defined. Using local fallback oracle generator.");
}

// REST API endpoint: The Oracle
app.post("/api/oracle", async (req, res) => {
  const { rawThoughts } = req.body;

  if (!rawThoughts || typeof rawThoughts !== "string" || rawThoughts.trim().length === 0) {
    return res.status(400).json({ error: "Narrative thoughts cannot be empty." });
  }

  // If Gemini API is available, use it!
  if (ai) {
    try {
      const systemInstruction = `You are the lifeQuest Oracle, a silent, wise, and pragmatic accountability advisor.
The user will narrate their raw thoughts about their day—what they did, what's stuck, what they are avoiding, and what they need to get done.
Analyze their narrative and extract 2 to 4 structured tasks.
Critically identify:
1. What they are quietly avoiding or procrastinating on (mark isAvoided: true). Provide a realistic title and specify the psychological reason or block in 'reason'.
2. Realistic dependency relationships (e.g. "Draft Q3 Report" depends on "Review raw financial figures"). If task A depends on task B, specify task B's title in the 'dependency' field. If there are no dependencies, set it to null.
3. Logical categorizations (e.g. Work, Personal, Health, Finance, Development).
4. Priorities (high, medium, or low).

Be pragmatic, helpful, and brief. Generate exactly a JSON array of task suggestions matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: rawThoughts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                priority: { type: Type.STRING, description: "high, medium, or low" },
                dependency: { type: Type.STRING, description: "Title of another task this depends on, or null" },
                isAvoided: { type: Type.BOOLEAN, description: "Whether the user is procrastinating/avoiding this task" },
                reason: { type: Type.STRING, description: "Explanation of why this task is structured this way or why it was flagged as avoided" }
              },
              required: ["title", "category", "priority", "dependency", "isAvoided", "reason"]
            }
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        return res.json({ source: "gemini", suggestions: parsed });
      }
    } catch (error) {
      console.error("Gemini API error, falling back to local oracle parser:", error);
    }
  }

  // Local rule-based heuristic parser for robust offline fallback
  const suggestions = [];
  const lowercaseThoughts = rawThoughts.toLowerCase();

  // Try parsing simple commands or themes
  if (lowercaseThoughts.includes("retirement") || lowercaseThoughts.includes("portfolio") || lowercaseThoughts.includes("finance")) {
    suggestions.push({
      title: "Consolidate retirement portfolio",
      category: "Finance",
      priority: "high",
      dependency: "Review Q3 financial reports",
      isAvoided: true,
      reason: "Oracle detected hesitation regarding investment complexity and long-term portfolio restructuring."
    });
    suggestions.push({
      title: "Review Q3 financial reports",
      category: "Finance",
      priority: "medium",
      dependency: null,
      isAvoided: false,
      reason: "Prerequisite for retirement consolidation. Clean financial data is required."
    });
  }

  if (lowercaseThoughts.includes("gym") || lowercaseThoughts.includes("workout") || lowercaseThoughts.includes("exercise") || lowercaseThoughts.includes("health")) {
    suggestions.push({
      title: "Schedule physical evaluation",
      category: "Health",
      priority: "medium",
      dependency: null,
      isAvoided: true,
      reason: "Procrastination flagged; physical fitness actions often get delayed due to initial activation energy hurdles."
    });
  }

  if (lowercaseThoughts.includes("email") || lowercaseThoughts.includes("inbox") || lowercaseThoughts.includes("message")) {
    suggestions.push({
      title: "Process inbox to zero",
      category: "Work",
      priority: "low",
      dependency: null,
      isAvoided: false,
      reason: "Administrative hygiene. Keeps communication channels transparent."
    });
  }

  // Default tasks if nothing specific is found
  if (suggestions.length === 0) {
    suggestions.push({
      title: "Identify primary professional bottleneck",
      category: "Work",
      priority: "high",
      dependency: null,
      isAvoided: true,
      reason: "Oracle flagged lack of specific direction. Taking a structured step prevents generalized avoidance."
    });
    suggestions.push({
      title: "Draft weekly roadmap",
      category: "Planning",
      priority: "medium",
      dependency: "Identify primary professional bottleneck",
      isAvoided: false,
      reason: "Provides actionable guardrails for your attention span."
    });
  }

  return res.json({ source: "local_heuristic", suggestions });
});

// Setup development or production environment
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Use Vite Middleware
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve Static Files
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`lifeQuest Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
