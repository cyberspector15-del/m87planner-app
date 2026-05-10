import { motion } from "framer-motion";
import { ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/useHaptic";
import CosmicBackground from "@/components/CosmicBackground";
import SettingsPlanningMode from "@/components/settings/SettingsPlanningMode";
import SettingsScheduling from "@/components/settings/SettingsScheduling";
import SettingsFeedback from "@/components/settings/SettingsFeedback";
import SettingsAbout from "@/components/settings/SettingsAbout";

const Settings = () => {
  const navigate = useNavigate();
  const { vibrate } = useHaptic();

  const handleBack = () => {
    vibrate("light");
    navigate(-1);
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0, x: 50, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CosmicBackground />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 glass border-b border-border/30"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="cosmic-ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft size={20} weight="thin" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold tracking-wider text-glow">
                SETTINGS
              </h1>
              <p className="text-xs text-muted-foreground tracking-wide">
                Customize your M87 experience
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative z-10 container mx-auto px-6 py-8 pb-24 max-w-2xl"
      >
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <SettingsPlanningMode />
          </motion.div>

          <motion.div variants={itemVariants}>
            <SettingsScheduling />
          </motion.div>


          <motion.div variants={itemVariants}>
            <SettingsFeedback />
          </motion.div>

          <motion.div variants={itemVariants}>
            <SettingsAbout />
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default Settings;
