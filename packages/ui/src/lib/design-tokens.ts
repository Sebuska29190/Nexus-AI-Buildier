/**
 * Nova AI Builder — Design Tokens
 * Centralne wartości dla Dark Glassmorphism theme
 */

export const tokens = {
  colors: {
    bg: {
      primary: '#0a0a0f',
      secondary: '#12121a',
      tertiary: '#1a1a2e',
      glass: 'rgba(255, 255, 255, 0.03)',
      glassHover: 'rgba(255, 255, 255, 0.06)',
    },
    accent: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      violet: '#a78bfa',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
      glow: 'rgba(99, 102, 241, 0.15)',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      muted: '#475569',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(99, 102, 241, 0.4)',
    },
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  glass: {
    blur: '12px',
    bg: 'rgba(255, 255, 255, 0.03)',
    bgHover: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    radius: '1rem',
  },
  animation: {
    duration: {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.4s',
    },
    easing: {
      default: 'cubic-bezier(0.16, 1, 0.3, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
} as const;

/** Tailwind class shortcuts */
export const tw = {
  glass: {
    card: 'bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
    cardHover: 'hover:border-[rgba(99,102,241,0.15)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_40px_rgba(99,102,241,0.04)]',
    panel: 'bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl',
    input: 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[#f1f5f9] placeholder-[#475569] focus:border-[rgba(99,102,241,0.5)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:bg-[rgba(255,255,255,0.06)] outline-none transition-all duration-200',
    separator: 'h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent',
  },
  button: {
    primary: 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-semibold rounded-xl transition-all duration-[0.25s] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:brightness-110 active:translate-y-0',
    ghost: 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-[#94a3b8] font-medium rounded-xl transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f1f5f9] hover:border-[rgba(255,255,255,0.15)]',
  },
  text: {
    primary: 'text-[#f1f5f9]',
    secondary: 'text-[#94a3b8]',
    muted: 'text-[#475569]',
    accent: 'text-[#6366f1]',
  },
} as const;
