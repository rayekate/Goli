'use client';

import React from 'react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background-base)',
      zIndex: 9999
    }}>
      <GoldCoinLoader label="Loading gold platform..." />
    </div>
  );
}
