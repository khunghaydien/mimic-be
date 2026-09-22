import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  getOpenAiApiKey,
  getOpenAiBaseUrl,
  getOpenAiChatModel,
  getOpenAiSttModel,
  getOpenAiTtsModel,
  getOpenAiTtsVoice,
} from "./ai.config";
import {
  LIBRARY_QUESTION_KEYS,
  buildLibraryQuestionsPrompt,
  type LibraryQuestionsResult,
} from "./prompt";

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

@Injectable()
export class AiService {
  async generateLibraryQuestions(
    topic: string,
  ): Promise<LibraryQuestionsResult> {
    const { system, user } = buildLibraryQuestionsPrompt(topic);
    const content = await this.completeChat({
      system,
      user,
    });
    return this.parseLibraryQuestions(content);
  }

  async textToSpeech(text: string): Promise<Buffer> {
    let apiKey: string;
    try {
      apiKey = getOpenAiApiKey();
    } catch {
      throw new ServiceUnavailableException("OpenAI is not configured");
    }

    let response: Response;
    try {
      response = await fetch(`${getOpenAiBaseUrl()}/audio/speech`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: getOpenAiTtsModel(),
          voice: getOpenAiTtsVoice(),
          input: text,
          response_format: "mp3",
        }),
      });
    } catch {
      throw new BadGatewayException("OpenAI speech request failed");
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new BadGatewayException(
        payload.error?.message || "OpenAI speech request failed",
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async speechToText(input: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }): Promise<string> {
    let apiKey: string;
    try {
      apiKey = getOpenAiApiKey();
    } catch {
      throw new ServiceUnavailableException("OpenAI is not configured");
    }

    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(input.buffer)], { type: input.mimeType }),
      input.filename,
    );
    form.append("model", getOpenAiSttModel());
    form.append("language", "en");

    let response: Response;
    try {
      response = await fetch(`${getOpenAiBaseUrl()}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
        signal: AbortSignal.timeout(3 * 60 * 1000),
      });
    } catch {
      throw new BadGatewayException("OpenAI transcription request failed");
    }

    const payload = (await response.json().catch(() => ({}))) as {
      text?: string;
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new BadGatewayException(
        payload.error?.message || "OpenAI transcription failed",
      );
    }
    return (payload.text ?? "").trim();
  }

  private async completeChat(input: {
    system: string;
    user: string;
  }): Promise<string> {
    let apiKey: string;
    try {
      apiKey = getOpenAiApiKey();
    } catch {
      throw new ServiceUnavailableException("OpenAI is not configured");
    }

    let response: Response;
    try {
      response = await fetch(`${getOpenAiBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: getOpenAiChatModel(),
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user },
          ],
        }),
      });
    } catch {
      throw new BadGatewayException("OpenAI request failed");
    }

    const payload = (await response
      .json()
      .catch(() => ({}))) as ChatCompletionResponse;
    if (!response.ok) {
      throw new BadGatewayException(
        payload.error?.message || "OpenAI request failed",
      );
    }

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new BadGatewayException("OpenAI returned an empty response");
    }
    return content;
  }

  private parseLibraryQuestions(content: string): LibraryQuestionsResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.stripFence(content));
    } catch {
      throw new BadGatewayException(
        "OpenAI returned an invalid questions format",
      );
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new BadGatewayException(
        "OpenAI returned an invalid questions format",
      );
    }

    const source = parsed as Record<string, unknown>;
    const result = {} as LibraryQuestionsResult;

    for (const key of LIBRARY_QUESTION_KEYS) {
      const value = source[key];
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new BadGatewayException("OpenAI returned incomplete questions");
      }
      const item = value as Record<string, unknown>;
      if (
        typeof item.content !== "string" ||
        item.content.trim() === "" ||
        typeof item.hint !== "string" ||
        item.hint.trim() === ""
      ) {
        throw new BadGatewayException("OpenAI returned incomplete questions");
      }
      result[key] = {
        content: item.content.trim(),
        hint: item.hint.trim(),
      };
    }

    return result;
  }

  private stripFence(content: string): string {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return (fenced?.[1] ?? content).trim();
  }
}
