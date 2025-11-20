import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { ImageSize, DreamAnalysis } from '../types';

// Helper to ensure fresh instance with potentially new key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  // Using flash for fast, accurate audio transcription
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64
          }
        },
        {
          text: "Transcribe the spoken audio into text exactly as it was spoken. Do not add any commentary."
        }
      ]
    }
  });
  return response.text || "";
};

export const generateDreamImage = async (description: string, size: ImageSize): Promise<string | null> => {
  const ai = getAI();
  const prompt = `A surrealist masterpiece painting representing this dream: "${description}". 
  The style should be dreamlike, ethereal, emotional, and symbolic, reminiscent of Dali or Magritte but modern.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: '1:1'
        }
      }
    });

    // Iterate through parts to find the image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const analyzeDream = async (transcript: string): Promise<DreamAnalysis> => {
  const ai = getAI();
  const prompt = `Analyze the following dream based on Jungian psychology.
  
  Dream: "${transcript}"
  
  Return the response in JSON format with the following structure:
  {
    "summary": "A one-sentence summary of the dream",
    "emotionalTheme": "The core emotion (e.g., Anxiety, Wonder)",
    "archetypes": [
       { "name": "Archetype Name", "description": "How it manifests in this dream" }
    ],
    "interpretation": "A deep psychological interpretation of the symbolism."
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          emotionalTheme: { type: Type.STRING },
          archetypes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          interpretation: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No analysis generated");
  return JSON.parse(text) as DreamAnalysis;
};

export const createDreamChat = (transcript: string, analysis: DreamAnalysis): Chat => {
  const ai = getAI();
  const systemInstruction = `You are a compassionate and insightful Jungian dream analyst. 
  The user has just shared a dream.
  
  Dream Context: "${transcript}"
  
  Your Initial Analysis:
  Summary: ${analysis.summary}
  Theme: ${analysis.emotionalTheme}
  Interpretation: ${analysis.interpretation}

  Answer the user's follow-up questions about specific symbols, feelings, or meanings in the dream. 
  Keep answers concise (under 150 words) but profound. Maintain a mystical yet therapeutic tone.`;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction
    }
  });
};
