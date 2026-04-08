'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import styles from './Navbar.module.css';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const navLinks = [
    { href: '/search', label: 'Search' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/favorites', label: 'Favorites' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>TechFinder</span>
        </Link>

        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.userSection}>
          {!loading && (
            user ? (
              <>
                <span className={styles.userEmail}>{user.email}</span>
                <Button variant="ghost" size="small" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="small">
                  Sign In
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
