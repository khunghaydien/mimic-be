export type LibraryQuestionsResult = Record<
  string,
  { content: string; hint: string }
>;

export function buildLibraryQuestionsPrompt(topic: string): {
  system: string;
  user: string;
} {
  return {
    system: `You generate speaking practice cards for a study library.
Return exactly 5 distinct items about the given topic.
Write everything in clear, natural English. If the topic is not English, translate it and rewrite the questions in polished English.
Each item must include:
- content: a complete, self-contained question ending with a question mark. Rephrase for clarity; do not copy awkward wording.
- hint: a short speaking outline the learner can use to answer in about 1-2 minutes. Use 3-5 brief bullet points (ideas, examples, structure). Do not write a full model answer. Do not reveal a complete essay or script.
Do not include numbering outside the JSON keys, markdown fences, or extra commentary.
Return a JSON object whose keys are exactly "1","2","3","4","5".`,
    user: `Topic: ${topic}

JSON shape:
{
  "1": {"content":"...","hint":"- point 1\\n- point 2\\n- point 3"},
  "2": {"content":"...","hint":"..."},
  "3": {"content":"...","hint":"..."},
  "4": {"content":"...","hint":"..."},
  "5": {"content":"...","hint":"..."}
}`,
  };
}
