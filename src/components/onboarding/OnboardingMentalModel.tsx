import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/useHaptic";
import { useCosmicSounds } from "@/hooks/useCosmicSounds";

interface OnboardingMentalModelProps {
  onNext: () => void;
}

const OnboardingMentalModel = ({ onNext }: OnboardingMentalModelProps) => {
  const { vibrate } = useHaptic();
  const { playTick } = useCosmicSounds();

  const handleContinue = () => {
    vibrate("medium");
    playTick();
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-cosmic-black" />
      
      {/* Subtle radial glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsl(var(--cosmic-deep) / 0.3) 0%, transparent 60%)"
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg">
        {/* Main text */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-cosmic-white tracking-wide mb-6"
        >
          You don't plan here.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-lg md:text-xl text-cosmic-silver/80 mb-10 leading-relaxed"
        >
          You tell M87 what you want.
          <br />
          It handles the rest.
        </motion.p>

        {/* Visual: Glowing AI Command representation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mb-10"
        >
          <div 
            className="glass rounded-xl p-5 max-w-sm mx-auto relative overflow-hidden"
            style={{
              boxShadow: "0 0 40px 10px hsl(var(--cosmic-teal) / 0.15), inset 0 1px 0 0 hsl(var(--cosmic-silver) / 0.1)"
            }}
          >
            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              animate={{
                boxShadow: [
                  "0 0 20px 5px hsl(var(--cosmic-teal) / 0.1)",
                  "0 0 40px 15px hsl(var(--cosmic-teal) / 0.2)",
                  "0 0 20px 5px hsl(var(--cosmic-teal) / 0.1)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-cosmic-teal" />
              <span className="font-display font-semibold text-foreground">AI Command</span>
            </div>
            <div className="mt-3 h-10 rounded-lg bg-muted/30 border border-cosmic-silver/20 flex items-center px-4">
              <motion.span
                className="text-muted-foreground/50"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Tell M87 what you want...
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Button
            variant="cosmic-primary"
            size="lg"
            onClick={handleContinue}
            className="px-10 py-6 text-lg font-display tracking-wide"
          >
            Show me how
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OnboardingMentalModel;
