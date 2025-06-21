import { useState, useEffect } from 'react';

export function TimeAgo({ date }: { date: string }) {
    const [now, setNow] = useState(Date.now());
    
    useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 10000); // Update every 10s
      return () => clearInterval(interval);
    }, []);

    const seconds = Math.floor((now - new Date(date).getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);

    let colorClass = 'text-green-400';
    if (minutes >= 10) {
        colorClass = 'text-red-500 font-bold';
    } else if (minutes >= 5) {
        colorClass = 'text-yellow-400';
    }

    let timeDisplay;
    if (seconds < 60) {
        timeDisplay = 'just now';
    } else if (minutes < 60) {
        timeDisplay = `${minutes}m ago`;
    } else {
        const hours = Math.floor(minutes / 60);
        timeDisplay = `${hours}h ago`;
    }

    return <span className={colorClass}>{timeDisplay}</span>;
} 