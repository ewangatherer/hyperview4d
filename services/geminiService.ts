import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getShapeInsight = async (shapeName: string, context: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert mathematician and geometry teacher.
      Provide a short, fascinating insight or "fun fact" about the 4D shape: ${shapeName}.
      Context: The user is visualizing this shape rotating in 4D space.
      Keep the response under 50 words. Focus on intuition or mind-blowing properties.
      Current user context: ${context}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Could not generate insight at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI is currently contemplating higher dimensions (Error connecting to API).";
  }
};