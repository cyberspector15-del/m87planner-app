import { motion } from 'framer-motion';

interface BreakTierCardProps {
  id: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}

export const BreakTierCard = ({ id, title, subtitle, selected, onClick }: BreakTierCardProps) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left p-4 rounded-[12px] transition-all duration-[600ms] ease-in-out glass-m87`}
      style={selected ? {
        background: 'linear-gradient(0deg, rgba(69,161,153,0.06), rgba(69,161,153,0.06)), rgba(20,20,20,0.45)',
        boxShadow: 'inset 0 0 0 1px rgba(69,161,153,0.2), 0 0 0 1px rgba(69,161,153,0.4), 0 0 20px rgba(69,161,153,0.08)'
      } : {}}
      whileTap={{ scale: 0.98 }}
    >
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.5, 0], scale: [1, 1.05] }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 rounded-[12px] border border-[#45A199] pointer-events-none"
        />
      )}
      <h3 className="font-display font-bold text-[#FFFFFF] text-lg mb-1 uppercase tracking-wider relative z-10">{title}</h3>
      <p className="font-sans text-[#999999] text-sm relative z-10">{subtitle}</p>
    </motion.button>
  );
};
