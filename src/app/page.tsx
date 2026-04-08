'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SearchBar } from '@/components/search/SearchBar';
import styles from './home.module.css';

function LandingSearchBar() {
  const router = useRouter();
  
  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };
  
  return <SearchBar onSearch={handleSearch} />;
}

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.background}>
          <div className={styles.gridOverlay} />
          <div className={styles.glowOrb} />
        </div>
        <div className={styles.hero}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>⌕</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gridOverlay} />
        <div className={styles.noise} />
        <div className={styles.glowOrb} />
        <div className={styles.glowOrb2} />
      </div>

      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <div className={styles.navLogo}>⌕</div>
          <span className={styles.navBrand}>TechFinder Pro</span>
        </div>
        <div className={styles.navRight}>
          <Link href="/search" className={styles.navLink}>Search</Link>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <button className={`${styles.navButton} ${styles.navButtonPrimary}`}>
                {user.email?.split('@')[0]}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>Sign In</Link>
              <Link href="/login">
                <button className={`${styles.navButton} ${styles.navButtonPrimary}`}>
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⌕</span>
          </div>
        </div>
        
        <h1 className={styles.title}>
          Find the <span className={styles.titleAccent}>Best Deals</span><br />
          on Tech
        </h1>
        
        <p className={styles.subtitle}>
          Compare prices across eBay, AliExpress, and Google Shopping instantly. 
          Never overpay for your next gadget again.
        </p>
        
        <div className={styles.searchWrapper}>
          <LandingSearchBar />
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Price Comparison</h3>
            <p className={styles.featureDesc}>Search across multiple retailers in one click</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Real-time Updates</h3>
            <p className={styles.featureDesc}>Get the latest prices as they change</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Track Favorites</h3>
            <p className={styles.featureDesc}>Save items and get notified of price drops</p>
          </div>
        </div>

        <section className={styles.stats}>
          <div className={styles.statsItem}>
            <span className={styles.statsNumber}>50K+</span>
            <span className={styles.statsLabel}>Products Compared</span>
          </div>
          <div className={styles.statsDivider} />
          <div className={styles.statsItem}>
            <span className={styles.statsNumber}>3</span>
            <span className={styles.statsLabel}>Stores Supported</span>
          </div>
          <div className={styles.statsDivider} />
          <div className={styles.statsItem}>
            <span className={styles.statsNumber}>24/7</span>
            <span className={styles.statsLabel}>Price Monitoring</span>
          </div>
        </section>
      </section>
    </div>
  );
}
