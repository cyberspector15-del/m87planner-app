import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Mic, MicOff, Loader2, Check, Command, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNLPParse } from "@/hooks/useNLPParse";
import { useHaptic } from "@/hooks/useHaptic";

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

const CommandCenter = ({ className }: CommandCenterProps) => {
  const [input, setInput] = useState("");
  const [isSpotlightActive, setIsSpotlightActive] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempInput, setTempInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const { parseCommand, isParsing } = useNLPParse();
  const { vibrate } = useHaptic();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

      // If this is a final result, focus the input
      if (event.results[0].isFinal) {
        inputRef.current?.focus();
        vibrate("medium");
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
  }, [vibrate]);

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

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isParsing) return;
    
    const command = input.trim();
    const result = await parseCommand(command);
    
    if (result && result.action !== "unknown") {
      addToHistory(command);
      setLastSuccess(true);
      setInput("");
      setHistoryIndex(-1);
      setTempInput("");
      vibrate("success");
      setTimeout(() => {
        setLastSuccess(false);
        setIsSpotlightActive(false);
      }, 1500);
    }
  }, [input, isParsing, parseCommand, vibrate, addToHistory]);

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
              ? "0 0 60px 10px hsl(var(--cosmic-silver) / 0.15), 0 0 100px 30px hsl(var(--cosmic-teal) / 0.08), inset 0 1px 0 0 hsl(var(--cosmic-silver) / 0.1)"
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
                  boxShadow: "inset 0 0 30px 5px hsl(var(--cosmic-teal) / 0.05)"
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
                >
                  <Sparkles className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    isSpotlightActive ? "text-cosmic-teal" : "text-cosmic-silver"
                  )} />
                </motion.div>
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
                    <Check className="w-3 h-3" />
                    Done
                  </motion.span>
                )}
              </div>
              
              {/* Keyboard shortcut hint */}
              <motion.div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 border border-border/30"
                whileHover={{ scale: 1.02 }}
              >
                <Command className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">{shortcutKey}</span>
              </motion.div>
            </div>

            {/* Input Field */}
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
                    <History className="w-3 h-3" />
                    <span className="font-mono">
                      {historyIndex + 1} of {commandHistory.length}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={placeholders[placeholderIndex]}
                className={cn(
                  "w-full bg-muted/30 border rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none transition-all duration-300",
                  isSpotlightActive 
                    ? "px-5 py-4 pr-28 text-lg border-cosmic-silver/30 focus:border-cosmic-teal/50 focus:ring-2 focus:ring-cosmic-teal/20" 
                    : "px-4 py-3.5 pr-24 text-base border-border/50 focus:border-cosmic-teal/40 focus:ring-1 focus:ring-cosmic-teal/20"
                )}
                disabled={isParsing}
                maxLength={500}
              />
              
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
                      <MicOff className={isSpotlightActive ? "w-5 h-5" : "w-4 h-4"} />
                    </motion.div>
                  ) : (
                    <Mic className={isSpotlightActive ? "w-5 h-5" : "w-4 h-4"} />
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
                    <Loader2 className={cn(
                      "animate-spin",
                      isSpotlightActive ? "w-5 h-5" : "w-4 h-4"
                    )} />
                  ) : (
                    <Send className={isSpotlightActive ? "w-5 h-5" : "w-4 h-4"} />
                  )}
                </Button>
              </div>
            </div>

            {/* Suggestions */}
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
    </>
  );
};

export default CommandCenter;
