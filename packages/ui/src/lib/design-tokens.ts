/**
 * AgentForge — Design Tokens v3
 * Amber/forge palette, flat surfaces, sharper radii, monospace UI labels.
 * Estetyka: Linear / Raycast / Cursor — ciemny, minimalny, builder-minded.
 */
export const forge = {
  colors: {
    bg: {
      deepest: '#08080a',     // najciemniejsze - ambient
      primary: '#0a0a0b',     // główne tło
      secondary: '#111113',   // panele
      tertiary: '#161618',    // raised surfaces / cards
      glass: 'rgba(255, 255, 255, 0.02)',
      glassHover: 'rgba(255, 255, 255, 0.04)',
    },
    accent: {
      amber: '#F59E0B',       // primary accent - iskra z kuźni
      orange: '#EA580C',      // accent dark - anvil
      yellow: '#FCD34D',      // accent light - spark highlight
      ember: '#DC2626',       // deep ember (errors/danger accent)
    },
    text: {
      primary: '#E4E4E7',     // główny tekst
      secondary: '#A1A1AA',   // labelki
      muted: '#71717A',       // hinty/placeholdery
      accent: '#F59E0B',      // amber accent text
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.10)',
      active: 'rgba(245, 158, 11, 0.40)',
      glow: 'rgba(245, 158, 11, 0.25)',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    agent: {
      main: '#F59E0B',        // amber - domyślny
      research: '#3B82F6',    // blue
      coder: '#10B981',       // green
      data: '#F59E0B',        // amber
      security: '#EF4444',    // red
      devops: '#8B5CF6',      // violet
      pm: '#EC4899',          // pink
      tester: '#14B8A6',      // teal
      docs: '#F97316',        // orange
      paper: '#A855F7',       // purple
    },
  },
  typography: {
    fontFamily: {
      display: '"Inter", system-ui, sans-serif',
      body: '"Inter", system-ui, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
  },
  // Flat surfaces - bez glassmorphism, ostrzejsze rogi
  glass: {
    card: 'bg-[#111113] border border-[rgba(255,255,255,0.06)] rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
    cardHover: 'hover:border-[rgba(245,158,11,0.20)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-all duration-150',
    input: 'bg-[#0a0a0b] border border-[rgba(255,255,255,0.10)] rounded-md text-[#E4E4E7] placeholder-[#71717A] focus:border-[rgba(245,158,11,0.50)] focus:shadow-[0_0_0_1px_rgba(245,158,11,0.30)] outline-none transition-all duration-150',
    separator: 'h-px bg-[rgba(255,255,255,0.06)]',
    panel: 'bg-[#0d0d0f] border border-[rgba(255,255,255,0.06)] rounded-md',
  },
  button: {
    primary: 'bg-[#F59E0B] text-[#0a0a0b] font-semibold rounded-md transition-all duration-150 hover:bg-[#FCD34D] hover:shadow-[0_0_16px_rgba(245,158,11,0.30)] active:bg-[#EA580C]',
    ghost: 'bg-transparent border border-[rgba(255,255,255,0.10)] text-[#A1A1AA] font-medium rounded-md transition-all duration-150 hover:bg-[rgba(255,255,255,0.04)] hover:text-[#E4E4E7] hover:border-[rgba(255,255,255,0.15)]',
    danger: 'bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.25)] text-[#FCA5A5] font-medium rounded-md transition-all duration-150 hover:bg-[rgba(239,68,68,0.20)]',
    icon: 'p-2 rounded-md text-[#71717A] hover:text-[#F59E0B] hover:bg-[rgba(245,158,11,0.08)] transition-all duration-150',
  },
  text: {
    primary: 'text-[#E4E4E7]',
    secondary: 'text-[#A1A1AA]',
    muted: 'text-[#71717A]',
    accent: 'text-[#F59E0B]',
    gradient: 'bg-gradient-to-r from-[#F59E0B] to-[#EA580C] bg-clip-text text-transparent',
  },
  animation: {
    duration: { instant: '0.1s', fast: '0.15s', normal: '0.2s', slow: '0.3s', slower: '0.5s' },
    easing: { default: 'cubic-bezier(0.16,1,0.3,1)', spring: 'cubic-bezier(0.34,1.56,0.64,1)', smooth: 'cubic-bezier(0.4,0,0.2,1)' },
  },
  // Sharper radii vs v2 (było xl/2xl wszędzie)
  radius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' },
  z: { base: 0, dropdown: 10, sticky: 20, sidebar: 30, modal: 40, tooltip: 50, toast: 60, palette: 70 },
} as const;

// Shorthand tw classes
export const nx = {
  card: `${forge.glass.card} ${forge.glass.cardHover}`,
  btn: forge.button.primary,
  btnGhost: forge.button.ghost,
  input: forge.glass.input,
  heading: 'font-semibold tracking-tight',
  badge: 'px-2 py-0.5 rounded-md text-xs font-medium font-mono',
} as const;
