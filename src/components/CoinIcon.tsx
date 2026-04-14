'use client';

import React from 'react';
import { Bitcoin } from 'lucide-react';

interface CoinIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export default function CoinIcon({ symbol, size = 24, className = "" }: CoinIconProps) {
  const normSymbol = symbol.toLowerCase().trim();

  // Bitcoin (Lucide Built-in)
  if (normSymbol === 'bitcoin' || normSymbol === 'btc') {
    return <Bitcoin size={size} className={className} color="var(--gold)" />;
  }

  // Ethereum (Custom SVG)
  if (normSymbol === 'ethereum' || normSymbol === 'eth') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 2l-7 12 7 4 7-4-7-12z" />
        <path d="M12 18l7-4-7-12-7 12 7 4z" />
        <path d="M12 22l-7-4 7-4 7 4-7 4z" />
      </svg>
    );
  }

  // USDT / Tether (Custom SVG)
  if (normSymbol === 'usdt' || normSymbol === 'tether' || normSymbol === 'trc-20') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M7 6h10" />
        <path d="M12 6v14" />
        <path d="M9 13h6" />
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M8 8l4-4 4 4" />
      </svg>
    );
  }

  // Litecoin (Custom SVG)
  if (normSymbol === 'litecoin' || normSymbol === 'ltc') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M10 7v10" />
        <path d="M8 13h8" />
        <path d="M14 7l-6 10" />
      </svg>
    );
  }

  // Solana (Custom SVG)
  if (normSymbol === 'solana' || normSymbol === 'sol') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M7 15h8l2-2" />
        <path d="M7 12h8l2-2" />
        <path d="M17 9H9L7 11" />
      </svg>
    );
  }

  // Fallback for others
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'rgba(212,175,55,0.1)', 
        borderRadius: '50%',
        fontSize: size * 0.5,
        fontWeight: 'bold',
        color: 'var(--gold)'
      }}
      className={className}
    >
      {symbol.charAt(0).toUpperCase()}
    </div>
  );
}
