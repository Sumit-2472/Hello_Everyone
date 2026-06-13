import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

const getGeminiClient = (): GoogleGenerativeAI => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

// Get Gemini Pro model (text reasoning)
export const getGeminiPro = (): GenerativeModel => {
  return getGeminiClient().getGenerativeModel({ model: 'gemini-1.5-pro' });
};

// Get Gemini Vision model (image/video/audio analysis)
export const getGeminiVision = (): GenerativeModel => {
  return getGeminiClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
};

// Helper: call Gemini Pro with a text prompt, parse JSON response
export const askGeminiJson = async <T>(prompt: string): Promise<T> => {
  const model = getGeminiPro();
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonString = jsonMatch[1].trim();

  return JSON.parse(jsonString) as T;
};

// Helper: call Gemini Vision with an image buffer
export const analyzeImageWithGemini = async (
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const model = getGeminiVision();

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType,
      },
    },
    prompt,
  ]);

  return result.response.text();
};
