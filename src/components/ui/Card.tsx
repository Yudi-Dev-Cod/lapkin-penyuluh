import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
  padding?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', gradient, hover = true, padding = true, onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' } : undefined}
      onClick={onClick}
      className={`
        rounded-2xl border transition-all duration-300
        ${gradient
          ? 'gradient-hero text-white border-transparent'
          : 'bg-surface border-border dark:bg-dark-surface-secondary dark:border-dark-border'
        }
        ${padding ? 'p-6' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
