'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'findexio-theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme: Theme = saved ?? (preferredDark ? 'dark' : 'light');
    root.classList.toggle('dark', nextTheme === 'dark');
    setTheme(nextTheme);
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    root.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="no-underline rounded-full border border-[#51c7e9]/40 bg-[#51c7e9]/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#217d82] transition hover:border-[#51c7e9]/80 dark:text-[#81d7ea]"
      aria-label="Prepnúť svetlý alebo tmavý režim"
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
