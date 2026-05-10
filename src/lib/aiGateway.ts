import { supabase } from "@/integrations/supabase/client";

const AI_GATEWAY_URL =
  "https://rwbhsookqbkxaqodqutl.supabase.co/functions/v1/ai-gateway";

// ── Message type used by conversation and ai-command modes ──
export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ── Minimal task shape sent to the Edge Function ──
export interface AITask {
  id: string;
  title: string;
  description?: string | null;
  priority?: number;
  duration_minutes?: number;
  deadline?: string | null;
  flexible?: boolean;
  completed?: boolean;
}

// ── Union of all supported modes ──
export type AIGatewayMode =
  | "ai-command"
  | "conversation"
  | "auto-scheduler"
  | "smart-reschedule";

// ── Request payload ──
export interface AIGatewayRequest {
  mode: AIGatewayMode;
  messages?: AIMessage[];
  tasks?: AITask[];
  metadata?: Record<string, unknown>;
}

// ── Success response from the Edge Function ──
export interface AIGatewayResponse {
  success: boolean;
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed: Record<string, any> | null;
  mode: string;
}

/**
 * callAIGateway — single source of truth for all AI feature calls.
 *
 * Automatically retrieves the current Supabase session, attaches the JWT
 * as a Bearer token, and POSTs to the deployed ai-gateway Edge Function.
 *
 * @throws Error with a user-friendly message on auth failure or HTTP error.
 */
export async function callAIGateway(
  request: AIGatewayRequest
): Promise<AIGatewayResponse> {
  // 1. Get session & extract access token
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Not authenticated. Please sign in to use AI features.");
  }

  const { access_token, user } = session;

  // 2. Build request body
  const body: Record<string, unknown> = {
    userId: user.id,
    mode: request.mode,
  };
  if (request.messages !== undefined) body.messages = request.messages;
  if (request.tasks !== undefined) body.tasks = request.tasks;
  if (request.metadata !== undefined) body.metadata = request.metadata;

  // 3. POST to Edge Function with Bearer JWT
  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // 4. Handle HTTP errors — surface message from JSON if available
  if (!response.ok) {
    let errorMessage = `AI Gateway error (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.error) errorMessage = errorJson.error;
      else if (errorJson?.message) errorMessage = errorJson.message;
    } catch {
      // ignore parse failure — use generic message above
    }
    throw new Error(errorMessage);
  }

  // 5. Return parsed response
  const data: AIGatewayResponse = await response.json();
  return data;
}
