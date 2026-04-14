import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AnalysisResult {
  atsScore: number;
  missingWeak: string[];
  rewrittenBullets: string[];
  linkedinSummary: string;
  topSkills: string[];
}

export async function analyzeResume(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  const prompt = `
    Analyze the following resume against the job description.
    
    Resume:
    ${resumeText}
    
    Job Description:
    ${jobDescription}
    
    Return a JSON object with the following structure:
    {
      "atsScore": number (0-100),
      "missingWeak": string[] (list of what's missing or weak),
      "rewrittenBullets": string[] (3-5 improved bullet points),
      "linkedinSummary": string (tailored LinkedIn summary),
      "topSkills": string[] (5 key skills to add)
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          atsScore: { type: Type.NUMBER },
          missingWeak: { type: Type.ARRAY, items: { type: Type.STRING } },
          rewrittenBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          linkedinSummary: { type: Type.STRING },
          topSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["atsScore", "missingWeak", "rewrittenBullets", "linkedinSummary", "topSkills"],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}
