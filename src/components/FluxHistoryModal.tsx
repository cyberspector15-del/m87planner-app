import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFlux } from '../hooks/useFlux';
import { format } from 'date-fns';

interface FluxHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreditTransaction {
  id: string;
  amount: number;
  action_type: string;
  description: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  simulation:        'Consequence Simulator',
  auto_plan:         'AI Auto-Scheduler',
  ai_command:        'AI Command',
  conversation_mode: 'Conversation Mode',
  smart_reschedule:  'Smart Reschedule',
  monthly_reset:     'Monthly Allowance',
  addon_purchase:    'FLUX Top-Up',
};

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

const containerVariants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function FluxHistoryModal({ isOpen, onClose }: FluxHistoryModalProps) {
  const navigate = useNavigate();
  const { balance, monthlyAllowance } = useFlux();

  // Fetch recent transactions
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['flux-transactions'],
    queryFn: async (): Promise<CreditTransaction[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return [];
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, action_type, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as CreditTransaction[];
    },
    enabled: isOpen,
  });

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 4px 24px -4px rgba(0,0,0,0.8)',
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                FLUX Balance
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666666',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#666666'; }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* ── Balance Block ── */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '52px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {balance}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#999999',
                  marginTop: '8px',
                }}
              >
                FLUX remaining
              </div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  color: '#666666',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                }}
              >
                {monthlyAllowance} allowance / month
              </div>
            </div>

            {/* ── Get More FLUX Button ── */}
            <button
              onClick={() => { navigate('/pricing'); onClose(); }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #BFBFBF 0%, #999999 100%)',
                color: '#000000',
                border: 'none',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '12px 0',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = 'none';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              Get More FLUX
            </button>

            {/* ── Divider ── */}
            <div style={{ height: '1px', background: '#333333', margin: '20px 0' }} />

            {/* ── Section Label ── */}
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: '#999999',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Recent Activity
            </div>

            {/* ── Transaction List ── */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '16px' }}>
              {txLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#666666' }}>
                  Loading...
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#999999' }}>
                  No FLUX activity yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #1F1F1F',
                    }}
                  >
                    {/* Left */}
                    <div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#CCCCCC', fontWeight: 500 }}>
                        {ACTION_LABELS[tx.action_type] ?? tx.action_type}
                      </div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#999999', marginTop: '2px' }}>
                        {format(new Date(tx.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {/* Right */}
                    <div
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '13px',
                        fontWeight: 700,
                        color: tx.amount < 0 ? '#CF3030' : '#2EB867',
                      }}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount} FLUX
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
