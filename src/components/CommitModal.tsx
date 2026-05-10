import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUp } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";

export interface Branch {
  id: string;
  label: string;
  descriptor: string;
  probability: number;
  risks: string[];
  opportunityCost: string;
  compounding: { oneMonth: string; sixMonths: string; oneYear: string };
  signalStrength: number;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  simulationId: string | null;
  onPlanActivated?: () => void;
}

interface GeneratedPlan {
  tasks: Array<{
    title: string;
    description: string;
    priority: number;
    duration_minutes: number;
    deadline: string | null;
  }>;
  routines: Array<{
    title: string;
    description: string;
    frequency: 'daily'|'weekly'|'weekdays'|'weekends';
    window_start: string;
    window_end: string;
    target_duration_minutes: number;
  }>;
  events: Array<{
    title: string;
    description: string;
    start_time: string;
    end_time: string;
  }>;
}

const TypewriterMessage = ({ content }: { content: string }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      setDisplayed(content.slice(0, i + 1));
      i++;
      if (i >= content.length) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [content]);

  const isDone = displayed.length === content.length;
  return (
    <>
      {displayed}
      <motion.span
        initial={{ opacity: 1 }}
        animate={isDone ? { opacity: 0 } : { opacity: [1, 0, 1] }}
        transition={isDone ? { delay: 2.5, duration: 0.2 } : { duration: 0.8, repeat: Infinity }}
        className="inline-block ml-[2px]"
        style={{ fontSize: "10px", verticalAlign: "middle" }}
      >
        ▌
      </motion.span>
    </>
  );
};

