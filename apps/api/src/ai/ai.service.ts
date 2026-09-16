import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  getOpenAiApiKey,
  getOpenAiBaseUrl,
  getOpenAiChatModel,
} from "./ai.config";
import {
  LIBRARY_QUESTION_KEYS,
  buildLibraryQuestionsPrompt,
  type LibraryQuestionsResult,
} from "./prompts";

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
