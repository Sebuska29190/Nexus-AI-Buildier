import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const variants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  return (
    <motion.div
      key={routeKey}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
