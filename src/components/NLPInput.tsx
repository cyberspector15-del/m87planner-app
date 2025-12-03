import { useState } from "react";
import { Send, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const suggestions = [
  "Plan my day",
  "Add gym 3x a week",
  "Schedule 2hr focus time",
  "Clear my afternoon",
];

const NLPInput = () => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
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
          <Sparkles className="w-4 h-4 text-cosmic-teal" />
          <span className="text-sm font-medium text-cosmic-silver">
            AI Command
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type a command like 'plan my day' or 'add task'"
            className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 pr-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cosmic-teal/50 focus:ring-1 focus:ring-cosmic-teal/30 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              variant="cosmic-primary"
              size="icon"
              className="h-8 w-8"
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 rounded-full border border-border/50 hover:border-cosmic-silver/30 hover:text-cosmic-silver transition-all"
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
