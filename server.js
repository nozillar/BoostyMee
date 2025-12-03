import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini with the correct SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
// Using gemini-2.5-flash as per coding guidelines (replaces user's request for 1.5-pro)
const MODEL_NAME = "gemini-2.5-flash";

function getModeInstruction(mode) {
  switch (mode) {
    case "suggest_activities":
      return `
Mode: Suggest Daily Activities
Task:
- Provide 3-5 short confidence-boosting activities
- Must match user's role, goal, and emotional context
- Keep tone warm and friendly
      `;
    case "reflect":
      return `
Mode: Emotional Reflection
Task:
- Reflect the user's emotions
- Validate feelings
- Offer emotional insight and simple next steps
      `;
    default:
      return `
Mode: Chat
Task:
- Respond naturally like a supportive best friend
- Reference user's role and goal
- Offer 1-2 practical actions
      `;
  }
}

app.post('/api/chat', async (req, res) => {
  const { message, profile, mode } = req.body;

  const systemPersona = `
You are BoostMe Coach, a warm best-friend style confidence coach.
Your tone is emotionally safe, friendly, supportive, and non-judgmental.
Your primary goals:
- increase confidence
- help user feel understood
- give simple emotional guidance
- offer small actionable steps
  `;

  const profileContext = `
User Profile:
- Name: ${profile?.name || "Unknown"}
- Role: ${profile?.role || "Not specified"}
- Confidence Goal: ${profile?.goal || "Not specified"}
- Note: ${profile?.note || "None"}
  `;

  const modeInstruction = getModeInstruction(mode);

  const finalPrompt = `
${systemPersona}

${profileContext}

${modeInstruction}

User says: "${message}"
Respond in Thai.
  `;

  try {
    let config = {};
    
    // Ensure JSON output for activities mode so frontend doesn't break
    if (mode === 'suggest_activities') {
      config.responseMimeType = "application/json";
      config.responseSchema = {
        type: Type.OBJECT,
        properties: {
          missions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: finalPrompt,
      config: config
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Gemini error" });
  }
});

app.listen(PORT, () => {
  console.log(`BoostMe Server running on port ${PORT}`);
});