'use client';

import React from 'react';

interface GoldCoinLoaderProps {
  size?: number;
  label?: string | null;
  mini?: boolean;
}

export default function GoldCoinLoader({ 
  size = 80, 
  label = 'Loading...', 
  mini = false 
}: GoldCoinLoaderProps) {
  const effectiveSize = mini ? (size === 80 ? 20 : size) : size;

  return (
    <div 
      className={`gold-coin-loader ${mini ? 'mini' : ''}`}
      style={{ '--coin-size': `${effectiveSize}px` } as React.CSSProperties}
    >
      <div className="coin-container">
        <div className="coin">
          <div className="front">
            <div className="symbol">$</div>
          </div>
          <div className="back">
            <div className="symbol">$</div>
          </div>
          <div className="edge"></div>
        </div>
      </div>
      
      {!mini && label && (
        <p>{label}</p>
      )}
    </div>
  );
}
