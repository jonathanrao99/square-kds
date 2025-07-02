import Link from 'next/link';
import { motion } from 'framer-motion';

export const SubPageNav = () => (
    <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 text-[var(--text-primary)]"
    >
        <Link href="/" className="flex items-center space-x-2 text-lg hover:text-[var(--text-secondary)]">
            <span className="text-2xl">&larr;</span>
            <span>Back to KDS</span>
        </Link>
        <h1 className="text-3xl font-bold tracking-wider">Desi Flavors Katy KDS</h1>
        <div className="w-48"></div> {/* Spacer to balance the centered title */}
    </motion.nav>
); 