
import { GoogleGenAI, Type } from "@google/genai";
import { Airport, Message } from "../types.ts";

/**
 * Helper to ensure we always have a valid AI client.
 * We create a new instance right before the call to ensure it uses the latest API key.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const interpretWeather = async (metar: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Interpret this METAR for a pilot: ${metar}`,
      config: {
        systemInstruction: "You are an aviation weather specialist. Decode the METAR and provide a clear plain-language summary focusing on flight safety. IMPORTANT: Do not use headers like 'Bottom Line' or 'Conclusion'. Instead, label the final wrap-up or summary section as 'Flight Information'.",
      }
    });
    
    return response.text || "Unable to decode METAR.";
  } catch (error) {
    console.error("Gemini interpretation failed:", error);
    return "Weather interpretation service unavailable.";
  }
};

export const getLiveAirportInfo = async (icao: string): Promise<{ text: string, links: { title: string, uri: string }[] }> => {
  try {
    const ai = getAiClient();
    // Using gemini-3-flash-preview for search grounding as per recommended basic text/grounding tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `What are the current operational status, active NOTAMs, or significant delays at ${icao} airport right now? Provide a concise summary for a pilot.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a Flight Operations Officer. Provide highly accurate, real-time airport status updates for pilots based on current information.",
      }
    });

    const text = response.text || "No recent intelligence found for this airport.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const links = chunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Source",
        uri: chunk.web.uri
      }));

    return { text, links };
  } catch (error: any) {
    console.error("Grounding search failed:", error);
    
    // Check if it's a permission error or model/entity not found
    const errorMsg = error?.message || "";
    if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
      return { 
        text: "Access Denied: Google Search tool requires a paid API key from a project with the tool enabled. Please ensure your billing project is correctly configured.", 
        links: [] 
      };
    }
    
    if (errorMsg.includes("Requested entity was not found")) {
      // This is a specific signal for key selection issues
      return { 
        text: "Configuration Error: API project not found. Please re-select your API key.", 
        links: [] 
      };
    }

    return { text: "Real-time search unavailable. Check official FAA/NOTAM portals.", links: [] };
  }
};

export const searchAirport = async (query: string): Promise<Airport | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find details for airport: ${query}. Return JSON with icao, name, lat, lng, elev, runways (array of objects with ident, length, width, surface).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            icao: { type: Type.STRING },
            name: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            elev: { type: Type.NUMBER },
            runways: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ident: { type: Type.STRING },
                  length: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  surface: { type: Type.STRING },
                },
                required: ["ident", "length", "width", "surface"]
              }
            }
          },
          required: ["icao", "name", "lat", "lng", "elev", "runways"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as Airport;
    }
    return null;
  } catch (error) {
    console.error("Airport search failed:", error);
    return null;
  }
};

export const chatWithCopilot = async (history: Message[]): Promise<string> => {
  try {
    const ai = getAiClient();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are an expert AI Copilot for pilots. Assist with aviation-related queries including weather (METAR/TAF), flight calculations, regulations (FAR/AIM), and navigation. Be professional, concise, and prioritize safety.",
      },
    });

    const lastMessage = history[history.length - 1].content;
    const response = await chat.sendMessage({ message: lastMessage });
    
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Copilot chat failed:", error);
    return "Copilot services are currently unavailable. Please verify your instruments manually.";
  }
};
