"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { SubPageNav } from '@/components/SubPageNav';
import { SimpleNavbar } from '@/components/SimpleNavbar';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openTime, setOpenTime] = useState('17:00');
  const [closeTime, setCloseTime] = useState('01:00');
  const [warningTime, setWarningTime] = useState(5);
  const [dangerTime, setDangerTime] = useState(10);

  useEffect(() => {
    setMounted(true);
    const storedOpenTime = localStorage.getItem('openTime');
    const storedCloseTime = localStorage.getItem('closeTime');
    const storedWarningTime = localStorage.getItem('timerWarningTime');
    const storedDangerTime = localStorage.getItem('timerDangerTime');

    if (storedOpenTime) setOpenTime(storedOpenTime);
    if (storedCloseTime) setCloseTime(storedCloseTime);
    if (storedWarningTime) setWarningTime(parseInt(storedWarningTime, 10));
    if (storedDangerTime) setDangerTime(parseInt(storedDangerTime, 10));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('openTime', openTime);
      localStorage.setItem('closeTime', closeTime);
      localStorage.setItem('timerWarningTime', String(warningTime));
      localStorage.setItem('timerDangerTime', String(dangerTime));
    }
  }, [openTime, closeTime, warningTime, dangerTime, mounted]);
  
  if (!mounted) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-[#181818] text-white`}>
      <SimpleNavbar />
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        <div className="space-y-12">
          {/* Theme Settings */}
          <div className="p-6 bg-[#232323] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Theme</h2>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-orange-600' : 'bg-[#333]'}`}
              >
                Dark
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded-md ${theme === 'light' ? 'bg-orange-600' : 'bg-[#333]'}`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Sound Notification Settings */}
          <div className="p-6 bg-[#232323] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Sound Notifications</h2>
            <p className="text-gray-400">Placeholder for sound settings.</p>
          </div>

          {/* Location Filtering Settings */}
          <div className="p-6 bg-[#232323] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Location Filtering</h2>
            <p className="text-gray-400">Placeholder for location filtering.</p>
          </div>

          {/* Refresh Interval Settings */}
          <div className="p-6 bg-[#232323] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Refresh Interval</h2>
            <p className="text-gray-400">Placeholder for refresh interval settings.</p>
          </div>

          {/* Timer Alert Settings */}
          <div className="p-6 bg-[#232323] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Timer Alerts (in minutes)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="warningTime" className="block text-sm font-medium text-gray-300">Warning Time</label>
                <input 
                  type="number"
                  id="warningTime"
                  value={warningTime}
                  onChange={(e) => setWarningTime(Math.max(0, parseInt(e.target.value, 10)))}
                  className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm bg-[#181818] text-white"
                />
              </div>
              <div>
                <label htmlFor="dangerTime" className="block text-sm font-medium text-gray-300">Danger Time</label>
                <input 
                  type="number" 
                  id="dangerTime"
                  value={dangerTime}
                  onChange={(e) => setDangerTime(Math.max(0, parseInt(e.target.value, 10)))}
                  className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm bg-[#181818] text-white"
                />
              </div>
            </div>
          </div>

          {/* Business Hours Settings */}
          <div className="p-6 bg-[#232323] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Business Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="openTime" className="block text-sm font-medium text-gray-300">Open Time</label>
                <input 
                  type="time"
                  id="openTime"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm bg-[#181818] text-white"
                />
              </div>
              <div>
                <label htmlFor="closeTime" className="block text-sm font-medium text-gray-300">Close Time</label>
                <input 
                  type="time" 
                  id="closeTime"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm bg-[#181818] text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 