'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Shield, Wallet, BarChart2, ArrowRight, Zap, Globe, Clock, ChevronRight } from 'lucide-react';
import PriceChart from '@/components/PriceChart';
import LivePriceTicker from '@/components/LivePriceTicker';
import { motion } from 'framer-motion';

export default function Home() {
  const { user } = useAuth();
  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);
  const [timeframe, setTimeframe] = useState<'30m' | '1h' | '1d'>('1h');
  const timeframeRef = React.useRef(timeframe);
  const lastUpdateTimeRef = React.useRef(Date.now());

  // Generate data based on timeframe
  const generateData = useCallback((tf: '30m' | '1h' | '1d', basePrice: number = 2468.50) => {
    const initialData = [];
    const now = Date.now();
    let points = 60;
    let stepMs = 60000; // 1 min per point
    let volatility = 5;

    if (tf === '30m') {
      points = 30;
      stepMs = 60000;
      volatility = 3;
    } else if (tf === '1h') {
      points = 60;
      stepMs = 60000;
      volatility = 5;
    } else if (tf === '1d') {
      points = 24;
      stepMs = 3600000; // 1 hour per point
      volatility = 25;
    }

    let currentPrice = basePrice;
    for (let i = points; i >= 0; i--) {
      const date = new Date(now - i * stepMs);
      const time = tf === '1d' 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      currentPrice = currentPrice + (Math.random() - 0.5) * volatility;
      initialData.push({ time, price: currentPrice });
    }
    return initialData;
  }, []);
  React.useEffect(() => {
    timeframeRef.current = timeframe;
    setPriceHistory(generateData(timeframe));
    lastUpdateTimeRef.current = Date.now();
  }, [timeframe, generateData]);

  const handlePriceUpdate = useCallback((price: number, _history: any[]) => {
    setPriceHistory(prev => {
       const tf = timeframeRef.current;
       const intervalMs = tf === '1d' ? 3600000 : 60000;
       
       if (prev.length === 0) return generateData(tf, price);

       // If the new real price is massively different from our dummy generator, regenerate
       if (Math.abs(prev[prev.length - 1].price - price) > 20) {
          return generateData(tf, price);
       }
       
       const newHistory = [...prev];
       
       const now = Date.now();
       
       if (now - lastUpdateTimeRef.current >= intervalMs) {
         // Interval passed! Push new point and slide
         const timeObj = new Date(now);
         const time = tf === '1d' 
           ? timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
           : timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
           
         newHistory.push({ time, price });
         newHistory.shift(); // slide the chart
         lastUpdateTimeRef.current = now;
       } else {
         // Still in the same interval, just update the live price on the current edge
         const lastIdx = newHistory.length - 1;
         newHistory[lastIdx] = { ...newHistory[lastIdx], price };
       }
       
       return newHistory;
    });
  }, []);

  return (
    <div className="animate-in" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Hidden price ticker to drive the chart data */}
      <div style={{ display: 'none' }}>
        <LivePriceTicker onPriceUpdate={handlePriceUpdate} />
      </div>

      {/* Hero Section */}
      <section className="hero-section" style={{ padding: '140px 0 180px', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="hero-grid" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8rem' }}>
            
            {/* Left Content */}
            <motion.div 
              className="hero-content" 
              style={{ flex: '1 1 520px', minWidth: 0 }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ marginBottom: '3rem' }}>
                <span className="meta-text" style={{ 
                  padding: '8px 16px', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '100px', 
                  background: 'rgba(var(--text), 0.02)' 
                }}>
                  Institutional Terminal v2.0
                </span>
              </div>

              <h1 style={{ 
                fontSize: 'clamp(4.5rem, 11vw, 9.5rem)', 
                marginBottom: '3rem',
                color: 'var(--text)',
                lineHeight: 0.85,
                letterSpacing: '-0.04em',
                fontWeight: 950
              }}>
                GOLD<br />
                <span style={{ color: 'var(--primary)' }}>PRECISION</span>
              </h1>

              <motion.p 
                style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', 
                  maxWidth: '480px', 
                  marginBottom: '5rem', 
                  lineHeight: 1.6,
                  fontWeight: 500
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                Bespoke trading infrastructure for the modern editorial era. 
                Experience up to <strong style={{ color: 'var(--text)' }}>80% yields</strong> with raw transparency.
              </motion.p>
              
              <motion.div 
                className="hero-buttons" 
                style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {user ? (
                  <Link href="/dashboard" className="btn btn-asymmetric interactive-haptic" style={{ 
                    padding: '1.75rem 5rem', 
                    fontSize: '0.8rem', 
                    fontWeight: 900, 
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-text)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4em'
                  }}>
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-asymmetric interactive-haptic" style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1.5rem 4rem', 
                      fontSize: '0.8rem', 
                      fontWeight: 900, 
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-text)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4em'
                    }}>
                      Entry Setup <ChevronRight size={16} />
                    </Link>
                    <Link href="/login" className="meta-text interactive-haptic" style={{ fontSize: '11px', textDecoration: 'underline', textUnderlineOffset: '12px' }}>
                      Terminal Access
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Right Chart Card with Definitive Ghost Border and Glow */}
            <motion.div 
              style={{ flex: '1 1 480px', width: '100%', minWidth: 0, position: 'relative' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Subtle background glow */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                background: 'var(--accent)',
                opacity: 0.07,
                filter: 'blur(120px)',
                borderRadius: '50%',
                zIndex: 0,
                pointerEvents: 'none'
              }} />

              <div className="ghost-border-wrapper" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--surface)',
                  overflow: 'hidden',
                  transition: 'var(--transition-editorial)',
                  padding: 0,
                  position: 'relative'
                }} className="card-asymmetric">
                  
                  {/* Timeframe Controls (Floating) */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '1.5rem', 
                    left: '1.5rem', 
                    zIndex: 10, 
                    display: 'flex', 
                    gap: '0.5rem', 
                    flexWrap: 'wrap' 
                  }}>
                    {['30m', '1h', '1d'].map(tf => (
                      <button 
                        key={tf}
                        onClick={() => setTimeframe(tf as '30m'|'1h'|'1d')}
                        className="btn-asymmetric interactive-haptic"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '10px',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.2em',
                          background: timeframe === tf ? 'var(--text)' : 'rgba(var(--text), 0.05)',
                          color: timeframe === tf ? 'var(--background)' : 'var(--text-muted)',
                          border: timeframe === tf ? '1px solid var(--text)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <div className="trade-chart-col" style={{ minWidth: 0, height: '500px', overflow: 'hidden' }}>
                    <PriceChart data={priceHistory} singleColor="#f59e0b" minimal={true} />
                  </div>
                </div>
                <div className="ghost-border" />
              </div>
            </motion.div>
          </div>

          {/* Institutional Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '6rem',
            marginTop: '18rem',
          }}>
            {[
              { label: 'Settlement', value: 'INSTANT', accent: 'var(--primary)' },
              { label: 'Target Yield', value: '80.00%', accent: 'var(--text)' },
              { label: 'Security', value: 'BESPOKE', accent: 'var(--accent)' },
            ].map((stat, idx) => (
              <div key={idx} style={{ borderTop: '1px solid var(--border)', paddingTop: '3rem' }}>
                <div className="meta-text" style={{ marginBottom: '2rem' }}>{stat.label}</div>
                <h2 style={{ fontSize: '4.5rem', color: stat.accent }}>{stat.value}</h2>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative Section - Large Typography */}
      <section style={{ padding: '160px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <p className="display-header" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: 'var(--text)', textAlign: 'left' }}>
            We believe in <span style={{ color: 'var(--primary)' }}>raw whitespace</span> and Zinc neutrals to make your <span style={{ color: 'var(--accent)' }}>capital</span> feel like jewelry.
          </p>
        </div>
      </section>

      {/* Feature Grid with Asymmetric Cards */}
      <section style={{ padding: '160px 0' }}>
        <div className="container">
          <div style={{ marginBottom: '10rem' }}>
            <span className="meta-text">Platform Infrastructure</span>
            <h2 className="display-header" style={{ fontSize: '5rem', marginTop: '2rem' }}>EDITORIAL<br />PRECISION</h2>
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '6rem',
            width: '100%'
          }}>
            {[
              { step: '01', title: 'ONBOARDING', desc: 'Securely register your professional trading account within seconds.' },
              { step: '02', title: 'ASSET FUNDING', desc: 'Initialize your balance with Bitcoin, Ethereum, or USDT.' },
              { step: '03', title: 'EXECUTION', desc: 'Set your market direction—Long or Short—on real-time gold data.' },
              { step: '04', title: 'LIQUIDATION', desc: 'Secure your accrued profits with priority administrative review.' },
            ].map((item, i) => (
              <div key={item.step} className="ghost-border-wrapper">
                <div style={{ 
                  padding: '5rem 3.5rem', 
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '2.5rem',
                  minHeight: '400px'
                }} className="card-asymmetric">
                  <div className="meta-text" style={{ fontSize: '12px' }}>{item.step}</div>
                  <h3 className="display-header" style={{ fontSize: '2.5rem' }}>{item.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
                <div className="ghost-border" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      {!user && (
        <section style={{ padding: '160px 0' }}>
          <div className="container">
            <div style={{ 
              backgroundColor: 'var(--text)', 
              color: 'var(--background)',
              padding: '10rem 4rem', 
              textAlign: 'center'
            }} className="card-asymmetric">
              <span className="meta-text" style={{ color: 'var(--background)', opacity: 0.6 }}>Finality</span>
              <h2 className="display-header" style={{ 
                fontSize: 'clamp(3rem, 8vw, 6rem)', 
                marginTop: '3rem',
                marginBottom: '4rem',
                color: 'var(--background)'
              }}>
                JOIN THE<br />COLLECTIVE
              </h2>
              <Link href="/register" className="btn btn-asymmetric interactive-haptic" style={{ 
                padding: '1.5rem 6rem', 
                fontSize: '1rem', 
                fontWeight: 900, 
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
                textTransform: 'uppercase',
                letterSpacing: '0.3em'
              }}>
                Register Now
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
