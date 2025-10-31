import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-flash-lite-latest';
let client;

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in your environment.');
  }
  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
};

export const getGenerativeModel = (modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL) => {
  const genClient = getClient();
  return genClient.getGenerativeModel({ model: modelName });
};

export const generateBookInsights = async ({ title, author, genre, summary }) => {
  const model = getGenerativeModel();

  const prompt = `You are an assistant for an online bookstore.
Given the following book information, craft:
1. A short, energetic marketing blurb (2 sentences max).
2. Two engaging discussion questions for a book club.
3. A suggested reader profile describing who would love this book.

Return each section on its own line prefixed with a label.

Title: ${title}
Author: ${author}
Genre: ${genre}
Summary: ${summary}`;

  const response = await model.generateContent(prompt);
  const output = response.response?.text?.() ?? response.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!output) {
    throw new Error('Gemini returned an empty response.');
  }
  return output.trim();
};
