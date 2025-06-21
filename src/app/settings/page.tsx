"use client";

import { useState } from 'react';
import { Header } from '@/components/Header';
import { SubPageNav } from '@/components/SubPageNav';

export default function Settings() {
  const [theme, setTheme] = useState('dark');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
      <SubPageNav />
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        <div className="space-y-12">
          {/* Theme Settings */}
          <div className="p-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Theme</h2>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Dark
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded-md ${theme === 'light' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Sound Notification Settings */}
          <div className="p-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Sound Notifications</h2>
            <p className="text-gray-400">Placeholder for sound settings.</p>
          </div>

          {/* Location Filtering Settings */}
          <div className="p-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Location Filtering</h2>
            <p className="text-gray-400">Placeholder for location filtering.</p>
          </div>

          {/* Refresh Interval Settings */}
          <div className="p-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Refresh Interval</h2>
            <p className="text-gray-400">Placeholder for refresh interval settings.</p>
          </div>
        </div>
      </main>
    </div>
  );
} 