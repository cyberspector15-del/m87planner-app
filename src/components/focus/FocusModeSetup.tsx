import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BreakTierCard } from './BreakTierCard';
import { BreakActivityCard } from './BreakActivityCard';
import { useAuth } from '@/hooks/useAuth';
import { useFocusSession } from '@/hooks/useFocusSession';
import { BreakTier, BreakActivity } from '@/types/focusMode';
import { GameController, ArrowRight, Flame, Waves, ArrowSquareOut } from "@phosphor-icons/react";

export const FocusModeSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createSession, isLoading } = useFocusSession();

  const [duration, setDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [breakTier, setBreakTier] = useState<BreakTier | null>(null);
  const [breakActivity, setBreakActivity] = useState<BreakActivity | null>(null);

  const durationOptions = [1, 25, 45, 60, 90];

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // numbers only
    setCustomDuration(val);
    if (val) {
      setDuration(parseInt(val, 10));
    } else {
      setDuration(null);
    }
  };

  const handlePreSetDuration = (val: number) => {
    setDuration(val);
    setCustomDuration('');
  };

  const handleTierChange = (tier: BreakTier) => {
    setBreakTier(tier);
    if (tier !== 'deep') {
      setBreakActivity(null);
    }
  };

  const isFormValid = () => {
    if (!duration || duration < 1 || duration > 180) return false;
    if (!breakTier) return false;
    if (breakTier === 'deep' && !breakActivity) return false;
    return true;
  };

  const handleLaunch = async () => {
    if (!isFormValid() || !user || isLoading) return;
    
    const session = await createSession(user.id, duration!, breakTier!, breakActivity);
    if (session) {
      navigate('/focus/session');
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] p-6 pb-20 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-12 mt-8">
        
        {/* SECTION 1 — Focus Duration Selector */}
        <section className="space-y-4">
          <h2 className="font-mono text-[#999999] uppercase tracking-widest text-sm">Focus Duration</h2>
          <div className="flex flex-wrap gap-4">
            {durationOptions.map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handlePreSetDuration(val)}
                className={`
                  h-12 px-6 rounded-[12px] font-display font-bold transition-colors border
                  ${duration === val && !customDuration 
                    ? 'border-[#45A199]/70 bg-[#45A199]/[0.08] text-[#FFFFFF]' 
                    : 'border-[#333333]/40 bg-[#1A1A1A] text-[#999999] hover:border-[#FFFFFF]/50'
                  }
                `}
              >
                {val} MIN
              </button>
            ))}
            
            <div className="relative flex-1 min-w-[120px]">
              <input
                type="text"
                placeholder="CUSTOM"
                value={customDuration}
                onChange={handleCustomDurationChange}
                className={`
                  w-full h-12 px-4 rounded-[12px] font-display font-bold outline-none border transition-colors bg-[#1A1A1A] text-center
                  ${customDuration 
                    ? 'border-[#45A199]/70 bg-[#45A199]/[0.08] text-[#FFFFFF]' 
                    : 'border-[#333333]/40 text-[#999999] placeholder:text-[#333333] hover:border-[#FFFFFF]/50'
                  }
                `}
              />
              {customDuration && <span className="absolute right-4 top-3 text-[#999999] font-sans text-sm">min</span>}
            </div>
          </div>
          {duration !== null && (duration < 1 || duration > 180) && (
            <p className="text-[#CF3030] text-sm font-sans mt-2">Duration must be between 1 and 180 minutes.</p>
          )}
        </section>

        {/* SECTION 2 — Break Tier Selector */}
        <section className="space-y-4">
          <h2 className="font-mono text-[#999999] uppercase tracking-widest text-sm">Break Interval</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BreakTierCard
              id="micro"
              title="Micro"
              subtitle="5 min break · No game · Rest only"
              selected={breakTier === 'micro'}
              onClick={() => handleTierChange('micro')}
            />
            <BreakTierCard
              id="short"
              title="Short"
              subtitle="10 min break · Signal Echo game included"
              selected={breakTier === 'short'}
              onClick={() => handleTierChange('short')}
            />
            <BreakTierCard
              id="standard"
              title="Standard"
              subtitle="15 min break · Cognitive Sprint included"
              selected={breakTier === 'standard'}
              onClick={() => handleTierChange('standard')}
            />
            <BreakTierCard
              id="deep"
              title="Deep"
              subtitle="20 min break · Choose your activity"
              selected={breakTier === 'deep'}
              onClick={() => handleTierChange('deep')}
            />
          </div>
        </section>

        {/* SECTION 3 — Break Activity Selector (Conditionally Rendered) */}
        {breakTier === 'deep' && (
          <motion.section 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="font-mono text-[#999999] uppercase tracking-widest text-sm">Break Activity</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <BreakActivityCard
                id="play"
                label="Play"
                icon={GameController}
                selected={breakActivity === 'play'}
                onClick={() => setBreakActivity('play')}
              />
              <BreakActivityCard
                id="move"
                label="Move"
                icon={ArrowRight}
                selected={breakActivity === 'move'}
                onClick={() => setBreakActivity('move')}
              />
              <BreakActivityCard
                id="fuel"
                label="Fuel"
                icon={Flame}
                selected={breakActivity === 'fuel'}
                onClick={() => setBreakActivity('fuel')}
              />
              <BreakActivityCard
                id="drift"
                label="Drift"
                icon={Waves}
                selected={breakActivity === 'drift'}
                onClick={() => setBreakActivity('drift')}
              />
              <BreakActivityCard
                id="surface"
                label="Surface"
                icon={ArrowSquareOut}
                selected={breakActivity === 'surface'}
                onClick={() => setBreakActivity('surface')}
              />
            </div>
          </motion.section>
        )}

        {/* SECTION 4 — Launch Button */}
        <section className="pt-8 flex justify-center">
          <button
            type="button"
            disabled={!isFormValid() || isLoading}
            onClick={handleLaunch}
            className={`
              w-full max-w-sm h-14 rounded-[12px] font-display font-bold uppercase tracking-widest text-[#000000] transition-all duration-300 flex items-center justify-center border-none
              ${!isFormValid() || isLoading
                ? 'opacity-50 cursor-not-allowed bg-gradient-to-br from-[#BFBFBF] to-[#999999]'
                : 'opacity-100 bg-gradient-to-br from-[#BFBFBF] to-[#999999] hover:-translate-y-[1px] shadow-none hover:shadow-[0_0_20px_rgba(191,191,191,0.15)]'
              }
            `}
          >
            {isLoading ? 'INITIATING...' : 'INITIATE SESSION'}
          </button>
        </section>

      </div>
    </div>
  );
};
