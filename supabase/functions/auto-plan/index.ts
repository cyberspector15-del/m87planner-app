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

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { date } = await req.json();
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Auto-planning for user ${user.id} on ${targetDate.toISOString()}`);

    // Fetch incomplete tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("priority", { ascending: true })
      .order("deadline", { ascending: true, nullsFirst: false });

    if (tasksError) {
      console.error("Tasks fetch error:", tasksError);
      throw tasksError;
    }

    // Fetch existing events for the day
    const { data: existingEvents, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .order("start_time", { ascending: true });

    if (eventsError) {
      console.error("Events fetch error:", eventsError);
      throw eventsError;
    }

    // Fetch user profile for all settings
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        work_hours_start, work_hours_end, 
        focus_hours_start, focus_hours_end,
        ai_strictness, timezone
      `)
      .eq("user_id", user.id)
      .single();

    // Extract settings with defaults
    const workStart = profile?.work_hours_start || "09:00:00";
    const workEnd = profile?.work_hours_end || "17:00:00";
    const focusStart = profile?.focus_hours_start || "09:00:00";
    const focusEnd = profile?.focus_hours_end || "12:00:00";
    const aiStrictness = profile?.ai_strictness || "balanced";

    console.log(`Found ${tasks?.length || 0} tasks and ${existingEvents?.length || 0} existing events`);
    console.log(`User settings: work=${workStart}-${workEnd}, focus=${focusStart}-${focusEnd}, strictness=${aiStrictness}`);

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No tasks to schedule",
        scheduled: [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare context for AI
    const tasksContext = tasks.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority === 1 ? "high" : t.priority === 2 ? "medium" : "low",
      duration_minutes: t.duration_minutes || 30,
      deadline: t.deadline,
      location: t.location,
      flexible: t.flexible,
    }));

    const eventsContext = existingEvents?.map(e => ({
      title: e.title,
      start_time: e.start_time,
      end_time: e.end_time,
    })) || [];

    // Build strictness-specific instructions
    let strictnessInstructions = "";
    switch (aiStrictness) {
      case "calm":
        strictnessInstructions = `
SCHEDULING STYLE: CALM
- Be conservative with scheduling - leave plenty of buffer time
- Prefer spreading tasks out rather than clustering them
- Leave at least 30-minute buffers between events
- Prioritize user comfort over efficiency
- If in doubt, leave a slot open rather than filling it
- Don't reschedule too aggressively`;
        break;
      case "strict":
        strictnessInstructions = `
SCHEDULING STYLE: STRICT
- Maximize productivity by filling available slots efficiently
- Use minimal buffer time (10-15 minutes) between tasks
- Aggressively schedule high-priority tasks in prime focus hours
- Don't waste any good time slots
- Optimize heavily for deadline compliance
- Prefer back-to-back scheduling when locations match`;
        break;
      case "balanced":
      default:
        strictnessInstructions = `
SCHEDULING STYLE: BALANCED
- Strike a balance between productivity and comfort
- Use 15-minute buffers between events when possible
- Prioritize focus hours for deep work, but be flexible
- Consider task context when grouping
- Leave some breathing room but don't waste time`;
        break;
    }

    const prompt = `You are an AI scheduling assistant for M87 Planner. Your job is to intelligently schedule tasks into available time slots.

Context:
- Date to schedule: ${targetDate.toDateString()}
- Work hours: ${workStart} to ${workEnd}
- Focus/Deep Work hours: ${focusStart} to ${focusEnd} (best for high-priority, complex tasks)
- Current time zone should be considered for scheduling

${strictnessInstructions}

Existing events (already scheduled, cannot overlap):
${JSON.stringify(eventsContext, null, 2)}

Tasks to schedule (sorted by priority):
${JSON.stringify(tasksContext, null, 2)}

Rules:
1. Never overlap with existing events
2. Prioritize high priority tasks for focus hours (${focusStart} to ${focusEnd})
3. Consider task deadlines - urgent deadlines should be scheduled sooner
4. Apply the ${aiStrictness.toUpperCase()} scheduling style described above
5. Schedule within work hours unless tasks are marked flexible
6. Consider task duration when finding slots
7. Group similar tasks or tasks at same location when practical

Return a JSON array of scheduled tasks with this exact format:
[
  {
    "task_id": "uuid",
    "title": "task title",
    "start_time": "ISO datetime string",
    "end_time": "ISO datetime string",
    "reason": "brief explanation of why this slot was chosen"
  }
]

Only schedule tasks that fit within available slots. If a task cannot be scheduled, omit it.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI for scheduling...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an intelligent scheduling AI. Always respond with valid JSON arrays only, no markdown formatting." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
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
    const aiContent = aiData.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", aiContent);

    // Parse AI response - handle potential markdown wrapping
    let scheduledTasks = [];
    try {
      let jsonContent = aiContent.trim();
      if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }
      scheduledTasks = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(JSON.stringify({ 
        error: "Failed to parse AI scheduling response",
        scheduled: [] 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create events for scheduled tasks
    const createdEvents = [];
    for (const scheduled of scheduledTasks) {
      const task = tasks.find(t => t.id === scheduled.task_id);
      if (!task) continue;

      const { data: event, error: createError } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          title: scheduled.title || task.title,
          description: task.description,
          start_time: scheduled.start_time,
          end_time: scheduled.end_time,
          location: task.location,
          task_id: task.id,
          status: "scheduled",
        })
        .select()
        .single();

      if (createError) {
        console.error("Failed to create event:", createError);
      } else {
        createdEvents.push({
          ...event,
          reason: scheduled.reason,
        });
      }
    }

    console.log(`Created ${createdEvents.length} events`);

    return new Response(JSON.stringify({ 
      message: `Successfully scheduled ${createdEvents.length} task(s)`,
      scheduled: createdEvents 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Auto-plan error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
