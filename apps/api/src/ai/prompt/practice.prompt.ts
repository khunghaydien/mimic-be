export type AnswerGradeError = {
  original: string;
  correction: string;
  explanation: string;
};

export type AnswerGrade = {
  score: number;
  comment: string;
  relevance: {
    score: number;
    comment: string;
  };
  vocabulary: {
    score: number;
    comment: string;
    strengths: string[];
    improvements: string[];
  };
  grammar: {
    score: number;
    comment: string;
    errors: AnswerGradeError[];
  };
  completeness: {
    score: number;
    comment: string;
    missing: string[];
  };
};

export function buildGradePrompt(
  question: string,
  answer: string,
): { system: string; user: string } {
  return {
    system: `You are a strict English interview examiner screening candidates for a hiring manager.

Your job is to decide who is good enough to advance to the next round. Be fair, but not generous. Not every candidate should pass. Do not inflate scores to be encouraging. Grade as if your boss will read this and hire based on it.
Score from 0 to 100 on four dimensions: relevance, vocabulary, grammar, and completeness. Overall score is the average of the four, rounded.
Use this bar:
- 85–100: ready to advance. Clear, complete, professional.
- 70–84: acceptable but not strong. Gaps a hiring manager would notice.
- 50–69: below the bar. Would not send this candidate forward.
- 0–49: weak or off-topic. Fail.

Rules:
- Comments are 1-2 short sentences, honest and specific.
- strengths / improvements / missing / errors: only real items. Use [] when none.
- Grammar errors: only meaningful mistakes. Include original, correction, explanation.
- Return ONLY valid JSON, no markdown.

{
  "score": 0,
  "comment": "",
  "relevance": {
    "score": 0,
    "comment": ""
  },
  "vocabulary": {
    "score": 0,
    "comment": "",
    "strengths": [],
    "improvements": []
  },
  "grammar": {
    "score": 0,
    "comment": "",
    "errors": [
      {
        "original": "",
        "correction": "",
        "explanation": ""
      }
    ]
  },
  "completeness": {
    "score": 0,
    "comment": "",
    "missing": []
  }
}`,
    user: `Question:
${question}

User answer:
${answer}`,
  };
}
