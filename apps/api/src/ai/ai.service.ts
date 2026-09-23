import { Injectable } from "@nestjs/common";
import {
  getOpenAiApiKey,
  getOpenAiBaseUrl,
  getOpenAiChatModel,
  getOpenAiSttModel,
  getOpenAiTtsModel,
  getOpenAiTtsVoice,
} from "./ai.config";
import {
  buildGradePrompt,
  buildLibraryQuestionsPrompt,
  type AnswerGrade,
  type LibraryQuestionsResult,
} from "./prompt";

@Injectable()
export class AiService {
  async generateLibraryQuestions(
    topic: string,
  ): Promise<LibraryQuestionsResult> {
    const { system, user } = buildLibraryQuestionsPrompt(topic);
    return JSON.parse(await this.chat(system, user));
  }

  async gradeAnswer(question: string, answer: string): Promise<AnswerGrade> {
    const { system, user } = buildGradePrompt(question, answer);
    return JSON.parse(await this.chat(system, user));
  }

  async textToSpeech(text: string): Promise<Buffer> {
    const response = await this.request("/audio/speech", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: getOpenAiTtsModel(),
        voice: getOpenAiTtsVoice(),
        input: text,
        response_format: "mp3",
      }),
    });
    return Buffer.from(await response.arrayBuffer());
  }

  async speechToText(file: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }): Promise<string> {
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }),
      file.filename,
    );
    form.append("model", getOpenAiSttModel());
    form.append("language", "en");

    const response = await this.request("/audio/transcriptions", {
      body: form,
      signal: AbortSignal.timeout(3 * 60 * 1000),
    });
    const { text } = await response.json();
    return text.trim();
  }

  private async chat(system: string, user: string): Promise<string> {
    const response = await this.request("/chat/completions", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: getOpenAiChatModel(),
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    const payload = await response.json();
    return payload.choices[0].message.content;
  }

  private request(path: string, init: RequestInit) {
    const { headers, ...rest } = init;
    return fetch(`${getOpenAiBaseUrl()}${path}`, {
      method: "POST",
      ...rest,
      headers: {
        Authorization: `Bearer ${getOpenAiApiKey()}`,
        ...headers,
      },
    });
  }
}