export const CommitModal = ({ isOpen, onClose, branch, simulationId, onPlanActivated }: CommitModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [committedTimelineId, setCommittedTimelineId] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, generatedPlan]);

  const handleModalClose = () => {
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !branch || !simulationId) return;
    
    setMessages([]);
    setInputValue("");
    setGeneratedPlan(null);
    setIsTyping(false);
    setUptime(0);
    setActivationSuccess(false);
    
    const initModal = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data } = await supabase.from('committed_timelines').insert({
            user_id: userData.user.id,
            simulation_id: simulationId,
            branch_id: branch.id,
            branch_label: branch.label,
            branch_descriptor: branch.descriptor,
            chat_messages: []
          }).select().single();
          
          if (data) setCommittedTimelineId(data.id);
        }
      } catch (e) {
        console.error("Failed to insert committed_timeline", e);
      }
      
      const sysMsg: Message = {
        role: "system",
        content: `You are M87's Execution Intelligence — an AI embedded inside a productivity app. The user has committed to a specific decision timeline and you are helping them build a concrete execution plan.

Your job is to have a focused conversation to understand their specific situation, then generate actionable tasks, daily routines, and calendar events they can add to M87.

PHASE 1 — GATHER INTEL (first 3-4 messages):
Ask ONE question at a time. Be direct and specific.
Ask about:
1. Their available hours per day for this goal
2. Their current biggest bottleneck or constraint
3. Their target deadline or timeframe
4. Any existing commitments that limit their time

PHASE 2 — GENERATE PLAN:
After gathering enough context (3-4 user responses),
say exactly: 'GENERATING EXECUTION PLAN...' on its own line,
then output a JSON block wrapped in \`\`\`json \`\`\` tags:

{
  "tasks": [
    {
      "title": "Task title",
      "description": "What to do",
      "priority": 1,
      "duration_minutes": 30,
      "deadline": null
    }
  ],
  "routines": [
    {
      "title": "Routine title", 
      "description": "What to do",
      "frequency": "daily",
      "window_start": "09:00:00",
      "window_end": "10:00:00",
      "target_duration_minutes": 60
    }
  ],
  "events": [
    {
      "title": "Event title",
      "description": "What happens",
      "start_time": "2026-04-20T10:00:00Z",
      "end_time": "2026-04-20T11:00:00Z"
    }
  ]
}

After the JSON, add a short 2-3 sentence summary of the plan in plain text.

TONE: Cold, precise, analytical. No motivational language.
No emojis. Short sentences. Like a mission briefing.

The user has committed to: ${branch.label} — ${branch.descriptor}. 
Probability: ${branch.probability}%. 
Start the conversation by acknowledging their commitment and asking your first intel question.`
      };
      
      setMessages([sysMsg]);
      triggerAI([sysMsg], true);
    };
    
    initModal();
  }, [isOpen]); 
  
  const saveChatHistory = async (newMsgs: Message[], cId: string | null) => {
    if (!cId) return;
    try {
      await supabase.from('committed_timelines').update({
        chat_messages: newMsgs as any,
        updated_at: new Date().toISOString()
      }).eq('id', cId);
    } catch {}
  };

  const parsePlan = (content: string) => {
    if (!content.includes("GENERATING EXECUTION PLAN...")) return null;
    const match = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1] || match[0]);
        if (parsed.tasks || parsed.routines || parsed.events) {
          return parsed as GeneratedPlan;
        }
      } catch (e) {}
    }
    return null;
  };

  const triggerAI = async (currentMsgs: Message[], initial = false) => {
    setIsTyping(true);
    const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
    try {
      const response = await fetch("/nvidia-api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "meta/llama-3.3-70b-instruct",
          messages: currentMsgs.map(m => ({ role: m.role, content: m.content })),
          max_tokens: 2000,
          temperature: 0.4,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        
        let newMsgs: Message[] = [...currentMsgs, { role: "assistant", content, timestamp: uptime }];
        
        if (content.includes("GENERATING EXECUTION PLAN...")) {
          const plan = parsePlan(content);
          if (plan) {
            setGeneratedPlan(plan);
          } else {
             newMsgs = [...newMsgs, { role: "assistant", content: "PLAN GENERATION FAILED — Please type 'generate my plan' to retry.", timestamp: uptime }];
          }
        }

        setMessages(newMsgs);
        if (!initial) {
          saveChatHistory(newMsgs, committedTimelineId);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsTyping(false);
  };

  useEffect(() => {
    if (committedTimelineId && messages.length === 2 && messages[1].role === "assistant") {
       saveChatHistory(messages, committedTimelineId);
    }
  }, [committedTimelineId, messages.length]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;
    
    const newMsgs: Message[] = [...messages, { role: "user", content: trimmed, timestamp: uptime }];
    setMessages(newMsgs);
    setInputValue("");
    saveChatHistory(newMsgs, committedTimelineId);
    triggerAI(newMsgs);
  };

  const handleAddToM87 = async () => {
    if (!generatedPlan || !committedTimelineId) return;
    setIsActivating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const userId = userData.user.id;
      
      await supabase.from('generated_plans').insert({
        user_id: userId,
        committed_timeline_id: committedTimelineId,
        plan_type: 'task',
        plan_data: generatedPlan as any,
        status: 'approved'
      }).select().single();
      
      if (generatedPlan.tasks?.length > 0) {
        await supabase.from('tasks').insert(
          generatedPlan.tasks.map(t => ({
            user_id: userId,
            title: t.title,
            description: t.description,
            priority: t.priority ?? 2,
            duration_minutes: t.duration_minutes ?? 30,
            deadline: t.deadline ?? null,
            flexible: true,
            completed: false
          }))
        );
      }
      
      if (generatedPlan.routines?.length > 0) {
        await supabase.from('routines').insert(
          generatedPlan.routines.map(r => ({
            user_id: userId,
            title: r.title,
            description: r.description,
            frequency: r.frequency ?? 'daily',
            window_start: r.window_start ?? '09:00:00',
            window_end: r.window_end ?? '10:00:00',
            target_duration_minutes: r.target_duration_minutes ?? 30,
            active: true
          }))
        );
      }
      
      if (generatedPlan.events?.length > 0) {
        await supabase.from('events').insert(
          generatedPlan.events.map(e => ({
            user_id: userId,
            title: e.title,
            description: e.description,
            start_time: e.start_time,
            end_time: e.end_time,
            status: 'scheduled' as const,
            travel_buffer_minutes: 0
          }))
        );
      }
      
      setActivationSuccess(true);
      if (onPlanActivated) onPlanActivated();
      
      setTimeout(() => {
        handleModalClose();
      }, 2000);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "SYNC FAILED — Check connection and retry.", timestamp: uptime }]);
      setIsActivating(false);
    }
  };

  const displayMessages = messages.filter(m => m.role !== "system");

  return (
    <AnimatePresence>
      {isOpen && branch && (
        <>
          <style>{`
            .chat-scroll::-webkit-scrollbar { width: 3px; }
            .chat-scroll::-webkit-scrollbar-track { background: transparent; }
            .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
          `}</style>
          
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={handleModalClose}
          />
          
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.96, opacity: 0 }} 
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative flex flex-col pointer-events-auto"
              style={{ 
                width: "min(720px, 92vw)", 
                height: "min(82vh, 780px)", 
                background: "#0A0A0A", 
                border: "1px solid rgba(255,255,255,0.07)", 
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 32px 80px rgba(0,0,0,0.8), 0 0 120px rgba(0,0,0,0.5)"
              }}
            >
              {/* MODAL HEADER */}
              <div 
                className="flex items-center justify-between shrink-0" 
                style={{ height: "72px", padding: "0 24px", background: "#0A0A0A", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex flex-col items-start gap-1">
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "3px 10px", fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}>
                    COMMITTED
                  </div>
                  <h2 className="font-display font-bold text-white" style={{ fontSize: "15px" }}>
                     {branch.label}
                  </h2>
                </div>
                <div className="flex items-center gap-6">
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>
                     {String(Math.floor(uptime / 60)).padStart(2, '0')}:{String(uptime % 60).padStart(2, '0')}
                  </div>
                  <button 
                    onClick={handleModalClose}
                    className="transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    onMouseOver={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                    onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                  >
                    <X size={20} weight="thin" />
                  </button>
                </div>
              </div>
              <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

              {/* MESSAGES BODY */}
              <div className="flex-1 overflow-y-auto chat-scroll flex flex-col" style={{ padding: "32px 28px", gap: "24px" }}>
                {displayMessages.map((msg, idx) => {
                  const isAI = msg.role === "assistant";
                  let text = msg.content;
                  if (isAI && text.includes("```json")) {
                     text = text.replace(/```json[\s\S]*?```/, "").trim();
                  }

                  if (isAI) {
                    const showLabel = idx === displayMessages.findIndex(m => m.role === "assistant");
                    return (
                      <div key={idx} className="flex flex-col w-full">
                        {showLabel && (
                          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)", marginBottom: "8px" }}>
                            M87
                          </div>
                        )}
                        <div className="flex items-start" style={{ gap: "12px" }}>
                          <div style={{ width: "2px", height: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "1px", flexShrink: 0, alignSelf: "stretch" }} />
                          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                             <TypewriterMessage content={text} />
                          </div>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-end w-full"
                      >
                        <div style={{ 
                          background: "rgba(255,255,255,0.05)", 
                          border: "1px solid rgba(255,255,255,0.08)", 
                          borderRadius: "14px 14px 2px 14px", 
                          padding: "12px 16px", 
                          maxWidth: "78%", 
                          fontFamily: "Inter, sans-serif", 
                          fontWeight: 400, 
                          fontSize: "14px", 
                          color: "rgba(255,255,255,0.9)", 
                          lineHeight: 1.6, 
                          whiteSpace: "pre-wrap" 
                        }}>
                          {text}
                        </div>
                      </motion.div>
                    )
                  }
                })}

                {isTyping && (
                  <div className="flex flex-col w-full">
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)", marginBottom: "8px" }}>
                      M87
                    </div>
                    <div className="flex items-start" style={{ gap: "12px" }}>
                      <div style={{ width: "2px", height: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "1px", flexShrink: 0, alignSelf: "stretch" }} />
                      <div className="flex items-center gap-1.5 h-6">
                        {[0, 1, 2].map((i) => (
                          <motion.div 
                            key={i} 
                            animate={{ scale: [1, 1.6, 1] }} 
                            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                            style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.4)" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* EXECUTION PLAN CARD */}
              <AnimatePresence>
                {generatedPlan && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ margin: "0 20px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "18px 20px" }}
                  >
                    {activationSuccess ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: [1.2, 1] }} 
                          transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
                          style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "14px", color: "rgba(74,222,128,1)" }}
                        >
                          ✓ Added to M87
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                          style={{ fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "6px", textAlign: "center" }}
                        >
                          {generatedPlan.tasks?.length || 0} tasks, {generatedPlan.routines?.length || 0} routines and {generatedPlan.events?.length || 0} events are now in your planner
                        </motion.div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "13px", color: "white" }}>Plan ready</span>
                          <button onClick={() => setGeneratedPlan(null)} style={{ color: "rgba(255,255,255,0.3)" }}><X size={16} weight="thin" /></button>
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "6px" }}>
                          {generatedPlan.tasks?.length || 0} tasks · {generatedPlan.routines?.length || 0} routines · {generatedPlan.events?.length || 0} events
                        </div>
                        <div className="mt-4 flex flex-col gap-1">
                          {generatedPlan.tasks?.slice(0, 2).map((t, i) => (
                            <div key={i} style={{ fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                              → {t.title}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-[10px]" style={{ marginTop: "14px" }}>
                           <button 
                             onClick={handleAddToM87} 
                             disabled={isActivating}
                             style={{ flex: 1, height: "40px", background: "white", borderRadius: "8px", color: "#0A0A0A", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "13px", cursor: isActivating ? "wait" : "pointer", transition: "background 0.2s" }}
                             onMouseOver={(e) => !isActivating && (e.currentTarget.style.background = "rgba(255,255,255,0.9)")}
                             onMouseOut={(e) => !isActivating && (e.currentTarget.style.background = "white")}
                           >
                             {isActivating ? "Adding..." : "Add to M87"}
                           </button>
                           <button 
                             onClick={() => setGeneratedPlan(null)} 
                             style={{ width: "80px", height: "40px", background: "transparent", color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: "13px", transition: "color 0.2s" }}
                             onMouseOver={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                             onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                           >
                             Dismiss
                           </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* INPUT AREA */}
              <div style={{ background: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px 20px" }}>
                <div style={{ 
                  background: "rgba(255,255,255,0.04)", 
                  border: isInputFocused ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.08)", 
                  borderRadius: "12px", 
                  padding: "4px 4px 4px 16px", 
                  display: "flex", 
                  alignItems: "center",
                  boxShadow: isInputFocused ? "0 0 0 3px rgba(255,255,255,0.04)" : "none",
                  transition: "all 0.2s"
                }}>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    disabled={activationSuccess}
                    placeholder="Reply to M87..."
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: "14px", color: "white", padding: "10px 0" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping || activationSuccess}
                    style={{ 
                      width: "38px", height: "38px", 
                      background: "rgba(255,255,255,0.08)", 
                      border: "1px solid rgba(255,255,255,0.1)", 
                      borderRadius: "9px", 
                      display: "flex", justifyContent: "center", alignItems: "center", 
                      color: "rgba(255,255,255,0.6)", 
                      transition: "all 0.2s" 
                    }}
                    onMouseOver={(e) => {
                      if (!(!inputValue.trim() || isTyping || activationSuccess)) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                        e.currentTarget.style.color = "white";
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }}
                  >
                    <ArrowUp size={18} weight="thin" />
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
