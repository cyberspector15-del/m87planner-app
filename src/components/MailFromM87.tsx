import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'

interface MailFromM87Props {
  open: boolean
  onClose: () => void
  onBadgeRead: () => void
}

const mails = [
  {
    id: 1,
    title: 'OMV Rewards',
    body: 'Earn OMV tokens for every mission you complete. Hit streaks, climb rankings, and convert your discipline into real ecosystem currency across the SINGULARITY network.',
    timeline: 'Estimated: Q3 2026',
  },
  {
    id: 2,
    title: 'Leaderboard',
    body: 'A global leaderboard ranking every M87 user by consistency, completion rate, and output velocity. The top don\'t just win — they get paid in OMV.',
    timeline: 'Estimated: Q3 2026',
  },
  {
    id: 3,
    title: 'Friends & Competitive Mode',
    body: 'Invite your circle. Compete on streaks, mission output, and weekly velocity. Accountability meets competition.',
    timeline: 'Estimated: Q4 2026',
  },
  {
    id: 4,
    title: 'Profile & Social Layer',
    body: 'Customize your M87 identity. Build a profile that reflects your output, your streaks, your rank. Follow builders. Get followed. Your discipline — visible.',
    timeline: 'Estimated: Q4 2026',
  },
]

// Static star positions — generated once
const stars = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  top: `${Math.floor((i * 37 + 11) % 100)}%`,
  left: `${Math.floor((i * 53 + 7) % 100)}%`,
  size: (i % 3) + 1,
  opacity: 0.08 + (i % 4) * 0.05,
}))

