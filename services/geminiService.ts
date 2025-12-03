import { GoogleGenAI, Type } from "@google/genai";
import { TaskStep, DailyMission } from "../types";

// SET THIS TO TRUE TO USE THE NODE BACKEND (server.js)
// SET TO FALSE TO USE CLIENT-SIDE SIMULATION (Demo)
const USE_BACKEND = false; 

// Initialize Gemini AI (Only needed for client-side mode)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_FAST = "gemini-2.5-flash";

// Helper to get profile data for AI context
const getProfileContext = () => {
  try {
    const profileDataJSON = localStorage.getItem('boostme_profile_data');
    if (!profileDataJSON) return null;

    const data = JSON.parse(profileDataJSON);
    return {
      name: data.name || '',
      role: data.role || '',
      goal: data.goal || '',
      note: data.note || '',
    };
  } catch (err) {
    console.error('Error reading profile from storage', err);
    return null;
  }
};

// --- Prompt Construction Helpers ---

const getProfileText = () => {
  const profile = getProfileContext();
  return profile
    ? `
User Profile:
- Name: ${profile.name || '-'}
- Role: ${profile.role || '-'}
- Confidence Goal: ${profile.goal || '-'}
- Note: ${profile.note || '-'}
`
    : 'No profile data provided.';
};

// Updated to match server.js systemPersona
const getBaseInstruction = () => `
You are BoostMe Coach, a warm best-friend style confidence coach.
Your tone is emotionally safe, friendly, supportive, and non-judgmental.
Your primary goals:
- increase confidence
- help user feel understood
- give simple emotional guidance
- offer small actionable steps

You must always connect your advice to the user's personal profile.

${getProfileText()}
`;

// --- Service Functions ---

/**
 * Creates a chat session for the Boost Assistant.
 */
export const createChatSession = () => {
  if (USE_BACKEND) {
    // Return a mock chat object that calls the backend
    return {
      sendMessageStream: async ({ message }: { message: string }) => {
        try {
          const profile = getProfileContext();
          const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, profile, mode: 'chat' }),
          });
          
          if (!response.ok) throw new Error('Backend error');
          
          const data = await response.json();
          
          // Mock stream generator for compatibility
          async function* generator() {
             yield { text: data.reply };
          }
          return generator();
        } catch (error) {
          console.error("Backend Chat Error:", error);
          throw error;
        }
      }
    };
  }

  // Client-side implementation
  // Matches server.js "Chat" mode instruction
  const modeInstruction = `
Mode: Chat
Task:
- Respond naturally like a supportive best friend
- Reference user's role and goal
- Offer 1-2 practical actions
- Respond in Thai
`;

  const systemInstruction = `
${getBaseInstruction()}

${modeInstruction}
`;

  return ai.chats.create({
    model: MODEL_FAST,
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

/**
 * Generates tailored daily missions based on user profile.
 */
export const generateTailoredMissions = async (): Promise<DailyMission[]> => {
  if (USE_BACKEND) {
    try {
      const profile = getProfileContext();
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Requesting missions', profile, mode: 'suggest_activities' }),
      });

      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      
      // The backend returns a string JSON, we need to parse it if it's stringified
      // or if backend returns { reply: "..." } where "..." is the JSON string.
      let missionsData;
      try {
         missionsData = JSON.parse(data.reply);
      } catch {
         missionsData = { missions: [] };
      }

      return (missionsData.missions || []).map((text: string, index: number) => ({
        id: Date.now() + index,
        text: text,
        completed: false
      }));

    } catch (error) {
      console.error("Backend Mission Error:", error);
      throw error;
    }
  }

  // Client-side implementation
  // Matches server.js "Suggest Daily Activities" mode instruction
  const modeInstruction = `
Mode: Suggest Daily Activities
Task:
- Provide 3-5 short confidence-boosting activities
- Must match user's role, goal, and emotional context
- Keep tone warm and friendly
- Respond in Thai
`;

  const systemInstruction = `
${getBaseInstruction()}

${modeInstruction}
`;

  try {
    const userRequest = "ช่วยแนะนำกิจกรรมรายวัน 3–5 ข้อที่เหมาะกับฉันวันนี้หน่อย";

    const prompt = `
      ${systemInstruction}

      User Request: ${userRequest}
      
      IMPORTANT: Return response ONLY as a JSON object with a "missions" array of strings.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            missions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text || '{"missions": []}');
    const missions: string[] = data.missions || [];

    if (missions.length === 0) throw new Error("No missions generated");

    return missions.map((text, index) => ({
      id: Date.now() + index,
      text: text,
      completed: false
    }));

  } catch (error) {
    console.error("Error generating tailored missions:", error);
    // Fallback missions
    return [
      { id: Date.now() + 1, text: 'ยิ้มให้ตัวเองในกระจก 1 นาที', completed: false },
      { id: Date.now() + 2, text: 'เขียนข้อดีของตัวเอง 3 ข้อ', completed: false },
      { id: Date.now() + 3, text: 'จัดโต๊ะทำงานให้เรียบร้อย', completed: false },
    ];
  }
};

/**
 * Generates a supportive response for the daily check-in.
 */
export const generateCheckInSupport = async (score: number, mood: string, note: string): Promise<string> => {
  // Uses similar profile context logic
  const profileText = getProfileText();

  try {
    // Mode: Emotional Reflection (similar to reflect mode in server.js)
    const prompt = `
      ${getBaseInstruction()}

      Mode: Emotional Reflection
      Task:
      - Reflect the user's emotions
      - Validate feelings
      - Offer emotional insight and simple next steps
      - Respond in Thai

      User Check-in:
      - Confidence Score: ${score}/10
      - Mood: ${mood}
      - Note: "${note}"
      
      Reply shortly (max 2 sentences).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
    });

    return response.text || "เก่งมาก! สู้ต่อไปนะ เราอยู่ข้างๆ เสมอ";
  } catch (error) {
    console.error("Error generating check-in support:", error);
    return "ไม่เป็นไรนะ วันพรุ่งนี้จะเป็นวันที่ดีกว่าเดิมแน่นอน";
  }
};

/**
 * Generates a motivational quote based on mood.
 */
export const generateMotivation = async (mood: string): Promise<string> => {
  try {
    const prompt = `
      Generate a short, powerful motivational quote or affirmation for someone feeling "${mood}".
      Limit to one sentence, under 20 words.
      Make it inspiring and uplifting.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
    });

    return response.text?.trim() || "You are stronger than you think.";
  } catch (error) {
    console.error("Error generating motivation:", error);
    return "Keep going, you are doing great.";
  }
};

/**
 * Breaks down a complex task into manageable steps using JSON schema.
 */
export const breakDownTask = async (taskDescription: string): Promise<TaskStep[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Break down the following task into 3 to 6 actionable, concrete steps. 
      Task: "${taskDescription}".
      Make the steps specific and easy to start.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A short title for the step" },
              description: { type: Type.STRING, description: "One sentence explaining what to do" },
              duration: { type: Type.STRING, description: "Estimated time (e.g., '10 mins')" },
            },
            required: ["title", "description", "duration"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as TaskStep[];
  } catch (error) {
    console.error("Error breaking down task:", error);
    throw new Error("Failed to break down task. Please try again.");
  }
};