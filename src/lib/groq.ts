export interface AnalysisResult {
  atsScore: number;
  formattingScore: number;
  readabilityScore: number;
  keywordMatch: number;
  missingWeak: string[];
  rewrittenBullets: { original: string; optimized: string }[];
  linkedinSummary: string;
  topSkills: string[];
  coverLetter: string;
  interviewQA: { question: string; answer: string }[];
}

export async function analyzeResume(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resumeText, jobDescription }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze resume');
  }

  return await response.json();
}
