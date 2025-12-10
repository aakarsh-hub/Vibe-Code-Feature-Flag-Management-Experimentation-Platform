import { GoogleGenAI, Type } from "@google/genai";
import { FeatureFlag, AIAnalysisResult } from "../types";

// Safety check for API Key
const apiKey = process.env.API_KEY || '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeFlagRisk = async (flag: FeatureFlag): Promise<AIAnalysisResult> => {
  if (!ai) {
    return {
      riskScore: 0,
      summary: "API Key missing. Cannot generate AI insights.",
      suggestions: ["Add your Gemini API Key to env variables."]
    };
  }

  const prompt = `
    Analyze the risk of this feature flag configuration.
    
    Flag Name: ${flag.name}
    Key: ${flag.key}
    Environment: ${flag.environment}
    Rollout: ${flag.rolloutPercentage}%
    Type: ${flag.type}
    Description: ${flag.description}
    Rules: ${JSON.stringify(flag.rules)}
    
    Provide a JSON response with a risk score (0-100), a short summary, and 3 specific suggestions for safe rollout.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    return {
      riskScore: 50,
      summary: "Could not analyze at this time due to an error.",
      suggestions: ["Check console logs", "Ensure API key is valid"]
    };
  }
};

export const generateFlagDescription = async (name: string): Promise<string> => {
    if (!ai) return "Enter a description...";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Write a concise, professional description (max 1 sentence) for a software feature flag named "${name}".`
        });
        return response.text || "";
    } catch (e) {
        return "";
    }
}
