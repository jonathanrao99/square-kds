import { motion } from 'framer-motion';

interface HeaderProps {
    tab: 'open' | 'completed';
    setTab: (tab: 'open' | 'completed') => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const Header = ({ tab, setTab, onRefresh, isRefreshing }: HeaderProps) => (
    <header className="flex items-center justify-between mb-6 text-white">
        <div className="flex items-center space-x-4">
          <button className="text-3xl" aria-label="Menu">☰</button>
          <button className="text-3xl" onClick={onRefresh} aria-label="Refresh Orders">
            <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.7 }}>⟳</motion.div>
          </button>
        </div>
        <h1 className="text-3xl font-bold tracking-wider">Desi Flavors Katy KDS</h1>
        <div className="flex space-x-2">
          <button
            className={`px-5 py-2 rounded-lg text-lg font-semibold transition-colors ${tab === 'open' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            onClick={() => setTab('open')}
          >Open</button>
          <button
            className={`px-5 py-2 rounded-lg text-lg font-semibold transition-colors ${tab === 'completed' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            onClick={() => setTab('completed')}
          >Completed</button>
        </div>
      </header>
); 