'use client';

import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export function Input({
  label,
  error,
  icon,
  clearable = false,
  onClear,
  className = '',
  ...props
}: InputProps) {
  const inputClass = [
    styles.input,
    error && styles.error,
    icon && styles.withIcon,
    label && styles.hasLabel,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.inputWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span className={styles.searchIcon}>{icon}</span>}
        <input className={inputClass} {...props} />
        {clearable && props.value && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            tabIndex={-1}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}