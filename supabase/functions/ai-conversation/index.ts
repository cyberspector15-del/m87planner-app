import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

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

    // Check if user is Pro
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, conversation_mode_enabled")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.subscription_tier !== "pro") {
      return new Response(JSON.stringify({ 
        error: "Conversation mode is a Pro feature",
        requiresUpgrade: true 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, input } = await req.json() as { messages: Message[]; input: string };
    
    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedInput = input.trim().slice(0, 500);
    
    console.log(`Conversational AI turn for user ${user.id}: "${sanitizedInput}"`);

    const today = new Date();
    
    // Build conversation history with system prompt
    const systemPrompt = `You are M87, a friendly AI productivity assistant. You help users plan their day through natural conversation.

Current date: ${today.toDateString()}
User timezone: Consider standard working hours (9 AM - 5 PM)

Your role is to:
1. Have a natural conversation to understand what the user wants to accomplish
2. Ask clarifying questions when needed (like duration, priority, timing preferences)
3. When you have enough information, create tasks or plan their day

When you're ready to take action, respond with JSON in this format:
{
  "response": "Your friendly message to the user",
  "isComplete": true,
  "action": "create_task" | "create_tasks" | "create_routine" | "plan_day",
  "tasks": [...],
  "routine": {...}
}

When you need more information, respond with:
{
  "response": "Your question or clarification",
  "isComplete": false
}

Be conversational, helpful, and concise. Ask one question at a time.
Never use markdown - just plain conversational text.
Always respond with valid JSON only.`;

    // Build message history
    const conversationMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.filter(m => m.role !== "system"),
      { role: "user", content: sanitizedInput }
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI for conversational response...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: conversationMessages,
        temperature: 0.7,
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
    
    console.log("AI conversational response:", aiContent);

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
      // Return a friendly fallback
      return new Response(JSON.stringify({ 
        response: "I didn't quite catch that. Could you tell me more about what you'd like to accomplish?",
        isComplete: false
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = {
      response: parsed.response || "How can I help you plan your day?",
      isComplete: parsed.isComplete || false,
      action: parsed.action,
      created: {
        tasks: [] as any[],
        routines: [] as any[],
      }
    };

    // If complete, execute the action
    if (result.isComplete && parsed.action) {
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
            result.created.tasks.push(createdTask);
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
          result.created.routines.push(createdRoutine);
        }
      }

      console.log(`Created ${result.created.tasks.length} tasks and ${result.created.routines.length} routines`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Conversational AI error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
