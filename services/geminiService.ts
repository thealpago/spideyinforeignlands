import { GoogleGenAI, GenerateContentResponse, Chat, Modality } from "@google/genai";
import { BiomeType } from '../types';

// Ensure API Key is available.
// Vite replaces 'process.env.API_KEY' with the literal string from your .env file at build time.
// We remove the 'typeof process' check because 'process' does not exist in the browser,
// causing the check to fail even if the key was successfully replaced.
// @ts-ignore
const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.warn("API_KEY is missing. AI features will be disabled.");
}

// Only initialize AI if key exists to prevent immediate crash
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Helper to check if AI is initialized
const checkAI = () => {
    if (!ai) throw new Error("API Key missing. Cannot call Gemini API.");
    return ai;
}

// --- Text & Chat ---
export const createChat = (systemInstruction: string = "You are a helpful AI assistant.") => {
  const client = checkAI();
  return client.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
  });
};

export const sendMessage = async (chat: Chat, message: string): Promise<string> => {
  if (!ai) return "AI Offline (No Key)";
  const response: GenerateContentResponse = await chat.sendMessage({ message });
  return response.text || "No response text.";
};

// --- Grounded Search ---
export const askWithSearch = async (query: string): Promise<{ text: string; sources: any[] }> => {
  try {
    const client = checkAI();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text || "No results found.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text, sources };
  } catch (error) {
    console.error("Search error:", error);
    return { text: "Error performing search (or no API key).", sources: [] };
  }
};

// --- Vision Analysis ---
export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const client = checkAI();
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image } },
          { text: prompt }
        ]
      }
    });
    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Vision error:", error);
    return "Vision analysis unavailable.";
  }
};

// --- Video Understanding ---
export const analyzeVideo = async (videoBase64: string, prompt: string): Promise<string> => {
    try {
      const client = checkAI();
      const response = await client.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'video/mp4', data: videoBase64 } },
            { text: prompt }
          ]
        },
      });
      return response.text || "Could not analyze video.";
    } catch (e) {
        return "Video analysis failed.";
    }
}

// --- Image Generation ---
export const generateImage = async (prompt: string, aspectRatio: string = "1:1", imageSize: "1K"|"2K"|"4K" = "1K"): Promise<string | null> => {
  try {
    const client = checkAI();
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image gen error:", error);
    return null;
  }
};

// --- Image Editing ---
export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
    try {
        const client = checkAI();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: base64Image } },
                    { text: prompt }
                ]
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch(e) {
        console.error("Edit error", e);
        return null;
    }
}


// --- Thinking Mode ---
export const askWithThinking = async (prompt: string): Promise<string> => {
  try {
    const client = checkAI();
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "Thinking failed.";
  } catch (e) {
    return "Error in thinking mode.";
  }
};

// --- TTS ---
export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    try {
        const client = checkAI();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if(base64Audio) {
            const binaryString = atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        return null;
    } catch (e) {
        console.error("TTS error", e);
        return null;
    }
}

// --- Live API Connector ---
export const connectLive = async (
    onOpen: () => void,
    onAudioData: (base64: string) => void,
    onClose: () => void,
    onError: (e: any) => void
) => {
    const client = checkAI();
    return client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: onOpen,
            onmessage: (message) => {
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    onAudioData(base64Audio);
                }
            },
            onclose: onClose,
            onerror: onError
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: "You are the AI interface for a robotic spider walker. You can talk about the terrain, the physics, or just chat casually.",
        }
    });
};