import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from "@/components/Header";
import { motion } from 'framer-motion';

const PLAN_TO_TIER: Record<string, string> = {
  'event-horizon-monthly': 'event_horizon',
  'event-horizon-annual': 'event_horizon',
  'advance-monthly': 'advance',
  'advance-annual': 'advance',
  'apex-monthly-fc': 'apex',
  'apex-annual': 'apex',
  'singularity-monthly': 'singularity',
  'singularity-annual': 'singularity',
};

const TIER_ALLOWANCE: Record<string, number> = {
  event_horizon: 500,
  advance: 1000,
  apex: 2000,
  singularity: 4000,
};

const TIER_NAMES: Record<string, string> = {
  event_horizon: 'EVENT HORIZON',
  advance: 'ADVANCE',
  apex: 'APEX',
  singularity: 'SINGULARITY',
};

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  
  const plan = searchParams.get('plan');

  useEffect(() => {
    async function processPayment() {
      if (!plan) {
        setStatus('error');
        setErrorMsg('No plan specified.');
        return;
      }

      const tier = PLAN_TO_TIER[plan];
      if (!tier) {
        setStatus('error');
        setErrorMsg('Invalid plan specified.');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (!user) {
          setStatus('error');
          setErrorMsg('User not authenticated.');
          return;
        }

        // Update profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ subscription_tier: tier, subscription_status: 'active' })
          .eq('user_id', user.id);

        if (profileError) throw profileError;

        const allowance = TIER_ALLOWANCE[tier];

        // Upsert user_credits
        const { data: existing } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        const currentBalance = existing?.balance ?? 0;
        const newBalance = currentBalance + allowance;

        const { error: creditsError } = await supabase
          .from('user_credits')
          .upsert({
            user_id: user.id,
            balance: newBalance,
            monthly_allowance: allowance,
            last_reset_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (creditsError) throw creditsError;

        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setErrorMsg(err.message || 'Failed to activate subscription.');
      }
    }

    processPayment();
  }, [plan, navigate]);

  return (
    <div className="min-h-screen text-white relative" style={{ backgroundColor: '#000000', fontFamily: "'Inter', sans-serif" }}>
      <div className="relative z-10">
        <Header />
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '16px',
                color: '#999999',
                letterSpacing: '0.1em',
              }}
            >
              ACTIVATING SUBSCRIPTION...
            </motion.div>
          )}

          {status === 'success' && plan && PLAN_TO_TIER[plan] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '32px', color: '#FFFFFF', fontWeight: 700 }}>
                TRAJECTORY LOCKED
              </h1>
              <p style={{ fontSize: '16px', color: '#999999' }}>
                Your {TIER_NAMES[PLAN_TO_TIER[plan]]} subscription is now active.
              </p>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '13px', color: '#45A199' }}>
                {TIER_ALLOWANCE[PLAN_TO_TIER[plan]]} FLUX loaded to your account
              </p>
              <p style={{ fontSize: '12px', color: '#666666', marginTop: '16px' }}>
                Auto redirecting in 2 seconds...
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '32px', color: '#FF4444', fontWeight: 700 }}>
                ACTIVATION FAILED
              </h1>
              <p style={{ fontSize: '16px', color: '#999999' }}>
                {errorMsg}
              </p>
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  background: '#1A1A1A',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '12px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                RETURN TO PRICING
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
