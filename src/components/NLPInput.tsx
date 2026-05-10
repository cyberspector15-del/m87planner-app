import { useState } from "react";
import { PaperPlaneRight, Microphone, CircleNotch, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNLPParse } from "@/hooks/useNLPParse";

const suggestions = [
  "Plan my day",
  "Add gym 3x a week",
  "Schedule 2hr focus time",
  "Add task buy groceries",
];

const NLPInput = () => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(false);
  const { parseCommand, isParsing } = useNLPParse();

  const handleSubmit = async () => {
    if (!input.trim() || isParsing) return;
    
    const result = await parseCommand(input);
    
    if (result && result.action !== "unknown") {
      setLastSuccess(true);
      setInput("");
      setTimeout(() => setLastSuccess(false), 2000);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass rounded-xl p-4 relative overflow-hidden">
      {/* Glow effect when focused */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300 pointer-events-none",
          isFocused ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(ellipse at center top, hsl(175 40% 45% / 0.1) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-cosmic-silver">
            AI Command
          </span>
          {lastSuccess && (
            <span className="flex items-center gap-1 text-xs text-cosmic-teal animate-fade-in">
              <Check size={12} weight="thin" />
              Done
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command like 'plan my day' or 'add task'"
            className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 pr-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cosmic-teal/50 focus:ring-1 focus:ring-cosmic-teal/30 transition-all"
            disabled={isParsing}
            maxLength={500}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={isParsing}
            >
              <Microphone size={16} weight="thin" />
            </Button>
            <Button
              variant="cosmic-primary"
              size="icon"
              className="h-8 w-8"
              disabled={!input.trim() || isParsing}
              onClick={handleSubmit}
            >
              {isParsing ? (
                <CircleNotch size={16} weight="thin" className="animate-spin" />
              ) : (
                <PaperPlaneRight size={16} weight="thin" />
              )}
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 rounded-full border border-border/50 hover:border-cosmic-silver/30 hover:text-cosmic-silver transition-all disabled:opacity-50"
              disabled={isParsing}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NLPInput;