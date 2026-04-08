'use client';

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  initialValue?: string;
  history?: string[];
  onHistorySelect?: (query: string) => void;
  onClearHistory?: () => void;
}

export function SearchBar({ 
  onSearch, 
  loading = false, 
  initialValue = '',
  history = [],
  onHistorySelect,
  onClearHistory,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isFocused && history.length > 0 && !query) {
      setShowDropdown(true);
    }
  }, [isFocused, history, query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setShowDropdown(false);
      onSearch(trimmed);
      window.history.pushState({}, '', `?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowDropdown(false);
    onSearch(historyQuery);
    window.history.pushState({}, '', `?q=${encodeURIComponent(historyQuery)}`);
    onHistorySelect?.(historyQuery);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearHistory?.();
    setShowDropdown(false);
  };

  return (
    <div className={styles.formWrapper} ref={wrapperRef}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            className={styles.input}
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (history.length > 0 && !query) {
                setShowDropdown(true);
              }
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            disabled={loading}
          />
          {query && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => setQuery('')}
              tabIndex={-1}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner} />
              <span className={styles.buttonText}>Search</span>
            </>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {showDropdown && history.length > 0 && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Recent Searches</span>
            <button 
              type="button" 
              className={styles.clearHistoryButton}
              onClick={handleClearHistory}
            >
              Clear all
            </button>
          </div>
          <ul className={styles.dropdownList}>
            {history.map((item, index) => (
              <li key={index} className={styles.dropdownItem}>
                <button
                  type="button"
                  className={styles.historyButton}
                  onClick={() => handleHistoryClick(item)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  <span>{item}</span>
                </button>
                <button
                  type="button"
                  className={styles.removeHistoryButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newHistory = history.filter((h) => h !== item);
                    localStorage.setItem('techfinder_search_history', JSON.stringify(newHistory));
                    window.location.reload();
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
