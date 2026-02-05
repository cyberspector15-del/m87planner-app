/**
 * AI Service - API-agnostic interface for AI operations
 * 
 * This service abstracts AI calls so the underlying provider can be swapped
 * without changing application code. Supports both silent execution and
 * conversational modes.
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  data?: any;
  needsMoreInfo?: boolean;
  followUpQuestion?: string;
}

export interface ConversationContext {
  messages: AIMessage[];
  sessionId: string;
  startedAt: Date;
}

export interface AIServiceConfig {
  mode: "silent" | "conversational";
  userId: string;
}

// Default configuration - can be overridden
let currentConfig: AIServiceConfig = {
  mode: "silent",
  userId: "",
};

/**
 * Initialize the AI service with configuration
 */
export const initializeAIService = (config: Partial<AIServiceConfig>) => {
  currentConfig = { ...currentConfig, ...config };
};

/**
 * Get current AI service mode
 */
export const getAIMode = (): "silent" | "conversational" => {
  return currentConfig.mode;
};

/**
 * Set AI service mode
 */
export const setAIMode = (mode: "silent" | "conversational") => {
  currentConfig.mode = mode;
};

/**
 * Create a new conversation context for multi-turn dialogue
 */
export const createConversationContext = (): ConversationContext => {
  return {
    messages: [],
    sessionId: crypto.randomUUID(),
    startedAt: new Date(),
  };
};

/**
 * Add a message to conversation context
 */
export const addToConversation = (
  context: ConversationContext,
  role: "user" | "assistant",
  content: string
): ConversationContext => {
  return {
    ...context,
    messages: [...context.messages, { role, content }],
  };
};

/**
 * Clear conversation context
 */
export const clearConversation = (context: ConversationContext): ConversationContext => {
  return {
    ...context,
    messages: [],
  };
};

/**
 * Check if a response requires follow-up
 */
export const needsFollowUp = (response: AIResponse): boolean => {
  return response.needsMoreInfo === true && !!response.followUpQuestion;
};

/**
 * Format the system prompt for the AI based on mode
 */
export const getSystemPrompt = (mode: "silent" | "conversational"): string => {
  if (mode === "silent") {
    return `You are an AI assistant for M87 Planner that interprets natural language commands to create tasks and events.
You execute commands directly without asking follow-up questions.
Always try to infer reasonable defaults when information is missing.`;
  }

  return `You are an AI assistant for M87 Planner that helps users plan their day through conversation.
You can ask clarifying questions to better understand the user's needs.
When you need more information, respond with a question and set needsMoreInfo to true.
When you have enough information, create the tasks/events and set needsMoreInfo to false.
Be concise and helpful. Keep responses under 100 words.`;
};

/**
 * Utility to estimate token usage (rough approximation)
 * Useful for cost tracking and rate limiting
 */
export const estimateTokens = (text: string): number => {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
};

/**
 * Utility to format conversation for logging
 */
export const formatConversationForLog = (context: ConversationContext): string => {
  return context.messages
    .map(m => `[${m.role}]: ${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''}`)
    .join('\n');
};
