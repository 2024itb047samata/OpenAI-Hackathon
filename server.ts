import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing with safety limits
app.use(express.json({ limit: "10mb" }));

// Initialize the Google GenAI SDK lazily to avoid crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// 2. secure proxy for generating text/code with Gemini models
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, systemInstruction, model, temperature } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' parameter in request body." });
    }

    const ai = getGeminiClient();
    const modelToUse = model || "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are an expert AI software engineer.",
        temperature: temperature !== undefined ? Number(temperature) : 0.2,
      },
    });

    res.json({
      text: response.text || "",
      model: modelToUse,
    });
  } catch (error: any) {
    console.error("Gemini Generate API Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating content from Gemini.",
      details: error.stack,
    });
  }
});

// 3. secure proxy for generating embeddings
app.post("/api/gemini/embed", async (req, res) => {
  try {
    const { text, model } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing 'text' parameter in request body." });
    }

    const ai = getGeminiClient();
    const modelToUse = model || "text-embedding-004";

    const response: any = await ai.models.embedContent({
      model: modelToUse,
      contents: text,
    });

    // Check embedding structure - support both property typings safely
    const embeddingValues = response.embedding?.values || response.embeddings?.values || [];

    res.json({
      embedding: embeddingValues,
      model: modelToUse,
      dimensions: embeddingValues.length,
    });
  } catch (error: any) {
    console.error("Gemini Embed API Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating embeddings.",
      details: error.stack,
    });
  }
});

// -----------------------------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// -----------------------------------------------------------------------------
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with Static Assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started and listening on http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to initialize server:", err);
  process.exit(1);
});