export default function MailFromM87({ open, onClose, onBadgeRead }: MailFromM87Props) {
  const [openedCards, setOpenedCards] = useState<Set<number>>(new Set())
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      onBadgeRead()
      localStorage.setItem('m87_mail_opened', 'true')
    }
  }, [open, onBadgeRead])

  const toggleCard = (id: number) => {
    setOpenedCards(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Modal wrapper — centering via plain div, not Framer */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90vw',
              maxWidth: '660px',
              zIndex: 51,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                maxHeight: '82vh',
                overflowY: 'auto',
                background: 'linear-gradient(135deg, #141414 0%, #0A0A0A 100%)',
                border: '1px solid #333333',
                borderRadius: '12px',
                padding: '36px',
                boxShadow: '0 4px 24px -4px rgba(0,0,0,0.8), 0 0 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {/* Star field */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '12px', pointerEvents: 'none' }}>
                {stars.map(star => (
                  <div
                    key={star.id}
                    style={{
                      position: 'absolute',
                      top: star.top,
                      left: star.left,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      opacity: star.opacity,
                    }}
                  />
                ))}
              </div>

              {/* Ambient glow top */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(69,161,153,0.4), transparent)',
                pointerEvents: 'none',
              }} />

              {/* Modal header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                position: 'relative',
                zIndex: 1,
              }}>
                <div>
                  <p style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '9px',
                    letterSpacing: '0.2em',
                    color: '#45A199',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    opacity: 0.8,
                  }}>
                    SINGULARITY™ DISPATCH
                  </p>
                  <h2 style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}>
                    MAIL FROM M87
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#999999',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'
                      ; (e.currentTarget as HTMLButtonElement).style.borderColor = '#BFBFBF'
                      ; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#999999'
                      ; (e.currentTarget as HTMLButtonElement).style.borderColor = '#333333'
                      ; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'linear-gradient(90deg, rgba(69,161,153,0.3), #333333, transparent)',
                marginBottom: '24px',
                position: 'relative',
                zIndex: 1,
              }} />

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
                {mails.map((mail, index) => {
                  const isOpen = openedCards.has(mail.id)
                  const isHovered = hoveredCard === mail.id

                  return (
                    <motion.div
                      key={mail.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => toggleCard(mail.id)}
                      onMouseEnter={() => setHoveredCard(mail.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        background: isOpen
                          ? 'linear-gradient(135deg, rgba(69,161,153,0.08) 0%, rgba(20,20,20,0.95) 100%)'
                          : isHovered
                            ? 'linear-gradient(135deg, rgba(191,191,191,0.06) 0%, rgba(20,20,20,0.9) 100%)'
                            : 'linear-gradient(135deg, #1F1F1F 0%, #141414 100%)',
                        border: isOpen
                          ? '1px solid rgba(69,161,153,0.4)'
                          : isHovered
                            ? '1px solid rgba(191,191,191,0.25)'
                            : '1px solid #333333',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        boxShadow: isOpen
                          ? '0 0 30px rgba(69,161,153,0.12), inset 0 1px 0 rgba(69,161,153,0.1)'
                          : isHovered
                            ? '0 4px 24px -4px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)'
                            : '0 2px 8px rgba(0,0,0,0.4)',
                        transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      {/* Sealed row — always visible */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                      }}>
                        {/* Wax seal block */}
                        <div style={{
                          width: '52px',
                          height: '52px',
                          flexShrink: 0,
                          background: isOpen
                            ? 'radial-gradient(ellipse at center, rgba(69,161,153,0.15) 0%, rgba(26,26,26,0.8) 100%)'
                            : 'radial-gradient(ellipse at center, #292929 0%, #1A1A1A 100%)',
                          border: isOpen ? '1px solid rgba(69,161,153,0.3)' : '1px solid #333333',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 300ms ease',
                          boxShadow: isOpen ? '0 0 12px rgba(69,161,153,0.2)' : 'none',
                        }}>
                          {/* Wax seal */}
                          <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle at 35% 35%, #F0C040, #E8AB30)',
                            boxShadow: isOpen
                              ? '0 0 14px rgba(232,171,48,0.7)'
                              : '0 0 8px rgba(232,171,48,0.4)',
                            transition: 'all 300ms ease',
                          }} />
                        </div>

                        {/* Title area */}
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontFamily: 'Space Mono, monospace',
                            fontSize: '8px',
                            letterSpacing: '0.18em',
                            color: '#999999',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                          }}>
                            Upcoming Feature
                          </p>
                          <h3 style={{
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            color: isOpen ? '#FFFFFF' : '#E6E6E6',
                            margin: 0,
                            transition: 'color 200ms ease',
                          }}>
                            {mail.title}
                          </h3>
                        </div>

                        {/* Chevron */}
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          style={{ color: isOpen ? '#45A199' : '#999999', flexShrink: 0 }}
                        >
                          <ChevronDown size={16} />
                        </motion.div>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <motion.div
                              initial={{ y: 12, opacity: 0, filter: 'blur(4px)' }}
                              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                              exit={{ y: 8, opacity: 0 }}
                              transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                              style={{
                                padding: '0 20px 20px 88px',
                                borderTop: '1px solid rgba(69,161,153,0.15)',
                                paddingTop: '16px',
                              }}
                            >
                              <p style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '13px',
                                color: '#999999',
                                lineHeight: 1.75,
                                marginBottom: '16px',
                              }}>
                                {mail.body}
                              </p>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                {/* Timeline */}
                                <p style={{
                                  fontFamily: 'Space Mono, monospace',
                                  fontSize: '10px',
                                  letterSpacing: '0.12em',
                                  color: '#E8AB30',
                                  textTransform: 'uppercase',
                                  opacity: 0.9,
                                  margin: 0,
                                }}>
                                  {mail.timeline}
                                </p>

                                {/* Pill badge */}
                                <span style={{
                                  fontFamily: 'Space Mono, monospace',
                                  fontSize: '8px',
                                  letterSpacing: '0.14em',
                                  color: '#45A199',
                                  textTransform: 'uppercase',
                                  border: '1px solid rgba(69,161,153,0.35)',
                                  background: 'rgba(69,161,153,0.08)',
                                  padding: '3px 10px',
                                  borderRadius: '4px',
                                }}>
                                  UPCOMING
                                </span>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #1F1F1F',
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
              }}>
                <p style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  color: '#333333',
                  textTransform: 'uppercase',
                }}>
                  EVERYTHING CONVERGES HERE · SINGULARITY™
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
