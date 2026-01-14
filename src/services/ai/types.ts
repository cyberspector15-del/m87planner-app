// AI Service Types - API-agnostic abstraction layer

export type AIMode = "silent" | "conversational";

export type SubscriptionTier = "free" | "pro";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIUsageStatus {
  used: number;
  limit: number;
  tier: SubscriptionTier;
  remaining: number;
  conversationModeEnabled: boolean;
  canUseConversationMode: boolean;
}

export interface AIIncrementResult {
  allowed: boolean;
  used: number;
  limit: number;
  tier: SubscriptionTier;
  remaining: number;
}

export interface SilentCommandResult {
  action: string;
  message: string;
  created?: {
    tasks: any[];
    routines: any[];
  };
}

export interface ConversationalTurnResult {
  response: string;
  isComplete: boolean;
  action?: string;
  created?: {
    tasks: any[];
    routines: any[];
  };
}

// Configuration for the AI service - can be swapped for different providers
export interface AIProviderConfig {
  name: string;
  model: string;
  endpoint: string;
  apiKeyEnvVar: string;
}

// Default provider configurations (can be extended)
export const AI_PROVIDERS: Record<string, AIProviderConfig> = {
  lovable: {
    name: "Lovable AI Gateway",
    model: "google/gemini-2.5-flash",
    endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
    apiKeyEnvVar: "LOVABLE_API_KEY",
  },
  // Future providers can be added here without UI changes
  // openai: { ... },
  // gemini: { ... },
  // opensource: { ... },
};

// Tier limits
export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 3,
  pro: 20,
};
