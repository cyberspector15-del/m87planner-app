import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ⚠️ MIGRATION REQUIRED: This edge function uses Lovable's AI Gateway
 * 
 * To use this function with your own Supabase instance, you need to:
 * 1. Replace LOVABLE_API_KEY with your own AI provider (OpenAI, Anthropic, etc.)
 * 2. Update the API endpoint (currently: https://ai.gateway.lovable.dev/v1/chat/completions)
 * 3. See /supabase/EDGE_FUNCTIONS_MIGRATION.md for detailed instructions
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompts for different modes
const SILENT_SYSTEM_PROMPT = `You are an AI assistant for M87 Planner that interprets natural language commands to create tasks and events.
You execute commands directly without asking follow-up questions.
Always try to infer reasonable defaults when information is missing.`;

const CONVERSATIONAL_SYSTEM_PROMPT = `You are an AI assistant for M87 Planner that helps users plan their day through conversation.
You can ask clarifying questions to better understand the user's needs.
When you need more information, respond with a question and set needsMoreInfo to true.
When you have enough information, create the tasks/events and set needsMoreInfo to false.
Be concise and helpful. Keep responses under 100 words.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { input, mode = "silent", conversationContext } = await req.json();

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit input length for security
    const sanitizedInput = input.trim().slice(0, 500);

    console.log(`Processing NLP input for user ${user.id} in ${mode} mode: "${sanitizedInput}"`);

    const today = new Date();
    const isConversational = mode === "conversational";

    // Build the prompt based on mode
    const basePrompt = `Current date: ${today.toDateString()}
User timezone: Consider standard working hours (9 AM - 5 PM)

User command: "${sanitizedInput}"

${isConversational ? `If you need more information to create a complete plan, ask a clarifying question and set needsMoreInfo to true.
If you have enough information, create the tasks and set needsMoreInfo to false.` : ''}

Interpret this command and return a JSON object with the following structure:
{
  "action": "create_task" | "create_tasks" | "create_routine" | "plan_day" | "clear_schedule" | "unknown"${isConversational ? ' | "clarify"' : ''},
  "needsMoreInfo": ${isConversational ? 'true | false' : 'false'},
  "followUpQuestion": "${isConversational ? 'question to ask user (if needsMoreInfo is true)' : ''}",
  "tasks": [
    {
      "title": "task title",
      "description": "optional description",
      "priority": 1 | 2 | 3,
      "duration_minutes": number,
      "deadline": "ISO date string or null",
      "location": "optional location",
      "flexible": true | false
    }
  ],
  "routine": {
    "title": "routine title",
    "description": "optional description",
    "frequency": "daily" | "weekly" | "weekdays" | "weekends",
    "times_per_week": number,
    "target_duration_minutes": number,
    "window_start": "HH:MM:SS",
    "window_end": "HH:MM:SS"
  },
  "message": "A friendly confirmation message describing what was understood"
}

Rules for interpretation:
1. "add gym 3x a week" → create_routine with frequency "weekly" and times_per_week 3
2. "add task buy groceries" → create_task with title "Buy groceries"
3. "schedule 2hr focus time" → create_task with duration 120 minutes, high priority
4. "plan my day" → action "plan_day" (triggers auto-scheduler)
5. "clear my afternoon" → action "clear_schedule"
6. For recurring tasks like "gym 3x a week", create individual tasks for specific days
7. Priority: "urgent", "important", "high" → 1, default → 2, "low" → 3
8. Duration defaults: exercise 60min, meetings 30min, focus time as specified
9. If creating multiple tasks from one command, use "create_tasks"
${isConversational ? '10. For vague requests like "I want to be more productive", ask clarifying questions first' : ''}

Return ONLY valid JSON, no markdown formatting.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Calling Lovable AI for NLP parsing in ${mode} mode...`);

    // Build messages array - include conversation context if in conversational mode
    const messages: Array<{ role: string; content: string }> = [
      {
        role: "system",
        content: isConversational ? CONVERSATIONAL_SYSTEM_PROMPT : SILENT_SYSTEM_PROMPT
      },
    ];

    // Add conversation history if available
    if (isConversational && conversationContext?.messages) {
      for (const msg of conversationContext.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add the current user message with full prompt
    messages.push({ role: "user", content: basePrompt });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: isConversational ? 0.4 : 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "{}";

    console.log("AI NLP response:", aiContent);

    // Parse AI response
    let parsed;
    try {
      let jsonContent = aiContent.trim();
      if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(JSON.stringify({
        error: "Failed to understand the command. Please try rephrasing.",
        action: "unknown"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = {
      action: parsed.action,
      message: parsed.message || "Command processed",
      needsMoreInfo: parsed.needsMoreInfo || false,
      followUpQuestion: parsed.followUpQuestion || null,
      created: {
        tasks: [] as any[],
        routines: [] as any[],
      }
    };

    // If in conversational mode and needs more info, don't create anything yet
    if (isConversational && parsed.needsMoreInfo) {
      console.log("Conversational mode: AI needs more information");
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle task creation
    if ((parsed.action === "create_task" || parsed.action === "create_tasks") && parsed.tasks?.length > 0) {
      for (const task of parsed.tasks) {
        const { data: createdTask, error: taskError } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            title: task.title,
            description: task.description || null,
            priority: task.priority || 2,
            duration_minutes: task.duration_minutes || 30,
            deadline: task.deadline || null,
            location: task.location || null,
            flexible: task.flexible !== false,
            completed: false,
          })
          .select()
          .single();

        if (taskError) {
          console.error("Failed to create task:", taskError);
        } else {
          results.created.tasks.push(createdTask);
        }
      }
    }

    // Handle routine creation
    if (parsed.action === "create_routine" && parsed.routine) {
      const routine = parsed.routine;
      const { data: createdRoutine, error: routineError } = await supabase
        .from("routines")
        .insert({
          user_id: user.id,
          title: routine.title,
          description: routine.description || null,
          frequency: routine.frequency || "daily",
          target_duration_minutes: routine.target_duration_minutes || 30,
          window_start: routine.window_start || "09:00:00",
          window_end: routine.window_end || "17:00:00",
          active: true,
        })
        .select()
        .single();

      if (routineError) {
        console.error("Failed to create routine:", routineError);
      } else {
        results.created.routines.push(createdRoutine);

        // Also create tasks for recurring items
        if (routine.times_per_week && routine.times_per_week > 0) {
          const daysToAdd = Math.min(routine.times_per_week, 7);
          for (let i = 0; i < daysToAdd; i++) {
            const taskDate = new Date(today);
            taskDate.setDate(today.getDate() + i + 1);

            const { data: taskFromRoutine, error: taskError } = await supabase
              .from("tasks")
              .insert({
                user_id: user.id,
                title: routine.title,
                description: `From routine: ${routine.title}`,
                priority: 2,
                duration_minutes: routine.target_duration_minutes || 30,
                deadline: taskDate.toISOString(),
                flexible: true,
                completed: false,
              })
              .select()
              .single();

            if (!taskError && taskFromRoutine) {
              results.created.tasks.push(taskFromRoutine);
            }
          }
        }
      }
    }

    console.log(`Created ${results.created.tasks.length} tasks and ${results.created.routines.length} routines`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("NLP parse error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
