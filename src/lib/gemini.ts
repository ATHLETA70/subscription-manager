import type { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiClient = (): GoogleGenerativeAI | null => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set");
        return null;
    }
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    return new GoogleGenerativeAI(apiKey);
};

export const GEMINI_MODEL_NAME = "gemini-2.5-pro";
