import { motion } from "motion/react";

interface MascotProps {
  status?: "happy" | "tired" | "excited" | "thinking";
  size?: number;
}

export default function Mascot({ status = "happy", size = 120 }: MascotProps) {
  const getColors = () => {
    switch (status) {
      case "tired": return { primary: "#D97706", light: "#FDE68A" }; // More brownish/muted
      default: return { primary: "#FF8C42", light: "#FFD5B8" };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        {/* Tail */}
        <motion.path
          d="M160 140C180 120 180 80 160 60"
          stroke={colors.primary}
          strokeWidth="20"
          strokeLinecap="round"
          animate={{ rotate: [0, 10, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Body */}
        <circle cx="100" cy="130" r="45" fill={colors.primary} />
        
        {/* Head */}
        <path
          d="M60 90C60 67.9086 77.9086 50 100 50C122.091 50 140 67.9086 140 90C140 112.091 122.091 130 100 130C77.9086 130 60 112.091 60 90Z"
          fill={colors.primary}
        />
        
        {/* Ears */}
        <path d="M70 60L60 30L90 55Z" fill={colors.primary} />
        <path d="M130 60L140 30L110 55Z" fill={colors.primary} />
        
        {/* Face (White part) */}
        <path
          d="M85 100C85 85 115 85 115 100C115 115 100 125 100 125C100 125 85 115 85 100Z"
          fill={colors.light}
        />
        
        {/* Eyes */}
        <motion.circle
          cx="88"
          cy="92"
          r="4"
          fill="#1C1917"
          animate={status === "tired" ? { scaleY: 0.2 } : { scaleY: [1, 0.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 1] }}
        />
        <motion.circle
          cx="112"
          cy="92"
          r="4"
          fill="#1C1917"
          animate={status === "tired" ? { scaleY: 0.2 } : { scaleY: [1, 0.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 1] }}
        />
        
        {/* Nose */}
        <circle cx="100" cy="105" r="3" fill="#1C1917" />
        
        {/* Status indicator */}
        {status === "excited" && (
          <motion.text
            x="140"
            y="40"
            fontSize="30"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ✨
          </motion.text>
        )}
        {status === "happy" && (
          <motion.text
            x="140"
            y="40"
            fontSize="24"
            animate={{ opacity: [0, 1, 0], y: [0, -20] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ❤️
          </motion.text>
        )}
      </svg>
    </motion.div>
  );
}
