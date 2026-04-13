'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Minus, Activity } from 'lucide-react';
import styles from './LivePriceTicker.module.css';

interface PricePoint {
  time: string;
  price: number;
}

interface LivePriceTickerProps {
  /** Called every second with the latest simulated price and history */
  onPriceUpdate?: (price: number, history: PricePoint[]) => void;
  /** Show compact mode (just the number, for embedding in headers) */
  compact?: boolean;
}

// Pure client-side micro-price simulation between real API fetches.
// Real price is fetched from our API then we jitter ±0.03 per second
// to simulate live tick-by-tick movement — the same technique used by
// broker platforms like IQ Option, Olymp Trade, etc.
const JITTER = 0.5; // max randomised movement per tick (in USD)
const CHART_POINTS = 120; // 2 minutes of second-by-second points

function nextPrice(base: number): number {
  const change = (Math.random() - 0.5) * 2 * JITTER;
  return Math.max(1, Number((base + change).toFixed(2)));
}

export default function LivePriceTicker({ onPriceUpdate, compact = false }: LivePriceTickerProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<PricePoint[]>([]);
  const [sessionChange, setSessionChange] = useState(0);
  const [sessionChangePct, setSessionChangePct] = useState(0);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [perSecondChange, setPerSecondChange] = useState(0);

  const baseRef = useRef<number>(0);         // last real API price
  const sessionOpenRef = useRef<number>(0);  // first price of this session
  const historyRef = useRef<PricePoint[]>([]); // Track history for closure-safe access
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch real price from our API (every 15s)
  const fetchRealPrice = async () => {
    try {
      const res = await fetch('/api/price');
      if (!res.ok) return;
      const data = await res.json();
      if (data.price && data.price > 0) {
        baseRef.current = data.price;
        if (sessionOpenRef.current === 0) {
          sessionOpenRef.current = data.price;
        }
      }
    } catch { /* network error — keep using last known */ }
  };

  useEffect(() => {
    // Initial fetch, then every 15s
    fetchRealPrice();
    apiRef.current = setInterval(fetchRealPrice, 15_000);

    // Wait for initial price before starting tick
    const startTick = () => {
      if (baseRef.current === 0) {
        setTimeout(startTick, 500);
        return;
      }

      // If first load, initialise with a few pre-filled ticks
      setPrice(baseRef.current);

      tickRef.current = setInterval(() => {
        const newPrice = nextPrice(baseRef.current);
        baseRef.current = newPrice; // update base for next jitter

        setPrice((prev) => {
          const delta = Number((newPrice - (prev ?? newPrice)).toFixed(2));
          setPerSecondChange(delta);
          if (delta !== 0) setFlash(delta > 0 ? 'up' : 'down');
          setTimeout(() => setFlash(null), 400);
          return newPrice;
        });

        const now = new Date();
        const label = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setHistoryData((prev) => {
          const updated = [...prev, { time: label, price: newPrice }];
          if (updated.length > CHART_POINTS) updated.shift();

          const open = sessionOpenRef.current || newPrice;
          const chg = Number((newPrice - open).toFixed(2));
          const chgPct = open > 0 ? Number(((chg / open) * 100).toFixed(3)) : 0;
          setSessionChange(chg);
          setSessionChangePct(chgPct);

          historyRef.current = updated; // Sync ref
          return updated;
        });

        // Notify parent OUTSIDE of state setters to avoid reconciliation errors
        // Use ref to avoid stale closure on historyData
        onPriceUpdate?.(newPrice, historyRef.current);
      }, 1000);
    };

    startTick();

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (apiRef.current) clearInterval(apiRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUp = sessionChange >= 0;
  const dirColor = isUp ? 'var(--success)' : 'var(--danger)';

  if (compact) {
    return (
      <div className={styles.compact}>
        <span className={`${styles.compactPrice} ${flash ? styles['flash_' + flash] : ''}`}>
          {price !== null ? `$${price.toFixed(2)}` : '—'}
        </span>
        {perSecondChange !== 0 && (
          <span className={styles.compactDelta} style={{ color: perSecondChange > 0 ? 'var(--success)' : 'var(--danger)' }}>
            {perSecondChange > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(perSecondChange).toFixed(2)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.ticker}>
      {/* Live dot */}
      <div className={styles.liveBadge}>
        <span className={styles.liveDot} />
        <span>LIVE</span>
        <Activity size={11} style={{ opacity: 0.7 }} />
      </div>

      {/* Main price */}
      <div className={`${styles.priceWrap} ${flash ? styles['flash_' + flash] : ''}`}>
        <span className={styles.currency}>XAU/USD</span>
        <span className={styles.price}>
          {price !== null ? `$${price.toFixed(2)}` : (
            <span className={styles.skeleton} style={{ width: 160, height: 40, display: 'inline-block' }} />
          )}
        </span>

        {/* Per-second change */}
        {perSecondChange !== 0 && (
          <span className={styles.deltaSec} style={{ color: perSecondChange > 0 ? 'var(--success)' : 'var(--danger)' }}>
            {perSecondChange > 0 ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
            {perSecondChange > 0 ? '+' : ''}{perSecondChange.toFixed(2)}
            <span style={{ fontSize: '0.7rem', fontWeight: 400, marginLeft: 3 }}>/sec</span>
          </span>
        )}
      </div>

      {/* Session change */}
      <div className={styles.sessionInfo}>
        <div className={styles.changePill} style={{ background: isUp ? 'rgba(0,230,138,0.08)' : 'rgba(255,71,87,0.08)', borderColor: isUp ? 'rgba(0,230,138,0.15)' : 'rgba(255,71,87,0.15)' }}>
          {isUp ? <ArrowUp size={13} color={dirColor} /> : sessionChange < 0 ? <ArrowDown size={13} color={dirColor} /> : <Minus size={13} color={dirColor} />}
          <span style={{ color: dirColor, fontWeight: 700 }}>
            {sessionChange > 0 ? '+' : ''}{sessionChange.toFixed(2)}
          </span>
          <span style={{ color: dirColor, opacity: 0.75 }}>
            ({sessionChangePct > 0 ? '+' : ''}{sessionChangePct.toFixed(3)}%)
          </span>
        </div>
        <span className={styles.sessionLabel}>Session Change</span>
      </div>
    </div>
  );
}
