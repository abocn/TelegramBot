import type { Context } from "telegraf"
import type { Message } from "telegraf/types"
import * as schema from '../../database/schema'

type TextContext = Context & { message: Message.TextMessage }

type User = typeof schema.usersTable.$inferSelect

interface OllamaResponse {
  response: string;
}

interface AiRequest {
  task: () => Promise<void>;
  ctx: TextContext;
  wasQueued: boolean;
  userId: number;
  model: string;
  abortController?: AbortController;
}

interface ModelInfo {
  name: string;
  label: string;
  descriptionEn: string;
  descriptionPt: string;
  models: Array<{
    name: string;
    label: string;
    parameterSize: string;
    thinking: boolean;
    uncensored: boolean;
  }>;
}

export {
  type TextContext,
  type User,
  type OllamaResponse,
  type AiRequest,
  type ModelInfo
}