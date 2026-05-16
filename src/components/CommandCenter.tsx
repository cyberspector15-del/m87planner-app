import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneRight, Microphone, MicrophoneSlash, CircleNotch, Check, Command, ClockCounterClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNLPParse } from "@/hooks/useNLPParse";
import { useHaptic } from "@/hooks/useHaptic";
import { useCosmicSounds } from "@/hooks/useCosmicSounds";
import { callAIGateway } from "@/lib/aiGateway";
import ConversationModeToggle from "@/components/ai/ConversationModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/useSubscription";
import { useFlux } from "../hooks/useFlux";
import UpgradeModal from "./UpgradeModal";

const CONVERSATION_SYSTEM_PROMPT = `
You are M87's AI Command — a cold, precise productivity AI. 
You help users add tasks, events, and routines to their planner 
through a short structured conversation. Maximum 3 exchanges before concluding.

RULES:
- Message 1: Analyze what the user wants to add (task/event/routine). 
  Identify the single most important missing detail. Ask only that one question. 
  Be brief. No filler.
- Message 2: Ask the second most important missing detail. One question only.
- Message 3: Show a structured summary of exactly what will be added. Format:

  READY TO ADD:
  Type: [Task / Event / Routine]
  Title: [title]
  [show relevant fields only — time, duration, frequency, priority]
  
  Confirm?

- After summary shown: detect user confirmation intent. 
  "yes", "ok", "do it", "yeah", "go ahead", "looks good", "sure", "add it", 
  "confirmed", "yep" and similar all count as confirmation.
  When confirmed, respond with EXACTLY this JSON and nothing else:
  {"action":"INSERT","type":"task"|"event"|"routine","data":{...all fields}}
  
  For task data fields: 
  { title, priority(1-5 int), duration_minutes, deadline(ISO string or null) }
  
  For event data fields: 
  { title, start_time(ISO string), end_time(ISO string) }
  
  For routine data fields: 
  { title, frequency("daily"|"weekly"|"weekdays"|"weekends"), 
    window_start("HH:MM:SS"), window_end("HH:MM:SS"), target_duration_minutes }

- If user says something unrelated mid-flow: respond "Let's finish adding [item] first." and re-ask the last unanswered question.
- Never ask more than 2 questions total. Never send more than 4 messages total.
- Never produce INSERT JSON unless user has confirmed.
`.trim();

const suggestions = [
  "Plan my day",
  "Schedule 2 hours of deep work",
  "Add a weekly routine",
  "Reschedule unfinished tasks",
];

const placeholders = [
  "Tell M87 what you want to do…",
  "Plan my day",
  "Add gym 3x a week",
  "Optimize my schedule",
  "What should I focus on today?",
];

interface CommandCenterProps {
  className?: string;
}

const HISTORY_KEY = "m87-command-history";
const MAX_HISTORY = 50;

