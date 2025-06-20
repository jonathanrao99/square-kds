import { useState, useEffect } from 'react';

export function TimeAgo({ date }: { date: string }) {
    const [now, setNow] = useState(Date.now());
    
    useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 10000); // Update every 10s
      return () => clearInterval(interval);
    }, []);

    const seconds = Math.floor((now - new Date(date).getTime()) / 1000);
    if (seconds < 60) return <>just now</>;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return <>{minutes}m ago</>;
    const hours = Math.floor(minutes / 60);
    return <>{hours}h ago</>;
} 