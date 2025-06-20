import { motion } from 'framer-motion';

const SkeletonCard = () => (
    <div className="flex flex-col rounded-lg shadow-2xl bg-gray-900 border border-gray-700/50">
        <div className="p-3 rounded-t-lg bg-gray-700 h-16 animate-pulse" />
        <div className="p-4 space-y-4 flex-grow">
            <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse" />
        </div>
        <div className="p-4 mt-auto">
            <div className="h-8 bg-gray-700 rounded w-full animate-pulse" />
        </div>
    </div>
);


export const SkeletonLoader = () => (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 items-start"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </motion.div>
); 