// Check for Web Speech API support
const SpeechRecognition = typeof window !== "undefined"
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const CommandCenter = ({ className }: CommandCenterProps) => {
  const { isActive } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canAfford, spendFlux, balance } = useFlux();
  const [showFluxModal, setShowFluxModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<{name: string, action: string, cost: number} | null>(null);
  const [input, setInput] = useState("");
  const [isSpotlightActive, setIsSpotlightActive] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempInput, setTempInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Conversation mode state
  const [conversationMode, setConversationMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isParsingLocal, setIsParsingLocal] = useState(false);
  
  const { parseCommand, isParsing } = useNLPParse();
  const { vibrate } = useHaptic();
  const { playVoiceConfirm } = useCosmicSounds();
  const queryClient = useQueryClient();
  
  // Clear conversation history when conversation mode is toggled (ON->OFF or OFF->ON)
  useEffect(() => {
    setConversationHistory([]);
    setPendingQuestion(null);
    console.log("Conversation Mode:", conversationMode);
  }, [conversationMode]);
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (conversationMode && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory, conversationMode]);

  // Handle textarea auto-expansion
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
    setInput(target.value);
  };

  // Check for speech recognition support
  useEffect(() => {
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      vibrate("light");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      vibrate("heavy");
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");

      setInput(transcript);

      // If this is a final result, play confirmation sound and focus input
      if (event.results[0].isFinal) {
        inputRef.current?.focus();
        vibrate("medium");
        playVoiceConfirm();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors when stopping
        }
      }
    };
  }, [vibrate, playVoiceConfirm]);

  // Load command history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setCommandHistory(JSON.parse(stored));
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      vibrate("light");
    } else {
      try {
        recognitionRef.current.start();
        // Activate spotlight mode when listening
        setIsSpotlightActive(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
        vibrate("heavy");
      }
    }
  }, [isListening, vibrate]);

  // Global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSpotlightActive(true);
        vibrate("light");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && isSpotlightActive) {
        setIsSpotlightActive(false);
        setHistoryIndex(-1);
        setTempInput("");
        setPendingQuestion(null);
        setConversationHistory([]);
        // Stop listening if active
        if (isListening && recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpotlightActive, isListening, vibrate]);

  // Click outside to close spotlight
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isSpotlightActive && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSpotlightActive(false);
        setHistoryIndex(-1);
        setTempInput("");
        setPendingQuestion(null);
        setConversationHistory([]);
        // Stop listening if active
        if (isListening && recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }
    };

    if (isSpotlightActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSpotlightActive, isListening]);

  const addToHistory = useCallback((command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;
    
    setCommandHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((c) => c !== trimmed);
      // Add to beginning and limit size
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  const handleConversationModeClick = useCallback(() => {
    setConversationMode(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isActive) {
      setShowUpgradeModal(true);
      return;
    }
    console.log("submit fired, value:", input);
    if (!input.trim()) {
      console.warn("empty input");
      return;
    }
    if (isParsing) {
      console.log("Submit blocked: still parsing...");
      return;
    }

    const command = input.trim();
    
    if (conversationMode) {
      if (!canAfford('conversation_mode')) {
        setBlockedFeature({ name: 'Conversation Mode', action: 'conversation_mode', cost: 30 });
        setShowFluxModal(true);
        return;
      }
      // 1. Immediate UI update
      const userMessage = { role: 'user' as const, content: command };
      const updatedHistory = [...conversationHistory, userMessage];
      setConversationHistory(updatedHistory);
      setInput("");
      setIsParsingLocal(true); // Need local parsing state or use useNLPParse's isParsing? 
      // Actually CommandCenter doesn't have its own setIsParsing. I'll use a local one if I bypass parseCommand.
      // But wait, parseCommand handles a lot of logic. 
      // User said "Call callAIGateway". I'll implement it manually to be safe.
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setConversationHistory(prev => [...prev, { role: 'assistant', content: "Identity required. Please log in." }]);
          return;
        }

        const messages = [
          { role: 'system' as const, content: CONVERSATION_SYSTEM_PROMPT },
          ...updatedHistory
        ];

        console.log("calling ai gateway...");
        const response = await callAIGateway({ 
          mode: 'conversation', 
          messages 
        });
        console.log("gateway response:", response);
        
        if (response.success) {
          await spendFlux('conversation_mode');
          const content = response.content.trim();
          
          if (content.startsWith('{"action":"INSERT"')) {
            try {
              const insertAction = JSON.parse(content);
              const { type, data } = insertAction;
              
              let dbError = null;
              if (type === 'task') {
                const { error } = await supabase.from('tasks').insert({
                  user_id: session.user.id,
                  title: data.title,
                  priority: data.priority || 2,
                  duration_minutes: data.duration_minutes || 30,
                  deadline: data.deadline,
                  completed: false,
                  flexible: !data.deadline
                });
                dbError = error;
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
              } else if (type === 'event') {
                const { error } = await supabase.from('events').insert({
                  user_id: session.user.id,
                  title: data.title,
                  start_time: data.start_time,
                  end_time: data.end_time,
                  status: 'scheduled'
                });
                dbError = error;
                queryClient.invalidateQueries({ queryKey: ["events"] });
              } else if (type === 'routine') {
                const { error } = await supabase.from('routines').insert({
                  user_id: session.user.id,
                  title: data.title,
                  frequency: data.frequency || 'daily',
                  window_start: data.window_start,
                  window_end: data.window_end,
                  target_duration_minutes: data.target_duration_minutes || 30,
                  active: true
                });
                dbError = error;
                queryClient.invalidateQueries({ queryKey: ["routines"] });
              }

              if (dbError) throw dbError;

              setConversationHistory(prev => [
                ...prev,
                { role: 'assistant', content: `Done. ${data.title} added to your planner.` }
              ]);
              queryClient.invalidateQueries({ queryKey: ["quick-stats"] });
              vibrate("success");
              
            } catch (parseOrDbError) {
              console.error("Insert error:", parseOrDbError);
              const msg = parseOrDbError instanceof Error ? parseOrDbError.message : "Unknown error";
              setConversationHistory(prev => [
                ...prev,
                { role: 'assistant', content: `Signal lost — ${msg}. Try again.` }
              ]);
            }
          } else {
            setConversationHistory(prev => [
              ...prev,
              { role: 'assistant', content: response.content }
            ]);
          }
        } else {
          throw new Error("API call unsuccessful");
        }
      } catch (err) {
        console.error("Conversation error:", err);
        setConversationHistory(prev => [
          ...prev,
          { role: 'assistant', content: 'Signal lost. Try again.' }
        ]);
      } finally {
        setIsParsingLocal(false);
      }
      return;
    }
    
    if (!canAfford('ai_command')) {
      setBlockedFeature({ name: 'AI Command', action: 'ai_command', cost: 15 });
      setShowFluxModal(true);
      return;
    }

    // Existing single-query logic (unchanged)
    const context = undefined; // Single query doesn't use context here
    
    let result = null;
    try {
      console.log("calling parseCommand...");
      result = await parseCommand(command, context);
      await spendFlux('ai_command');
      console.log("parseCommand result:", result);
    } catch (err) {
      console.error("parseCommand FAILED:", err);
    }
    
    if (!result) return;


    if (result.action !== "unknown") {
      addToHistory(command);
      setLastSuccess(true);
      setInput("");
      setHistoryIndex(-1);
      setTempInput("");
      
      // Since conversationMode is false here, we always do this:
      setPendingQuestion(null);
      setConversationHistory([]);
      vibrate("success");
      setTimeout(() => {
        setLastSuccess(false);
        setIsSpotlightActive(false);
      }, 1500);
    }
  }, [input, isParsing, parseCommand, vibrate, addToHistory, conversationMode, conversationHistory]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setHistoryIndex(-1);
    vibrate("light");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Arrow up - go back in history
    if (e.key === "ArrowUp" && commandHistory.length > 0) {
      e.preventDefault();
      
      if (historyIndex === -1) {
        // Save current input before navigating history
        setTempInput(input);
      }
      
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
      vibrate("light");
      return;
    }

    // Arrow down - go forward in history
    if (e.key === "ArrowDown") {
      e.preventDefault();
      
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
        vibrate("light");
      } else if (historyIndex === 0) {
        // Return to the original input
        setHistoryIndex(-1);
        setInput(tempInput);
        vibrate("light");
      }
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Reset history navigation when user types
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
      setTempInput("");
    }
  };

  const handleFocus = () => {
    setIsSpotlightActive(true);
    vibrate("light");
  };

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutKey = isMac ? "⌘K" : "Ctrl+K";

  return (
    <>
      {/* Upgrade Modal */}
      {/* Upgrade Modal removed */}

      {/* Spotlight Overlay - dims background */}
      <AnimatePresence>
        {isSpotlightActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-cosmic-black/60 backdrop-blur-sm"
            style={{
              background: "radial-gradient(circle at 50% 30%, transparent 0%, hsl(var(--cosmic-black) / 0.85) 100%)"
            }}
          />
        )}
      </AnimatePresence>

      {/* Command Center Container */}
      <div
        ref={containerRef}
        className={cn(
          "relative transition-all duration-300",
          isSpotlightActive && "fixed inset-x-4 top-1/4 z-50 max-w-2xl mx-auto",
          className
        )}
      >
        <motion.div
          layout
          className={cn(
            "relative overflow-hidden rounded-2xl transition-all duration-300",
            isSpotlightActive 
              ? "glass-strong p-6" 
              : "glass p-5"
          )}
          style={{
            boxShadow: isSpotlightActive
              ? "0 0 60px 10px hsl(var(--cosmic-silver) / 0.15), 0 0 100px 30px hsl(var(--cosmic-accent-teal) / 0.08), inset 0 1px 0 0 hsl(var(--cosmic-silver) / 0.1)"
              : "0 0 30px 5px hsl(var(--cosmic-silver) / 0.05)"
          }}
        >
          {/* Ambient glow effect */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500 pointer-events-none",
              isSpotlightActive ? "opacity-100" : "opacity-30"
            )}
            style={{
              background: "radial-gradient(ellipse at center top, hsl(175 40% 45% / 0.12) 0%, transparent 60%)"
            }}
          />

          {/* Glowing ring when active */}
          <AnimatePresence>
            {isSpotlightActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  border: "1px solid hsl(var(--cosmic-silver) / 0.2)",
                  boxShadow: "inset 0 0 30px 5px hsl(var(--cosmic-accent-teal) / 0.05)"
                }}
              />
            )}
          </AnimatePresence>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ 
                    rotate: isSpotlightActive ? [0, 180, 360] : 0,
                    scale: isSpotlightActive ? [1, 1.1, 1] : 1
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
                <span className={cn(
                  "font-display font-semibold transition-all duration-300",
                  isSpotlightActive ? "text-lg text-foreground" : "text-sm text-cosmic-silver"
                )}>
                  AI Command
                </span>
                {lastSuccess && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1 text-xs text-cosmic-teal"
                  >
                    <Check size={12} weight="thin" />
                    Done
                  </motion.span>
                )}
              </div>
              
              {/* Keyboard shortcut hint */}
              <motion.div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 border border-border/30"
                whileHover={{ scale: 1.02 }}
              >
                <Command size={12} weight="thin" className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">{shortcutKey}</span>
              </motion.div>
            </div>

            {/* AI Usage & Conversation Mode Row */}
            <AnimatePresence>
              {isSpotlightActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between gap-3 mb-4"
                >
                  <div />
                  <ConversationModeToggle
                    enabled={conversationMode}
                    onToggle={() => setConversationMode(!conversationMode)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversation UI (if in conversation mode) */}
            {conversationMode && (
              <div 
                className="mb-3 scroll-smooth"
                style={{
                  maxHeight: '320px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}
              >
                {conversationHistory.length === 0 && !pendingQuestion && (
                  <p className="text-center text-muted-foreground/50 text-sm py-4 italic">
                    Start a conversation with M87...
                  </p>
                )}
                
                {conversationHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                      padding: '10px 14px',
                      color: msg.role === 'user' ? '#ffffff' : 'rgba(255,255,255,0.85)',
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '14px',
                      maxWidth: '80%',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.content}
                  </div>
                ))}
                
                {pendingQuestion && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '2px 12px 12px 12px',
                      padding: '10px 14px',
                      color: 'rgba(255,255,255,0.85)',
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '14px',
                      maxWidth: '80%',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      borderLeft: '2px solid hsl(var(--cosmic-teal))'
                    }}
                  >
                    <p className="text-xs text-cosmic-teal font-medium mb-1 uppercase tracking-wider">M87 asks:</p>
                    {pendingQuestion}
                  </div>
                )}

                {(isParsing || isParsingLocal) && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '2px 12px 12px 12px',
                      padding: '10px 14px',
                      color: 'rgba(255,255,255,0.5)',
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '14px',
                      maxWidth: '80%'
                    }}
                  >
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ...
                    </motion.div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Conversation thread removed (old pending question display) */}

            {/* Input Field Area */}
            <div className="relative">
              {/* History indicator */}
              <AnimatePresence>
                {historyIndex >= 0 && commandHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-6 left-0 flex items-center gap-1.5 text-xs text-cosmic-silver/70"
                  >
                    <ClockCounterClockwise size={12} weight="thin" />
                    <span className="font-mono">
                      {historyIndex + 1} of {commandHistory.length}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {conversationMode ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={input}
                  onChange={handleTextareaInput}
                  onFocus={handleFocus}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    } else {
                      handleKeyDown(e as any);
                    }
                  }}
                  placeholder={pendingQuestion ? "Type your reply..." : "Talk to M87..."}
                  className={cn(
                    "w-full bg-muted/30 text-foreground placeholder:text-muted-foreground/70 focus:outline-none transition-all duration-300",
                    "px-4 py-3 pr-28 text-sm resize-none overflow-y-auto"
                  )}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '14px',
                    minHeight: '44px',
                    maxHeight: '200px'
                  }}
                  disabled={isParsing}
                  rows={1}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (historyIndex !== -1) {
                      setHistoryIndex(-1);
                      setTempInput("");
                    }
                  }}
                  onFocus={handleFocus}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      console.log("Enter key submit triggered");
                      handleSubmit();
                    } else {
                      handleKeyDown(e);
                    }
                  }}
                  placeholder={pendingQuestion ? "Type your reply..." : placeholders[placeholderIndex]}
                  className={cn(
                    "w-full bg-muted/30 border rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none transition-all duration-300",
                    isSpotlightActive 
                      ? "px-5 py-4 pr-28 text-lg border-cosmic-silver/30 focus:border-cosmic-teal/50 focus:ring-2 focus:ring-cosmic-teal/20" 
                      : "px-4 py-3.5 pr-24 text-base border-border/50 focus:border-cosmic-teal/40 focus:ring-1 focus:ring-cosmic-teal/20"
                  )}
                  disabled={isParsing}
                  maxLength={500}
                />
              )}
              
              {/* Voice listening indicator */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-6 right-0 flex items-center gap-1.5 text-xs text-cosmic-teal"
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-cosmic-teal"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span>Listening...</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Action buttons */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "transition-all",
                    isSpotlightActive ? "h-10 w-10" : "h-8 w-8",
                    isListening 
                      ? "text-cosmic-teal bg-cosmic-teal/10 hover:bg-cosmic-teal/20" 
                      : "text-muted-foreground hover:text-foreground",
                    !speechSupported && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isParsing || !speechSupported}
                  onClick={toggleVoiceInput}
                  title={!speechSupported ? "Voice not supported in this browser" : isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <MicrophoneSlash size={isSpotlightActive ? 20 : 16} weight="thin" />
                    </motion.div>
                  ) : (
                    <Microphone size={isSpotlightActive ? 20 : 16} weight="thin" />
                  )}
                </Button>
                <Button
                  variant="cosmic-primary"
                  size="icon"
                  className={cn(
                    "transition-all",
                    isSpotlightActive ? "h-10 w-10" : "h-8 w-8"
                  )}
                  disabled={!input.trim() || isParsing}
                  onClick={handleSubmit}
                >
                  {isParsing ? (
                    <CircleNotch size={isSpotlightActive ? 20 : 16} weight="thin" className="animate-spin" />
                  ) : (
                    <PaperPlaneRight size={isSpotlightActive ? 20 : 16} weight="thin" />
                  )}
                </Button>
              </div>
            </div>

            {!conversationMode && (
              <motion.div 
                className="flex flex-wrap gap-2 mt-4"
                initial={false}
                animate={{ 
                  opacity: isSpotlightActive ? 1 : 0.8,
                  y: isSpotlightActive ? 0 : 2
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "px-4 py-1.5 text-sm text-muted-foreground rounded-full border transition-all",
                      isSpotlightActive 
                        ? "bg-muted/40 border-border/50 hover:border-cosmic-silver/40 hover:text-cosmic-silver hover:bg-muted/60" 
                        : "bg-muted/30 border-border/30 hover:border-cosmic-silver/30 hover:text-cosmic-silver"
                    )}
                    disabled={isParsing}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Spotlight mode helper text */}
            <AnimatePresence>
              {isSpotlightActive && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-xs text-muted-foreground/60 mt-4"
                >
                  <span className="font-mono text-cosmic-silver/70">↑↓</span> history • <span className="font-mono text-cosmic-silver/70">Esc</span> close • <span className="font-mono text-cosmic-silver/70">Enter</span> submit
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="tier"
        featureName="AI Command"
        requiredTier="event_horizon"
      />
      <UpgradeModal
        isOpen={showFluxModal}
        onClose={() => { setShowFluxModal(false); setBlockedFeature(null) }}
        type="flux"
        featureName={blockedFeature?.name ?? ''}
        fluxRequired={blockedFeature?.cost ?? 0}
        fluxAvailable={balance}
      />
    </>
  );
};

export default CommandCenter;
