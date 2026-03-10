# Edge Functions - AI Provider Migration Guide

## Current State

The following edge functions currently use Lovable's AI Gateway and need to be refactored:

### 1. nlp-parse
**File**: `supabase/functions/nlp-parse/index.ts`
- **Purpose**: Natural language processing for task creation
- **Current Dependency**: Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`)
- **Required Environment Variable**: `LOVABLE_API_KEY`

### 2. auto-plan
**File**: `supabase/functions/auto-plan/index.ts`
- **Purpose**: AI-powered automatic scheduling and day planning
- **Current Dependency**: Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`)
- **Required Environment Variable**: `LOVABLE_API_KEY`

## Migration Options

### Option A: Replace with OpenAI

1. Update the API endpoint to `https://api.openai.com/v1/chat/completions`
2. Replace `LOVABLE_API_KEY` with `OPENAI_API_KEY`
3. Adjust the model name (e.g., `gpt-4` or `gpt-3.5-turbo`)

**Example changes for nlp-parse/index.ts:**
```typescript
// Line 117-119: Replace
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
if (!LOVABLE_API_KEY) {
  throw new Error("LOVABLE_API_KEY is not configured");
}

// With:
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not configured");
}

// Line 142: Replace
const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {

// With:
const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {

// Line 145: Replace
Authorization: `Bearer ${LOVABLE_API_KEY}`,

// With:
Authorization: `Bearer ${OPENAI_API_KEY}`,

// Line 149: Replace model
model: "google/gemini-2.5-flash",

// With:
model: "gpt-4-turbo-preview", // or "gpt-3.5-turbo" for lower cost
```

### Option B: Replace with Anthropic Claude

1. Update the API endpoint to `https://api.anthropic.com/v1/messages`
2. Replace `LOVABLE_API_KEY` with `ANTHROPIC_API_KEY`
3. Adjust the request format (Anthropic uses a different API structure)

### Option C: Disable AI Features Temporarily

1. Comment out or remove the AI-dependent edge functions
2. Update the frontend to hide/disable AI features:
   - NLP task creation input
   - Auto-planning button
   - Conversational mode

**Files to modify in frontend:**
- `src/hooks/useNLPParse.ts` - Comment out the edge function call
- `src/hooks/useAutoPlan.ts` - Comment out the edge function call
- Update UI components to hide these features

## Recommended Approach

**For immediate deployment**: Use Option C (disable AI features) to get the app running with your own Supabase instance.

**For full functionality**: Use Option A (OpenAI) as it has the most similar API structure to the current implementation.

## Next Steps

1. Choose your migration option
2. Update the edge functions accordingly
3. Add the necessary API keys to your Supabase project's edge function secrets
4. Test the functionality

## Setting Supabase Edge Function Secrets

Once you have your API key:

```bash
# Using Supabase CLI
supabase secrets set OPENAI_API_KEY=your_key_here

# Or via Supabase Dashboard:
# Project Settings > Edge Functions > Secrets
```
