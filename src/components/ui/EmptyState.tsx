import { motion } from 'framer-motion';
import { FileX, Search, ImageOff } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'file' | 'search' | 'image';
  title: string;
  description: string;
  action?: React.ReactNode;
}

const icons = {
  file: FileX,
  search: Search,
  image: ImageOff,
};

export default function EmptyState({ icon = 'file', title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center mb-5">
        <Icon size={36} className="text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary dark:text-dark-text-secondary max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  );
}
