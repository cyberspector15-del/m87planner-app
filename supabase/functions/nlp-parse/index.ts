import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { input } = await req.json();
    
    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit input length for security
    const sanitizedInput = input.trim().slice(0, 500);
    
    console.log(`Processing NLP input for user ${user.id}: "${sanitizedInput}"`);

    const today = new Date();
    const prompt = `You are an AI assistant for M87 Planner that interprets natural language commands to create tasks and events.

Current date: ${today.toDateString()}
User timezone: Consider standard working hours (9 AM - 5 PM)

User command: "${sanitizedInput}"

Interpret this command and return a JSON object with the following structure:
{
  "action": "create_task" | "create_tasks" | "create_routine" | "plan_day" | "clear_schedule" | "unknown",
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

Return ONLY valid JSON, no markdown formatting.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI for NLP parsing...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise NLP parser. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
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
      created: {
        tasks: [] as any[],
        routines: [] as any[],
      }
    };

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