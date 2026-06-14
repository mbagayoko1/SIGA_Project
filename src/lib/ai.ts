/**
 * Thin wrapper around the Gemini SDK that degrades gracefully.
 *
 * The whole platform should keep working whether or not a GEMINI_API_KEY is
 * present. When a key exists we call the real model; when it doesn't (or the
 * call fails) callers fall back to locally-generated, data-grounded text.
 */
import { GoogleGenAI } from '@google/genai';

const API_KEY = (process.env.GEMINI_API_KEY || '').trim();
// Overridable so a newer/older model can be selected without code changes.
const MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

export const hasGemini = API_KEY.length > 0;

const ai = hasGemini ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/**
 * Generate plain text / markdown from a prompt. Throws if no key is configured
 * or the request fails — callers are expected to catch and use a local fallback.
 */
export async function generateNarrative(prompt: string): Promise<string> {
  if (!ai) throw new Error('GEMINI_API_KEY is not configured.');
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  const text = response.text?.trim();
  if (!text) throw new Error('Model returned an empty response.');
  return text;
}

/**
 * Generate structured JSON from a prompt. Throws if no key is configured, the
 * request fails, or the response is not valid JSON — callers fall back to local
 * data. Tolerates ```json fenced responses.
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
  if (!ai) throw new Error('GEMINI_API_KEY is not configured.');
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });
  const raw = response.text?.trim();
  if (!raw) throw new Error('Model returned an empty response.');
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned) as T;
}
