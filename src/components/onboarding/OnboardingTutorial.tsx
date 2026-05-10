import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/useHaptic";
import { useCosmicSounds } from "@/hooks/useCosmicSounds";

interface OnboardingTutorialProps {
  onSubmit: (command: string) => void;
}

const suggestions = [
  "Plan my day",
  "Add gym 3x a week",
  "Schedule 2 hours of deep work",
  "Help me focus today",
];

const OnboardingTutorial = ({ onSubmit }: OnboardingTutorialProps) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { vibrate } = useHaptic();
  const { playTick, playVoiceConfirm } = useCosmicSounds();

  // Auto-focus input
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    vibrate("light");
    playTick();
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    vibrate("success");
    playVoiceConfirm();
    onSubmit(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
    >
      {/* Background - dimmed */}
      <div className="absolute inset-0 bg-cosmic-black/95" />
      
      {/* Spotlight effect */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: "radial-gradient(ellipse 600px 400px at center 45%, hsl(var(--cosmic-deep) / 0.5) 0%, transparent 100%)"
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl">
        {/* Instruction */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center text-lg text-cosmic-silver/80 mb-6"
        >
          Try typing one of these:
        </motion.p>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 rounded-full text-sm bg-muted/30 border border-cosmic-silver/20 text-cosmic-silver/80 hover:bg-cosmic-teal/10 hover:border-cosmic-teal/30 hover:text-cosmic-teal transition-all duration-200"
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>

        {/* AI Command Input - Spotlighted */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative"
        >
          <div 
            className="glass-strong rounded-2xl p-6 relative overflow-hidden"
            style={{
              boxShadow: "0 0 60px 15px hsl(var(--cosmic-teal) / 0.15), 0 0 100px 30px hsl(var(--cosmic-silver) / 0.08), inset 0 1px 0 0 hsl(var(--cosmic-silver) / 0.1)"
            }}
          >
            {/* Ambient glow */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center top, hsl(175 40% 45% / 0.12) 0%, transparent 60%)"
              }}
            />

            {/* Pulsing border */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                boxShadow: [
                  "inset 0 0 0 1px hsl(var(--cosmic-silver) / 0.2)",
                  "inset 0 0 0 2px hsl(var(--cosmic-teal) / 0.3)",
                  "inset 0 0 0 1px hsl(var(--cosmic-silver) / 0.2)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <span className="font-display font-semibold text-lg text-foreground">
                  AI Command
                </span>
              </div>

              {/* Input */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell M87 what you want..."
                  className="w-full bg-muted/30 border border-cosmic-silver/30 rounded-xl px-5 py-4 pr-14 text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cosmic-teal/50 focus:ring-2 focus:ring-cosmic-teal/20 transition-all"
                />
                <Button
                  variant="cosmic-primary"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10"
                  disabled={!input.trim()}
                  onClick={handleSubmit}
                >
                  <PaperPlaneRight size={20} weight="thin" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center text-sm text-cosmic-silver/50 mt-4"
        >
          Type a command or tap a suggestion above
        </motion.p>
      </div>
    </motion.div>
  );
};

export default OnboardingTutorial;
