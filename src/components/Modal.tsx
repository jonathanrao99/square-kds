import { motion } from 'framer-motion';

export const Modal = ({ children, onConfirm, onCancel }: { children: React.ReactNode, onConfirm: () => void, onCancel: () => void }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
        onClick={onCancel}
    >
        <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-white"
            onClick={e => e.stopPropagation()}
        >
            <div className="text-center mb-6">{children}</div>
            <div className="flex justify-around">
                <button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 transition-colors text-white font-bold py-2 px-8 rounded-lg">Yes</button>
                <button onClick={onCancel} className="bg-red-600 hover:bg-red-700 transition-colors text-white font-bold py-2 px-8 rounded-lg">No</button>
            </div>
        </motion.div>
    </motion.div>
); 