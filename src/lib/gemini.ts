import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiClient = () => {
    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
