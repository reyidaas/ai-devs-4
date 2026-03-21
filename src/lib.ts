import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import OpenAI from 'openai';

export const openAIClient = new OpenAI({
  apiKey: '',
  baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
});

export const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
