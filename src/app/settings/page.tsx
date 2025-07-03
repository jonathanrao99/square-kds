"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Settings() {
  const [theme, setTheme] = useState('dark'); // Keep theme state for now, but remove UI controls
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState(0); // 0 for webhook-driven, >0 for polling

  const { data: locationsData, error: locationsError } = useSWR('/api/locations', fetcher);
  const locations = locationsData?.locations || [];

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedSoundEnabled = localStorage.getItem('soundEnabled');
    if (savedSoundEnabled !== null) {
      setSoundEnabled(JSON.parse(savedSoundEnabled));
    }
    const savedLocation = localStorage.getItem('selectedLocation');
    if (savedLocation) {
      setSelectedLocation(savedLocation);
    }
    const savedRefreshInterval = localStorage.getItem('refreshInterval');
    if (savedRefreshInterval) {
      setRefreshInterval(parseInt(savedRefreshInterval));
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage whenever they change
    localStorage.setItem('theme', theme);
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
    localStorage.setItem('selectedLocation', selectedLocation);
    localStorage.setItem('refreshInterval', refreshInterval.toString());
  }, [theme, soundEnabled, selectedLocation, refreshInterval]);

  return (
    <div className={`min-h-screen bg-[var(--background-dark)] text-[var(--text-primary)]`}>
      <Header 
        navLinks={[
          { href: "/", label: "Back to KDS" },
          { href: "/dashboard", label: "Analytics" },
        ]}
      />
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        <div className="space-y-12">
          {/* Theme Settings - Removed UI controls */}
          {/* Sound Notification Settings */}
          <div className="p-6 bg-[var(--background-light)] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Sound Notifications</h2>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="toggle toggle-lg" // Assuming you have a Tailwind CSS toggle component or similar styling
                checked={soundEnabled}
                onChange={() => setSoundEnabled(!soundEnabled)}
              />
              <span className="text-lg">Enable Sounds</span>
            </label>
            <p className="text-[var(--text-secondary)] mt-2">Further sound customization options can go here.</p>
          </div>

          {/* Location Filtering Settings */}
          <div className="p-6 bg-[var(--background-light)] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Location Filtering</h2>
            <select 
              className="p-2 rounded-md bg-[var(--background-dark)] text-[var(--text-primary)]"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              {locations.map((loc: { id: string; name: string }) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {locationsError && <p className="text-[var(--red-color)] text-sm mt-2">Error loading locations.</p>}
            <p className="text-[var(--text-secondary)] mt-2">Filter orders by specific Square locations.</p>
          </div>

          {/* Refresh Interval Settings */}
          <div className="p-6 bg-[var(--background-light)] rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Refresh Interval</h2>
            <input 
              type="number" 
              className="p-2 rounded-md bg-[var(--background-dark)] text-[var(--text-primary)] w-24"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              min="0"
            /> seconds (0 for webhook-driven)
            <p className="text-[var(--text-secondary)] mt-2">Set how often the order list refreshes. 0 means updates are driven by webhooks.</p>
          </div>
        </div>
      </main>
    </div>
  );
}