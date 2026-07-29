import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, Medal, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface OMVTransaction {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  streak_milestone: 'Streak Milestone',
  mission_complete: 'Mission Completed',
  referral_signup: 'Referral Sign-up',
  weekly_leaderboard: 'Weekly Leaderboard Rank',
};

interface OMVDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

const drawerVariants = {
  hidden:  { y: '100%' },
  visible: { y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { y: '100%', transition: { duration: 0.25, ease: 'easeIn' } },
};

export default function OMVDrawer({ isOpen, onClose }: OMVDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [howToEarnExpanded, setHowToEarnExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch the current user's real referral_code and profile id from DB
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile-referral', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, referral_code')
        .eq('user_id', user.id)
        .single();
      return data as { id: string; referral_code: string | null } | null;
    },
    enabled: isOpen && !!user,
  });

  const referralCode = myProfile?.referral_code
    ?? (user?.id ? `M87-${user.id.slice(0, 8).toUpperCase()}` : 'M87-EXPLORER');
  const inviteLink = `m87planner.space/join?ref=${referralCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Invite link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code to clipboard:', err);
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch OMV balance
  const { data: omvBalance } = useQuery({
    queryKey: ['omv-balance', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from('profiles')
        .select('omv_balance')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching OMV balance:', error);
        return 0;
      }
      return data?.omv_balance || 0;
    },
    enabled: isOpen && !!user,
  });

  // Fetch OMV transactions
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['omv-transactions', user?.id],
    queryFn: async (): Promise<OMVTransaction[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('omv_transactions')
        .select('id, amount, reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching OMV transactions:', error);
        return [];
      }
      return (data ?? []) as OMVTransaction[];
    },
    enabled: isOpen && !!user,
  });

  // Fetch referred friends: profiles where referred_by = current user's profile id
  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ['omv-friends', myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.id) return [];
      const { data, error } = await supabase.rpc('get_my_referrals' as any);
      
      console.log('[DEBUG] get_my_referrals RPC result:', { data, error });
      
      if (error) {
        console.error('Error fetching friends:', error);
        return [];
      }
      return (data ?? []) as { id: string; name: string | null; email: string | null; joined_at: string }[];
    },
    enabled: isOpen && !!myProfile?.id,
    staleTime: 0, // Force fresh fetch, don't use cache if drawer was opened before
  });

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{
            background: 'rgba(20,20,20,0.45)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[480px] bg-[#0A0A0A] border-t border-[#333333] rounded-t-[24px] flex flex-col"
            style={{
              padding: '24px',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
              boxShadow: '0 -4px 24px -4px rgba(0,0,0,0.8)',
            }}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Drag Handle & Header ── */}
            <div className="w-12 h-1.5 bg-[#333333] rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing" />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px', marginTop: '-32px' }}>
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
                <X size={20} />
              </button>
            </div>

            {/* ── Top Section: Balance ── */}
            <div className="flex flex-col items-center justify-center text-center mb-8">
              <span className="font-sans font-light text-[13px] text-[#999999] mb-2 uppercase tracking-widest">
                OMV Balance
              </span>
              <span className="sim-font-mono text-[48px] font-bold text-[#E8AB30] leading-none mb-3">
                {omvBalance ?? 0}
              </span>
              <span className="font-sans text-[11px] text-[#666666]">
                Redeemable at Omniverse Chain mainnet launch
              </span>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: '1px', background: '#1F1F1F', margin: '0 0 20px 0' }} />

            {/* ── "How to Earn" Section ── */}
            <div className="flex flex-col">
              <button
                onClick={() => setHowToEarnExpanded(!howToEarnExpanded)}
                className="flex items-center justify-between w-full py-2 bg-transparent border-none text-left cursor-pointer focus:outline-none"
              >
                <span className="font-sans text-[14px] font-medium text-[#E6E6E6]">
                  How to Earn
                </span>
                {howToEarnExpanded ? (
                  <ChevronUp size={18} className="text-[#999999]" />
                ) : (
                  <ChevronDown size={18} className="text-[#999999]" />
                )}
              </button>

              <AnimatePresence>
                {howToEarnExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-4 mt-4 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                          <Target size={16} className="text-[#E8AB30]" />
                        </div>
                        <span className="font-sans text-[13px] text-[#CCCCCC]">
                          Streak milestones
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                          <Trophy size={16} className="text-[#E8AB30]" />
                        </div>
                        <span className="font-sans text-[13px] text-[#CCCCCC]">
                          Completing high-priority missions
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                          <Medal size={16} className="text-[#E8AB30]" />
                        </div>
                        <span className="font-sans text-[13px] text-[#CCCCCC]">
                          Weekly leaderboard top ranks
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: '1px', background: '#1F1F1F', margin: '20px 0' }} />

            {/* ── Recent Activity Section ── */}
            <div className="flex flex-col">
              <span className="font-sans font-light text-[14px] text-[#999999] mb-2">
                Recent Activity
              </span>

              <div style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '8px' }}>
                {txLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#666666' }}>
                    Loading...
                  </div>
                ) : !transactions || transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#999999' }}>
                    No activity yet. Start completing missions to earn OMV.
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
                      <div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#CCCCCC', fontWeight: 500 }}>
                          {tx.reason ? (REASON_LABELS[tx.reason] ?? tx.reason) : 'Reward'}
                        </div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#666666', marginTop: '2px' }}>
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '13px',
                          fontWeight: 700,
                          color: tx.amount < 0 ? '#FFFFFF' : '#E8AB30',
                        }}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount} OMV
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: '1px', background: '#1F1F1F', margin: '20px 0' }} />

            {/* ── Invite Friends Section ── */}
            <div className="flex flex-col mb-6">
              <span className="font-sans font-light text-[14px] text-[#999999] mb-3">
                Invite Friends
              </span>
              
              <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#292929] rounded-[6px] p-3 px-4 overflow-hidden">
                <span className="sim-font-mono text-[13px] text-[#BFBFBF] select-all font-medium truncate mr-3">
                  {inviteLink}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="focus:outline-none p-1 -m-1 cursor-pointer hover:text-white text-[#666666] transition-colors"
                  disabled={copied}
                >
                  <Copy size={16} />
                </button>
              </div>
              <span className="font-sans text-[12px] text-[#666666] mt-2 select-none font-normal">
                Invite friends. Earn OMV when they join.
              </span>
            </div>

            {/* ── Singularity Ecosystem Link ── */}
            <div className="mb-6">
              <a
                href="https://singularityhq.space"
                target="_blank"
                rel="noreferrer"
                className="font-sans text-[13px] text-[#45A199] hover:text-[#45A199]/80 underline underline-offset-4 decoration-[#45A199]/40"
              >
                Learn more about the SINGULARITY ecosystem
              </a>
            </div>

            {/* ── Friends List ── */}
            <div className="flex flex-col">
              <span className="font-sans font-light text-[14px] text-[#999999] mb-2">
                Your Friends
              </span>
              
              <div style={{ maxHeight: '160px', overflowY: 'auto', paddingRight: '8px' }}>
                {friendsLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#666666' }}>
                    Loading...
                  </div>
                ) : !friends || friends.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#999999' }}>
                    No friends invited yet.
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #1F1F1F',
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#CCCCCC', fontWeight: 500 }}>
                          {friend.name || friend.email || 'New Member'}
                        </div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#666666', marginTop: '2px' }}>
                          Joined {formatDistanceToNow(new Date(friend.joined_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
