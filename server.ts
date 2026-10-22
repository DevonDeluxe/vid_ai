import express from "express";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const execFileAsync = promisify(execFile);
const PORT = 3000;

function getGenAIClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-memory cache for synthesized scene voice-overs so repeated playback is instant
const ttsCache = new Map<string, string>();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // 1. Server-side Gemini TTS Narration endpoint (gemini-3.8-flash-lite-tts via Interactions API)
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, sceneId, voice = "Kore" } = req.body;
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Missing narration text" });
        return;
      }

      const cacheKey = `${sceneId || "custom"}:${voice}:${text}`;
      if (ttsCache.has(cacheKey)) {
        res.json({
          audioBase64: ttsCache.get(cacheKey),
          mimeType: "audio/wav",
          cached: true,
        });
        return;
      }

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        res.status(503).json({
          error: "GEMINI_API_KEY is not configured. Using built-in Web Speech voice synthesis.",
        });
        return;
      }

      const ai = getGenAIClient();
      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash-lite-tts",
        input: [
          {
            type: "text",
            text,
            annotations: [
              {
                type: "speech_metadata",
                style:
                  "Warm, encouraging, friendly swimming coach speaking clearly at a calm child-friendly pace",
              },
            ],
          },
        ],
        response_format: { type: "audio" },
        generation_config: {
          speech_config: [
            {
              language: "en-US",
              voice,
            },
          ],
        },
      });

      const audio = interaction.output_audio;
      if (audio?.data) {
        ttsCache.set(cacheKey, audio.data);
        res.json({
          audioBase64: audio.data,
          mimeType: audio.mime_type || "audio/wav",
          cached: false,
        });
        return;
      }

      res.status(500).json({ error: "No audio returned from Gemini TTS model." });
    } catch (error: any) {
      const message = error?.message || "Failed to generate speech narration";
      res.status(error?.status || 500).json({ error: message });
    }
  });

  // 2. Server-side Google Flow / Gemini Omni Flash Video Generation & Extension endpoint
  app.post("/api/flow-video", async (req, res) => {
    try {
      const {
        prompt,
        referenceImageBase64,
        referenceImageMimeType,
        previousInteractionId,
        duration = "5s",
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Missing video generation prompt" });
        return;
      }

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        res.status(403).json({
          error:
            "Please check your API key in the Settings > Secrets panel to run cloud video generation with gemini-omni-1.1-flash.",
        });
        return;
      }

      const ai = getGenAIClient();

      const inputPayload: any = referenceImageBase64
        ? [
            {
              type: "image",
              mime_type: referenceImageMimeType || "image/png",
              data: referenceImageBase64,
            },
            {
              type: "text",
              text: prompt,
            },
          ]
        : prompt;

      const interaction = await ai.interactions.create(
        {
          model: "gemini-omni-1.1-flash",
          ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
          input: inputPayload,
          background: false,
          store: true,
          stream: false,
          response_format: {
            type: "video",
            aspect_ratio: "16:9",
            duration: duration === "10s" ? "10s" : "5s",
            resolution: "720p",
          },
        },
        { timeout: 300000 }
      );

      const videoPart = interaction.output_video;
      if (videoPart?.data || videoPart?.uri) {
        res.json({
          interactionId: interaction.id,
          videoBase64: videoPart.data || null,
          videoUri: videoPart.uri || null,
          mimeType: videoPart.mime_type || "video/mp4",
        });
        return;
      }

      res.status(500).json({ error: "No video output returned from gemini-omni-1.1-flash." });
    } catch (error: any) {
      const message = error?.message || "Video generation failed";
      res.status(error?.status || 500).json({ error: message });
    }
  });

  // 3. Server-side Nano Banana (gemini-3.1-flash-lite-image) Image Cleanup & Keyframe Enhancer endpoint
  app.post("/api/nano-banana", async (req, res) => {
    try {
      const { prompt, imageBase64, mimeType = "image/png", aspectRatio = "16:9" } = req.body;
      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Missing image cleanup prompt" });
        return;
      }

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        res.status(503).json({
          error: "GEMINI_API_KEY not configured for cloud Nano Banana. Using built-in Voxel Clean-Up Engine.",
        });
        return;
      }

      const ai = getGenAIClient();
      const parts: any[] = [];
      if (imageBase64) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as "16:9" | "1:1" | "4:3" | "3:4" | "9:16",
          },
        },
      });

      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        if (part.inlineData?.data) {
          res.json({
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
            model: "gemini-3.1-flash-lite-image",
          });
          return;
        }
      }

      res.status(500).json({ error: "No image returned from gemini-3.1-flash-lite-image." });
    } catch (error: any) {
      const message = error?.message || "Nano Banana image processing failed";
      res.status(error?.status || 500).json({ error: message });
    }
  });

  // 4. Installed muapi-cli (https://github.com/SamurAIGPT/muapi-cli.git) endpoints
  app.get("/api/muapi/status", async (_req, res) => {
    try {
      const { stdout: helpOut } = await execFileAsync("muapi", ["--help"], {
        env: { ...process.env, NO_COLOR: "1" },
      });
      res.json({
        installed: true,
        version: "0.2.7",
        repo: "https://github.com/SamurAIGPT/muapi-cli.git",
        hasApiKey: Boolean(
          process.env.MUAPI_API_KEY && process.env.MUAPI_API_KEY !== "MY_MUAPI_API_KEY"
        ),
        helpOutput: helpOut,
      });
    } catch (err: any) {
      res.status(500).json({
        installed: false,
        error: err?.message || "muapi binary not found",
      });
    }
  });

  app.post("/api/muapi/run", async (req, res) => {
    try {
      const {
        model = "nano-banana-2",
        prompt,
        dryRun = false,
        extraInputs = [],
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Missing prompt for muapi run" });
        return;
      }

      const args = ["run", model, "-p", prompt];
      if (Array.isArray(extraInputs)) {
        for (const kv of extraInputs) {
          if (typeof kv === "string" && kv.includes("=")) {
            args.push("-i", kv);
          }
        }
      }

      const hasKey = Boolean(
        process.env.MUAPI_API_KEY && process.env.MUAPI_API_KEY !== "MY_MUAPI_API_KEY"
      );
      if (dryRun || !hasKey) {
        args.push("--dry-run");
      } else {
        args.push("--output-json");
      }

      const { stdout, stderr } = await execFileAsync("muapi", args, {
        env: { ...process.env, NO_COLOR: "1" },
        timeout: 120000,
      });

      res.json({
        command: `muapi ${args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`,
        dryRun: dryRun || !hasKey,
        output: stdout || stderr,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.stderr || err?.stdout || err?.message || "muapi execution failed",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pixel Pool server running on http://localhost:${PORT}`);
  });
}

startServer();
