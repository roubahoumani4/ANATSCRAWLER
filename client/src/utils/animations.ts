import { Variants } from "framer-motion";

// Page transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  out: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Container transitions with staggered children
export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Item variants for staggered animations
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

// Slide up animation
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// Slide down animation
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// Button hover animation
export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

// Button tap animation
export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

// Table row hover animation
export const tableRowHover = {
  backgroundColor: "hsl(var(--crimsonRed))",
  color: "hsl(var(--coolWhite))",
  transition: { duration: 0.2 },
};

// Modal animation
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Toast notification animation
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

// Form submission feedback animation
export const formFeedbackVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};
