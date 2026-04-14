'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Shield, Wallet, BarChart2, ArrowRight, Zap, Globe, Clock } from 'lucide-react';
import PriceChart from '@/components/PriceChart';
import LivePriceTicker from '@/components/LivePriceTicker';

export default function Home() {
  const { user } = useAuth();
  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);

  // Pre-fill history on load so chart isn't empty
  React.useEffect(() => {
    const basePrice = 2345.50; // Sensible starting point
    const initialData = [];
    const now = Date.now();
    for (let i = 60; i >= 0; i--) {
      const time = new Date(now - i * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const price = basePrice + (Math.random() - 0.5) * 5;
      initialData.push({ time, price });
    }
    setPriceHistory(initialData);
  }, []);

  const handlePriceUpdate = useCallback((_price: number, history: { time: string; price: number }[]) => {
    setPriceHistory(history);
  }, []);

  return (
    <div className="animate-in" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      {/* Hidden price ticker to drive the chart data */}
      <div style={{ display: 'none' }}>
        <LivePriceTicker onPriceUpdate={handlePriceUpdate} />
      </div>

      {/* Premium Texture Layers */}
      <div className="noise-texture" />
      
      {/* Drifting Mesh Gradient - Subliminal Depth */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(67, 56, 202, 0.03) 0%, transparent 50%)
          `,
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} 
      />

      {/* Dynamic Micro-Grid */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '100%', 
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.02) 1px, transparent 0)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 1
        }} 
      />
      
      {/* Ambient Focused Glows */}
      <div className="ambient-orb" style={{ top: '-10%', left: '10%', width: '1000px', height: '1000px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', zIndex: 1 }} />
      <div className="ambient-orb" style={{ bottom: '-10%', right: '-5%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(67, 56, 202, 0.03) 0%, transparent 70%)', zIndex: 1 }} />

      {/* Hero Section */}
      <section className="hero-section" style={{ padding: '100px 0 140px', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="hero-grid" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5rem' }}>
            
            {/* Left Content */}
            <div className="hero-content" style={{ flex: '1 1 480px', minWidth: 0 }}>
              <div style={{ 
                marginBottom: '2rem', 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(212, 175, 55, 0.03)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                padding: '0.6rem 1.2rem',
                borderRadius: '100px',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 12px var(--success)', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Live Terminal Active
                </span>
                <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  XAU / USD
                </span>
              </div>

              <h1 style={{ 
                fontSize: 'clamp(3rem, 7vw, 5rem)', 
                marginBottom: '1.5rem', 
                lineHeight: 1, 
                fontWeight: 950, 
                color: '#fff', 
                letterSpacing: '-3px',
                textShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}>
                Trade Gold with<br />
                <span style={{ 
                  background: 'linear-gradient(135deg, #fff 0%, var(--gold) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>High Precision</span>
              </h1>

              <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', maxWidth: '580px', marginBottom: '3.5rem', lineHeight: 1.7 }}>
                Harness institutional-grade tools to predict gold price movements easily. 
                Earn up to <strong style={{ color: 'var(--success)' }}>80% profit</strong> on accurate predictions.
              </p>
              
              <div className="hero-buttons" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                {user ? (
                  <>
                    <Link href="/dashboard" className="btn btn-gold" style={{ padding: '1.2rem 4rem', fontSize: '1rem', fontWeight: 800, borderRadius: '100px' }}>
                      Dashboard <ArrowRight size={18} />
                    </Link>
                    <Link href="/trade" className="btn btn-outline" style={{ padding: '1.2rem 3rem', fontSize: '1rem', borderRadius: '100px' }}>
                      Start Trading
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-gold" style={{ padding: '1.25rem 4.5rem', fontSize: '1rem', fontWeight: 900, borderRadius: '100px', boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)' }}>
                      Register Now <ArrowRight size={18} />
                    </Link>
                    <Link href="/login" className="btn btn-outline" style={{ padding: '1.25rem 3.5rem', fontSize: '1rem', borderRadius: '100px' }}>
                      Login
                    </Link>
                  </>
                )}
              </div>

              <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '2rem', opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} color="var(--gold)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Verified Security</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="var(--gold)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Instant Payouts</span>
                </div>
              </div>
            </div>

            <div style={{ flex: '1 1 480px', width: '100%', minWidth: 0 }}>
              <div style={{ 
                boxShadow: '0 40px 100px rgba(0,0,0,0.8)', 
                border: '1px solid rgba(212,175,55,0.1)', 
                borderRadius: '24px', 
                overflow: 'hidden',
                background: '#02040a',
                transition: 'all 0.4s ease',
              }}>
                <div className="trade-chart-col" style={{ minWidth: 0, height: '480px', overflow: 'hidden' }}>
                  <PriceChart data={priceHistory} />
                </div>
              </div>
            </div>
          </div>

            {/* Floating Institutional Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              marginTop: '12rem',
            }}>
              {[
                { label: 'Settlement Speed', value: 'Instant', icon: <Clock size={20} />, subtext: 'Auto-settled trades' },
                { label: 'Target Yield', value: '80%', icon: <TrendingUp size={20} />, subtext: 'Fixed profit model' },
                { label: 'Asset Security', value: 'Verified', icon: <Shield size={20} />, subtext: 'Multi-layer encryption' },
              ].map((stat, idx) => (
                <div key={idx} className="glass-card" style={{ 
                  padding: '2.5rem', 
                  animation: `fadeInSlide 0.5s ease forwards ${idx * 0.1}s`,
                  opacity: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div className="icon-box">{stat.icon}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 950, color: '#fff', letterSpacing: '-1px' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{stat.subtext}</div>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* Transparency Metrics Bar */}
      <section style={{ position: 'relative', zIndex: 2, marginTop: '-60px', marginBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div className="glass-card" style={{ 
            padding: '2rem', 
            background: 'rgba(10, 15, 25, 0.8)',
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            border: '1px solid rgba(212, 175, 55, 0.15)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            {[
              { label: 'Network status', value: 'Operational', color: 'var(--success)' },
              { label: '24h Volume', value: '$14.8M+', color: '#fff' },
              { label: 'Active nodes', value: '1,204', color: '#fff' },
              { label: 'Security level', value: 'Institutional', color: 'var(--gold)' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{stat.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '140px 0', background: 'var(--background-base)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>How it <span style={{ color: 'var(--gold)' }}>Works</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.8 }}>Simple and fast. Follow these steps to start your gold trading journey.</p>
          </div>
          <div className="dashboard-grid" style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '1.5rem',
            width: '100%'
          }}>
            {[
              { step: '01', title: 'Onboarding', desc: 'Securely register your professional trading account within seconds.', icon: Zap },
              { step: '02', title: 'Asset Funding', desc: 'Initialize your balance with Bitcoin, Ethereum, or USDT.', icon: Wallet },
              { step: '03', title: 'Execution', desc: 'Set your market direction—Long or Short—on real-time gold data.', icon: TrendingUp },
              { step: '04', title: 'Liquidation', desc: 'Secure your accrued profits with priority administrative review.', icon: Clock },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="glass-card" style={{ padding: '3.5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="step-label">{item.step}</div>
                  <div className="icon-box">
                    <Icon size={28} />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.8 }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Sets */}
      <section style={{ padding: '140px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>Platform <span style={{ color: 'var(--gold)' }}>Infrastructure</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.8 }}>Utilize our high-performance architecture designed for transparency and security.</p>
          </div>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {[
              { title: 'Real-Time Pricing', desc: 'Direct XAU/USD data aggregation for pinpoint accuracy in every market trade.', icon: TrendingUp },
              { title: 'Advanced Performance', desc: 'Visual analytics to monitor your win-ratio, total volume, and gross profit.', icon: BarChart2 },
              { title: 'Seamless Liquidity', desc: 'Instant settlement engine ensuring your capital is always prioritized.', icon: Zap },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="glass-card" style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="icon-box">
                    <Icon size={28} />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{feature.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.8 }}>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trader Testimonials Section */}
      <section style={{ padding: '140px 0', background: 'rgba(212, 175, 55, 0.01)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>Trusted by <span style={{ color: 'var(--gold)' }}>Professionals</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.8 }}>The choice of institutional traders for high-precision XAU/USD movements.</p>
          </div>
          
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { 
                name: "Marcus V.", 
                role: "Institutional Arbitrageur", 
                text: "The execution speed on GoldXchange is unmatched. I've switched my entire portfolio here for the pinpoint accuracy of the XAU/USD terminal.",
                avatar: "MV"
              },
              { 
                name: "Elena G.", 
                role: "Macro Strategist", 
                text: "Finally, a platform that understands the need for institutional-grade data. The transparency metrics and real-time settle-up times are best-in-class.",
                avatar: "EG"
              },
              { 
                name: "David K.", 
                role: "Proprietary Trader", 
                text: "GoldXchange provides the liquidity and clean UI necessary for high-stakes trading. The glassmorphic terminal is beautiful and highly functional.",
                avatar: "DK"
              }
            ].map((t, i) => (
              <div key={i} className="glass-card" style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'var(--gradient-gold)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: '#000'
                }}>
                  {t.avatar}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic' }}>"{t.text}"</p>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800 }}>{t.name}</div>
                  <div style={{ color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      {!user && (
        <section style={{ padding: '40px 0 140px' }}>
          <div className="container" style={{ maxWidth: '1000px' }}>
            <div className="glass-card" style={{ 
              padding: '5rem 2rem', 
              textAlign: 'center',
              borderRadius: '32px'
            }}>
              {/* Internal Polish Glows */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                width: '300px', 
                height: '300px', 
                background: 'var(--gold)', 
                filter: 'blur(150px)', 
                opacity: 0.05,
                zIndex: 0,
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ 
                  fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', 
                  marginBottom: '1.25rem', 
                  fontWeight: 950, 
                  letterSpacing: '-2px',
                  background: 'linear-gradient(135deg, #fff 0%, var(--gold) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Ready to Start?
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '3.5rem', maxWidth: '540px', margin: '0 auto 3.5rem', fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Join thousands of traders and start profiting from gold price movements with top-tier precision today.
                </p>
                <Link href="/register" className="btn btn-gold" style={{ padding: '1.2rem 4.5rem', fontSize: '1.1rem', fontWeight: 900, borderRadius: '100px', boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)' }}>
                  Join Now <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
