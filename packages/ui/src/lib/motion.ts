// AgentForge Premium — Motion System
// Centralized animation tokens for consistent motion across the app

export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
    gentle: 0.5,
  },
  easing: {
    spring: { type: "spring" as const, stiffness: 400, damping: 30 },
    smooth: [0.32, 0.72, 0, 1] as const,
    fade: [0.4, 0, 0.2, 1] as const,
    bounce: { type: "spring" as const, stiffness: 300, damping: 15 },
  },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
};

export const slideInRight = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
  transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
};

// Hover lift effect for cards
export const hoverLift = {
  whileHover: { y: -2, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)" },
  transition: { duration: 0.2 },
};

// Active press effect for buttons
export const activePress = {
  whileTap: { scale: 0.98 },
};
