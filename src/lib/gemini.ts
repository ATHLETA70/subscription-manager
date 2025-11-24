import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiClient = () => {
    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set");
        return null;
    }
    return new GoogleGenerativeAI(apiKey);
};

export const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
