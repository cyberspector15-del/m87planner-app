import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'flux' | 'tier';
  featureName: string;
  fluxRequired?: number;
  fluxAvailable?: number;
  requiredTier?: 'event_horizon' | 'advance' | 'apex' | 'singularity';
}

const formatTierName = (tier: string | undefined) => {
  if (!tier) return '';
  return tier.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function UpgradeModal({
  isOpen,
  onClose,
  type,
  featureName,
  fluxRequired = 0,
  fluxAvailable = 0,
  requiredTier,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pricingPath = location.pathname.startsWith('/m') ? '/m/pricing' : '/pricing';

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Framer Motion variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.25, 
        ease: 'easeOut',
        staggerChildren: 0.04 
      } 
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const fluxPercentage = Math.min(
    100,
    fluxRequired > 0 ? (fluxAvailable / fluxRequired) * 100 : 0
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[480px]"
            style={{
              background: 'linear-gradient(135deg, #141414 0%, #0A0A0A 100%)',
              border: '1px solid rgba(51,51,51,0.6)',
              borderRadius: '12px',
              padding: '40px',
              boxShadow: '0 4px 24px -4px rgba(0,0,0,0.8)',
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
          >
            {/* TOP SECTION */}
            <motion.div variants={itemVariants}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: '#999999',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}>
                {type === 'flux' ? 'FLUX INSUFFICIENT' : 'ACCESS RESTRICTED'}
              </div>
              <div style={{
                height: '2px',
                width: '32px',
                background: '#45A199',
                margin: '12px 0',
                opacity: 0.8,
              }} />
            </motion.div>

            {/* MAIN MESSAGE */}
            <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
              <h2 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                marginBottom: '8px',
                lineHeight: 1.2,
              }}>
                {featureName}
              </h2>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#999999',
              }}>
                {type === 'flux' ? (
                  <>
                    Requires <span style={{ color: '#45A199' }}>{fluxRequired} FLUX</span> &middot; You have {fluxAvailable} FLUX
                  </>
                ) : (
                  <>
                    Available from <span style={{ color: '#45A199' }}>{formatTierName(requiredTier)}</span> and above
                  </>
                )}
              </div>
            </motion.div>

            {/* FLUX VISUAL */}
            {type === 'flux' && (
              <motion.div variants={itemVariants} style={{
                margin: '20px 0',
                width: '100%',
                height: '2px',
                background: '#1F1F1F',
                borderRadius: '1px',
                overflow: 'hidden',
              }}>
                <div 
                  style={{ 
                    height: '100%',
                    background: '#45A199',
                    width: `${fluxPercentage}%`,
                    transition: 'width 0.5s ease-out',
                  }}
                />
              </motion.div>
            )}

            {/* BOTTOM LINE */}
            <motion.div variants={itemVariants} style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: '#999999',
              fontStyle: 'italic',
            }}>
              {type === 'flux'
                ? "Your trajectory requires more fuel."
                : "Expand your orbit to access this feature."}
            </motion.div>

            {/* ACTION BUTTONS */}
            <motion.div variants={itemVariants} style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid #333333',
                  color: '#999999',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(191,191,191,0.6)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#BFBFBF';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#333333';
                  (e.currentTarget as HTMLButtonElement).style.color = '#999999';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                DISMISS
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate(pricingPath);
                }}
                style={{
                  background: 'linear-gradient(135deg, #BFBFBF 0%, #999999 100%)',
                  color: '#000000',
                  border: 'none',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.filter = 'none';
                }}
              >
                {type === 'flux' ? 'TOP UP FLUX' : 'VIEW PLANS'}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
