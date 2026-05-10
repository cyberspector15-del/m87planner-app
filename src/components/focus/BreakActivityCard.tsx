import { motion } from 'framer-motion';

interface BreakActivityCardProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string }>;
  selected: boolean;
  onClick: () => void;
}

export const BreakActivityCard = ({ id, label, icon: Icon, selected, onClick }: BreakActivityCardProps) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-4 rounded-[12px] transition-all duration-[600ms] ease-in-out glass-m87`}
      style={selected ? {
        background: 'linear-gradient(0deg, rgba(69,161,153,0.06), rgba(69,161,153,0.06)), rgba(20,20,20,0.45)',
        boxShadow: 'inset 0 0 0 1px rgba(69,161,153,0.2), 0 0 0 1px rgba(69,161,153,0.4), 0 0 20px rgba(69,161,153,0.08)'
      } : {}}
      whileTap={{ scale: 0.95 }}
    >
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.5, 0], scale: [1, 1.05] }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 rounded-[12px] border border-[#45A199] pointer-events-none"
        />
      )}
      <Icon size={32} weight="thin" className="text-[#FFFFFF] mb-3 relative z-10" />
      <span className="font-mono text-[#999999] uppercase text-xs tracking-wider relative z-10">{label}</span>
    </motion.button>
  );
};
