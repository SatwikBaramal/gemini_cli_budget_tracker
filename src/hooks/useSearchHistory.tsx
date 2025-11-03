import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'expense_search_history';
const MAX_HISTORY_ITEMS = 5;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
        }
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Add search term to history
  const addToHistory = useCallback((term: string) => {
    if (!term || term.trim().length === 0) return;

    const trimmedTerm = term.trim();
    
    setHistory((prev) => {
      // Remove if already exists
      const filtered = prev.filter(item => item !== trimmedTerm);
      
      // Add to beginning and limit to MAX_HISTORY_ITEMS
      const newHistory = [trimmedTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
      
      return newHistory;
    });
  }, []);

  // Remove specific item from history
  const removeFromHistory = useCallback((term: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter(item => item !== term);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
      
      return newHistory;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}

