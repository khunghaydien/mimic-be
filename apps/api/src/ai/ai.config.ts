import * as dotenv from "dotenv";

dotenv.config();

export function getOpenAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return key;
}

export function getOpenAiChatModel(): string {
  return process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
}

export function getOpenAiBaseUrl(): string {
  return (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
}

export function getOpenAiTtsModel(): string {
  return process.env.OPENAI_TTS_MODEL ?? "tts-1";
}

export function getOpenAiTtsVoice(): string {
  return process.env.OPENAI_TTS_VOICE ?? "alloy";
}
