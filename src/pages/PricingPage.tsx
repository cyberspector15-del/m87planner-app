import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, Check } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from "@/components/Header";

const PRICE_IDS = {
  'EVENT HORIZON': { monthly: 'event_horizon_monthly', annual: 'event_horizon_annual' },
  'ADVANCE': { monthly: 'advance_monthly', annual: 'advance_annual' },
  'APEX': { monthly: 'apex_monthly', annual: 'apex_annual' },
  'SINGULARITY': { monthly: 'singularity_monthly', annual: 'singularity_annual' },
  addons: {
    'FLUX BOOST': 'flux_boost',
    'FLUX SURGE': 'flux_surge',
    'FLUX OVERDRIVE': 'flux_overdrive',
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const TIER_KEY_MAP: Record<string, string> = {
  'EVENT HORIZON': 'event_horizon',
  'ADVANCE': 'advance',
  'APEX': 'apex',
  'SINGULARITY': 'singularity',
};

const PACK_CREDITS: Record<string, number> = {
  'FLUX BOOST': 200,
  'FLUX SURGE': 500,
  'FLUX OVERDRIVE': 1200,
};

const TIER_ALLOWANCE_MAP: Record<string, number> = {
  event_horizon: 500,
  advance: 1000,
  apex: 2000,
  singularity: 4000,
};

const CURRENCIES = {
  USD: { symbol: '$', label: 'USD' },
  INR: { symbol: '₹', label: 'INR' },
  EUR: { symbol: '€', label: 'EUR' },
  GBP: { symbol: '£', label: 'GBP' },
  AED: { symbol: 'د.إ', label: 'AED' },
  SGD: { symbol: 'S$', label: 'SGD' },
  CAD: { symbol: 'C$', label: 'CAD' },
} as const;

export default function PricingPage() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Currency state
  const [currency, setCurrency] = useState<keyof typeof CURRENCIES>('USD');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        setRates(data.rates);
        setRatesLoading(false);
      })
      .catch(() => {
        setRates({ USD: 1 });
        setRatesLoading(false);
      });
  }, []);

  const formatAmount = (usdPrice: number) => {
    if (!rates || !rates[currency] || currency === 'USD') {
      return usdPrice.toLocaleString('en-US', { minimumFractionDigits: usdPrice % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
    }
    const rate = rates[currency];
    const converted = usdPrice * rate;

    if (currency === 'INR') {
      return Math.round(converted).toLocaleString('en-IN');
    }

    return parseFloat(converted.toFixed(2)).toLocaleString('en-US', { minimumFractionDigits: converted % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
  };

  const handleGetStarted = (tierName: string) => {
    const links: Record<string, { monthly: string, annual: string }> = {
      'EVENT HORIZON': {
        monthly: 'https://whop.com/singularityspace/event-horizon-monthly',
        annual: 'https://whop.com/singularityspace/event-horizon-annual'
      },
      'ADVANCE': {
        monthly: 'https://whop.com/singularityspace/advance-monthly',
        annual: 'https://whop.com/singularityspace/advance-annual'
      },
      'APEX': {
        monthly: 'https://whop.com/singularityspace/apex-monthly-fc',
        annual: 'https://whop.com/singularityspace/apex-annual'
      },
      'SINGULARITY': {
        monthly: 'https://whop.com/singularityspace/singularity-monthly',
        annual: 'https://whop.com/singularityspace/singularity-annual'
      }
    };

    const url = isYearly ? links[tierName]?.annual : links[tierName]?.monthly;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleTopUp = (packName: string) => {
    const links: Record<string, string> = {
      'FLUX BOOST': 'https://whop.com/singularityspace/flux-boost',
      'FLUX SURGE': 'https://whop.com/singularityspace/flux-surge',
      'FLUX OVERDRIVE': 'https://whop.com/singularityspace/flux-overdrive'
    };

    const url = links[packName];
    if (url) {
      window.open(url, '_blank');
    }
  };

  const tiers = [
    {
      name: 'EVENT HORIZON',
      tagline: 'Enter the system.',
      badge: null,
      priceMonthly: 19,
      priceYearly: 12,
      priceYearlyTotal: 144,
      flux: '500',
      omv: '1x',
      variant: 'default',
    },
    {
      name: 'ADVANCE',
      tagline: 'Build real momentum.',
      badge: null,
      priceMonthly: 49,
      priceYearly: 39,
      priceYearlyTotal: 468,
      flux: '1,000',
      omv: '1.5x',
      variant: 'default',
    },
    {
      name: 'APEX',
      tagline: 'Command your trajectory.',
      badge: 'MOST POPULAR',
      priceMonthly: 79,
      priceYearly: 64,
      priceYearlyTotal: 768,
      flux: '2,000',
      omv: '2x',
      variant: 'apex',
    },
    {
      name: 'SINGULARITY',
      tagline: 'Maximum gravity. Maximum output.',
      badge: 'BEST VALUE',
      priceMonthly: 97,
      priceYearly: 87,
      priceYearlyTotal: 1044,
      flux: '4,000',
      omv: '3x',
      variant: 'singularity',
    },
  ];

  const standardFeatures = [
    'Task Management',
    'Routine Management',
    'Event Management',
    'Focus Mode',
    'Cognitive Games',
    'Analytics Dashboard',
  ];

  const aiFeatures = [
    { name: 'AI Auto-Scheduler', cost: '50 FLUX' },
    { name: 'Consequence Simulator', cost: '200 FLUX' },
    { name: 'AI Command', cost: '15 FLUX' },
    { name: 'Conversation Mode', cost: '30 FLUX' },
    { name: 'Smart Reschedule', cost: '20 FLUX' },
  ];

  const fluxPacks = [
    { name: 'FLUX BOOST', credits: '200', price: '12.99' },
    { name: 'FLUX SURGE', credits: '500', price: '27.99' },
    { name: 'FLUX OVERDRIVE', credits: '1,200', price: '59.99' },
  ];

  return (
    <div className="min-h-screen text-white relative" style={{ backgroundColor: '#000000', fontFamily: "'Inter', sans-serif" }}>
      <div className="relative z-10">
        <Header />

        <div className="px-6 md:px-12 lg:px-24" style={{ paddingTop: '48px', paddingBottom: '96px' }}>
          <div className="max-w-7xl mx-auto">

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-center mb-8"
            >
              <h1
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '36px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #BFBFBF 50%, #59A69D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                CHOOSE YOUR TRAJECTORY
              </h1>
            </motion.div>

            {/* Toggle Row */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
              className="flex justify-center items-center gap-4 mb-16 flex-wrap"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex p-1"
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid rgba(51,51,51,0.5)',
                    borderRadius: '8px',
                  }}
                >
                  <button
                    onClick={() => setIsYearly(false)}
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      padding: '8px 20px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      background: !isYearly ? '#292929' : 'transparent',
                      border: !isYearly ? '1px solid #333333' : '1px solid transparent',
                      color: !isYearly ? '#FFFFFF' : '#999999',
                      cursor: 'pointer',
                    }}
                  >
                    MONTHLY
                  </button>
                  <button
                    onClick={() => setIsYearly(true)}
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      padding: '8px 20px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      background: isYearly ? '#292929' : 'transparent',
                      border: isYearly ? '1px solid #333333' : '1px solid transparent',
                      color: isYearly ? '#FFFFFF' : '#999999',
                      cursor: 'pointer',
                    }}
                  >
                    YEARLY
                  </button>
                </div>
                {isYearly && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.12em',
                      color: '#45A199',
                    }}
                  >
                    SAVE UP TO 35%
                  </motion.span>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as keyof typeof CURRENCIES)}
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid #333333',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#FFFFFF',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '11px',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '80px',
                  }}
                  disabled={ratesLoading}
                >
                  {ratesLoading ? (
                    <option value="USD">Loading rates...</option>
                  ) : (
                    Object.entries(CURRENCIES).map(([code, { symbol }]) => (
                      <option key={code} value={code}>
                        {symbol} {code}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </motion.div>

            {/* Tier Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24"
            >
              {tiers.map((tier) => {
                const isSingularity = tier.variant === 'singularity';
                const isLoading = false;
                const isSuccess = false;

                return (
                  <motion.div
                    key={tier.name}
                    variants={itemVariants}
                    className="flex flex-col backdrop-blur-xl"
                    style={{
                      background: 'linear-gradient(135deg, #141414 0%, #0A0A0A 100%)',
                      border: isSingularity
                        ? '1px solid rgba(69,161,153,0.4)'
                        : '1px solid rgba(51,51,51,0.5)',
                      borderRadius: '12px',
                      padding: tier.badge ? '44px 32px 32px' : '60px 32px 32px',
                      transition: 'all 0.3s ease-in-out',
                      position: 'relative',
                    }}
                    whileHover={{
                      y: -2,
                      boxShadow: isSingularity
                        ? '0 0 30px rgba(69,161,153,0.3), 0 4px 24px -4px rgba(0,0,0,0.8)'
                        : '0 4px 24px -4px rgba(0,0,0,0.8)',
                      borderColor: isSingularity
                        ? 'rgba(69,161,153,0.6)'
                        : 'rgba(51,51,51,0.8)',
                    }}
                  >
                    {/* Badge — floats on top card edge */}
                    {tier.badge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-16px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '11px',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#FFFFFF',
                          background: '#1F1F1F',
                          border: '1px solid #45A199',
                          borderRadius: '6px',
                          padding: '6px 16px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tier.badge}
                      </span>
                    )}

                    {/* Tier name */}
                    <h3
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                      }}
                    >
                      {tier.name}
                    </h3>

                    {/* Tagline */}
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '13px',
                        color: '#999999',
                        marginBottom: '24px',
                      }}
                    >
                      {tier.tagline}
                    </p>

                    {/* Price block */}
                    <div style={{ marginBottom: '24px', minHeight: '80px' }}>
                      <div className="flex items-baseline gap-1">
                        <span
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '18px',
                            fontWeight: 400,
                            color: '#999999',
                          }}
                        >
                          {CURRENCIES[currency].symbol}
                        </span>
                        <motion.span
                          key={isYearly ? 'yearly' : 'monthly'}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '48px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            lineHeight: 1,
                          }}
                        >
                          {formatAmount(isYearly ? tier.priceYearly : tier.priceMonthly)}
                        </motion.span>
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '14px',
                            color: '#999999',
                          }}
                        >
                          /mo
                        </span>
                      </div>
                      {isYearly && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '11px',
                            color: '#999999',
                            marginTop: '6px',
                          }}
                        >
                          billed {CURRENCIES[currency].symbol}{formatAmount(tier.priceYearlyTotal)} annually
                        </motion.div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => !isLoading && !isSuccess && handleGetStarted(tier.name)}
                      disabled={isLoading || isSuccess}
                      style={{
                        width: '100%',
                        padding: '14px 0',
                        borderRadius: '8px',
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#000000',
                        border: 'none',
                        cursor: (isLoading || isSuccess) ? 'not-allowed' : 'pointer',
                        opacity: (isLoading || isSuccess) ? 0.85 : 1,
                        background: isSuccess
                          ? '#2EB867'
                          : isSingularity
                            ? '#45A199'
                            : 'linear-gradient(135deg, #BFBFBF 0%, #999999 100%)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && !isSuccess) {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                          if (isSingularity) {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(69,161,153,0.4)';
                          } else {
                            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                        (e.currentTarget as HTMLButtonElement).style.filter = 'none';
                      }}
                    >
                      {isLoading ? 'PROCESSING...' : isSuccess ? 'ACTIVATED ✓' : 'GET STARTED'}
                    </button>

                    {/* Divider */}
                    <div
                      style={{
                        width: '100%',
                        height: '1px',
                        background: 'rgba(51,51,51,0.3)',
                        margin: '24px 0',
                      }}
                    />

                    {/* FLUX credits */}
                    <div style={{ marginBottom: '12px' }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                        <span style={{ color: '#45A199', fontSize: '12px' }}>✦</span>
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                          }}
                        >
                          {tier.flux} FLUX / month
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '11px',
                          color: '#999999',
                          paddingLeft: '20px',
                        }}
                      >
                        Rolls over up to 2 months
                      </div>
                    </div>

                    {/* OMV Emission */}
                    <div className="flex items-center gap-2" style={{ marginBottom: '24px' }}>
                      <div
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: '#45A199',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '12px',
                          color: '#999999',
                        }}
                      >
                        OMV Emission: {tier.omv}
                      </span>
                    </div>

                    {/* Feature list */}
                    <div className="flex-grow flex flex-col gap-6">
                      <div>
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
                          INCLUDED IN ALL TIERS
                        </div>
                        <ul className="flex flex-col gap-2">
                          {standardFeatures.map((feat) => (
                            <li key={feat} className="flex items-start gap-2">
                              <Check
                                size={13}
                                weight="bold"
                                style={{ color: '#2EB867', flexShrink: 0, marginTop: '2px' }}
                              />
                              <span
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: '13px',
                                  color: '#E6E6E6',
                                }}
                              >
                                {feat}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
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
                          AI FEATURES — USES FLUX
                        </div>
                        <ul className="flex flex-col gap-2">
                          {aiFeatures.map((feat) => (
                            <li key={feat.name} className="flex items-start gap-2">
                              <Check
                                size={13}
                                weight="bold"
                                style={{ color: '#2EB867', flexShrink: 0, marginTop: '2px' }}
                              />
                              <div className="flex flex-col">
                                <span
                                  style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '13px',
                                    color: '#E6E6E6',
                                  }}
                                >
                                  {feat.name}
                                </span>
                                <span
                                  style={{
                                    fontFamily: "'Space Mono', monospace",
                                    fontSize: '11px',
                                    color: '#999999',
                                  }}
                                >
                                  ({feat.cost})
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* FLUX Add-on Packs */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={containerVariants}
              className="flex flex-col items-center"
            >
              <div className="text-center mb-8">
                <h2
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    color: '#999999',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  FLUX ADD-ON PACKS
                </h2>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    color: '#999999',
                  }}
                >
                  Need more FLUX? Top up anytime. One-time purchase.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mx-auto">
                {fluxPacks.map((pack) => {
                  const isLoading = false;
                  const isSuccess = false;
                  return (
                    <motion.div
                      key={pack.name}
                      variants={itemVariants}
                      className="flex flex-col items-center text-center backdrop-blur-xl"
                      style={{
                        background: 'linear-gradient(135deg, #141414 0%, #0A0A0A 100%)',
                        border: '1px solid rgba(51,51,51,0.5)',
                        borderRadius: '12px',
                        padding: '32px 24px',
                        transition: 'all 0.3s ease-in-out',
                      }}
                      whileHover={{
                        y: -2,
                        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.8)',
                        borderColor: 'rgba(51,51,51,0.8)',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          letterSpacing: '0.06em',
                          marginBottom: '20px',
                        }}
                      >
                        {pack.name}
                      </div>
                      <div className="flex items-baseline gap-2" style={{ marginBottom: '6px' }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '32px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                          }}
                        >
                          {pack.credits}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: '12px',
                            color: '#999999',
                          }}
                        >
                          FLUX
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          marginBottom: '24px',
                        }}
                      >
                        {CURRENCIES[currency].symbol}{formatAmount(parseFloat(pack.price))}
                      </div>
                      <button
                        onClick={() => !isLoading && !isSuccess && handleTopUp(pack.name)}
                        disabled={isLoading || isSuccess}
                        style={{
                          width: '100%',
                          padding: '12px 0',
                          borderRadius: '8px',
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#000000',
                          border: 'none',
                          cursor: (isLoading || isSuccess) ? 'not-allowed' : 'pointer',
                          opacity: (isLoading || isSuccess) ? 0.85 : 1,
                          background: isSuccess
                            ? '#2EB867'
                            : 'linear-gradient(135deg, #BFBFBF 0%, #999999 100%)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading && !isSuccess) {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLButtonElement).style.filter = 'none';
                        }}
                      >
                        {isLoading ? 'PROCESSING...' : isSuccess ? 'ADDED ✓' : 'TOP UP'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <motion.div
              style={{
                marginTop: '80px',
                paddingBottom: '96px',
              }}
              variants={itemVariants}
            >
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: '#999999',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textAlign: 'center',
                marginBottom: '48px',
              }}>
                FREQUENTLY ASKED QUESTIONS
              </div>

              <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                {[
                  {
                    question: "What's the difference between the tiers?",
                    answer: "Every tier includes full access to Task Management, Routine Management, Event Management, Focus Mode, Cognitive Games, and Analytics. The difference is your monthly FLUX allocation — the credits that power M87's AI features. Event Horizon gives you 500 FLUX, Advance 1,000, Apex 2,000, and Singularity 4,000. More FLUX means more AI-powered decisions, simulations, and scheduling."
                  },
                  {
                    question: "What is FLUX and how does it work?",
                    answer: "FLUX is M87's credit system for AI-powered features. Every AI action costs FLUX — running a Consequence Simulation costs 200 FLUX, Auto-Planning your day costs 50, and an AI Command costs 15. Your FLUX resets monthly with your subscription. Unused FLUX rolls over for up to 2 months — so consistency is rewarded, not penalized. Need more mid-month? Top up with a one-time FLUX pack anytime."
                  },
                  {
                    question: "What happens to my FLUX if I don't use it all?",
                    answer: "Unused FLUX rolls over to the next month, up to a 2-month cap. If you're on Event Horizon (500 FLUX/month), you can bank up to 1,000 FLUX before rollover stops. This means consistent users always have a reserve — you're never starting from zero."
                  },
                  {
                    question: "What are OMV token rewards?",
                    answer: "OMV is the native token of the SINGULARITY™ ecosystem — the same universe that powers OmniX, Xenorex, and OMEN. Every action you complete in M87 earns OMV at a rate tied to your tier: 1x on Event Horizon, 1.5x on Advance, 2x on Apex, and 3x on Singularity. OMV token rewards are currently accumulating and will be claimable on-chain when the Omniverse Chain integration launches. Everything you earn now is yours."
                  },
                  {
                    question: "Is there a refund policy?",
                    answer: "Monthly plans cancelled within 24 hours of the initial charge are eligible for a 50% refund — no questions asked. After 24 hours, the current month is non-refundable but you retain access until the end of the billing cycle. Annual plans are non-refundable after purchase."
                  },
                  {
                    question: "How is my data handled?",
                    answer: "M87 Planner is built by SINGULARITY and your data is never sold to third parties or used for advertising. Your tasks, routines, and schedules are stored securely on Supabase infrastructure. We collect only what's necessary to run the product. Full details in our Privacy Policy."
                  }
                ].map((faq, idx, arr) => {
                  const isOpen = openFaqIndex === idx;
                  const isLast = idx === arr.length - 1;
                  return (
                    <div
                      key={idx}
                      style={{
                        borderBottom: isLast ? 'none' : '1px solid rgba(51,51,51,0.4)',
                        padding: '24px 0',
                      }}
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left',
                        }}
                      >
                        <span style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#FFFFFF',
                          letterSpacing: '0.03em',
                        }}>
                          {faq.question}
                        </span>
                        <span style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '18px',
                          color: '#45A199',
                          transition: 'transform 0.2s ease',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}>
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '14px',
                              color: '#999999',
                              lineHeight: 1.7,
                              marginTop: '16px',
                            }}>
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
