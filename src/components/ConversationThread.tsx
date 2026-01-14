import { motion, AnimatePresence } from "framer-motion";
import { User, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIMessage } from "@/services/ai/types";

interface ConversationThreadProps {
  messages: AIMessage[];
  isLoading?: boolean;
  className?: string;
}

const ConversationThread = ({ messages, isLoading, className }: ConversationThreadProps) => {
  // Filter out system messages for display
  const displayMessages = messages.filter(m => m.role !== "system");

  if (displayMessages.length === 0 && !isLoading) return null;

  return (
    <div className={cn("space-y-3 max-h-60 overflow-y-auto", className)}>
      <AnimatePresence mode="popLayout">
        {displayMessages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex gap-3 items-start",
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                message.role === "user"
                  ? "bg-cosmic-silver/20"
                  : "bg-cosmic-teal/20"
              )}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4 text-cosmic-silver" />
              ) : (
                <Sparkles className="w-4 h-4 text-cosmic-teal" />
              )}
            </div>

            {/* Message bubble */}
            <div
              className={cn(
                "flex-1 px-4 py-2.5 rounded-2xl text-sm",
                message.role === "user"
                  ? "bg-cosmic-silver/10 text-foreground rounded-tr-md"
                  : "bg-cosmic-teal/10 text-foreground rounded-tl-md border border-cosmic-teal/20"
              )}
            >
              {message.content}
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3 items-start"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cosmic-teal/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cosmic-teal" />
            </div>
            <div className="flex-1 px-4 py-2.5 rounded-2xl rounded-tl-md bg-cosmic-teal/10 border border-cosmic-teal/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversationThread;
