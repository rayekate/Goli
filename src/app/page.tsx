'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Shield, Wallet, BarChart2, ArrowRight, Zap, Globe, Clock } from 'lucide-react';
import ProfitChart from '@/components/ProfitChart';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="animate-in">
      {/* Ambient Background */}
      <div className="ambient-orb orb-gold" style={{ top: '5%', left: '15%', width: '600px', height: '600px' }} />
      <div className="ambient-orb orb-purple" style={{ top: '30%', right: '5%', width: '500px', height: '500px' }} />
      <div className="ambient-orb orb-gold" style={{ bottom: '0', left: '40%', width: '700px', height: '700px', opacity: 0.15 }} />

      {/* Hero */}
      <section style={{ padding: '20px 0 60px', position: 'relative' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
            
            {/* Left Content */}
            <div style={{ flex: '1 1 450px', textAlign: 'left' }}>
              <div className="badge badge-primary animate-float" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 8px var(--gold-glow)', display: 'inline-block', marginRight: '8px' }} />
                LIVE GOLD PRICE: XAU/USD
              </div>

              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1.5rem', lineHeight: 1.15, fontWeight: 800 }}>
                Trade Gold Price<br />
                <span className="text-gradient-gold">Movements & Profit</span>
              </h1>

              <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem, 2vw, 1.15rem)', maxWidth: '540px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
                Deposit funds, predict gold price direction, and earn up to{' '}
                <strong style={{ color: '#fff' }}>80% profit</strong> on every winning trade. Experience next-gen trading.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {user ? (
                  <>
                    <Link href="/dashboard" className="btn btn-gold" style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem', boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}>
                      Go to Dashboard <ArrowRight size={18} />
                    </Link>
                    <Link href="/trade" className="btn btn-outline" style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem' }}>
                      Start Trading
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-gold neon-pulse" style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem' }}>
                      Start Trading Now <ArrowRight size={18} />
                    </Link>
                    <Link href="/login" className="btn btn-outline" style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem' }}>
                      Login to Account
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Content - The Chart */}
            <div style={{ flex: '1 1 500px', width: '100%', minWidth: 0, perspective: '1000px' }}>
              <div className="animate-float" style={{ animationDelay: '0.5s', transformStyle: 'preserve-3d', transform: 'rotateY(-5deg) rotateX(2deg)', boxShadow: '-20px 20px 60px rgba(0,0,0,0.5)' }}>
                <ProfitChart />
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'flex',
            gap: 'clamp(1.5rem, 4vw, 3rem)',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            marginTop: '6rem',
            padding: 'clamp(1.5rem, 3vw, 2.5rem)',
            background: 'rgba(8, 14, 26, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderTop: '2px solid rgba(212,175,55,0.4)',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            {[
              { label: 'Profit Per Win', value: '80%' },
              { label: 'Supported Crypto', value: 'BTC · ETH · USDT' },
              { label: 'Withdrawals', value: 'Admin Verified' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center', flex: '1 1 200px' }}>
                <p style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>{stat.value}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gold)', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 0', position: 'relative' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="text-gradient-gold" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>How It Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Four simple steps to start trading</p>
          </div>
          <div className="dashboard-grid">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with email and password. Takes less than 60 seconds.', icon: Zap },
              { step: '02', title: 'Deposit Funds', desc: 'Send crypto (BTC, ETH, USDT) to our wallet. Submit your transaction hash.', icon: Wallet },
              { step: '03', title: 'Trade Gold', desc: 'Predict gold price direction — UP or DOWN. Earn 80% profit if correct.', icon: TrendingUp },
              { step: '04', title: 'Withdraw Profit', desc: 'Request a withdrawal. Our admin team reviews and processes it.', icon: Clock },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className={`stagger-${i+1}`} style={{
                  position: 'relative',
                  background: 'rgba(8, 14, 26, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(212,175,55,0.08)',
                  borderRadius: '16px',
                  padding: '2rem',
                  overflow: 'hidden',
                  transition: 'all 0.35s ease',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)' }} />
                  <div style={{ position: 'absolute', top: '-10px', right: '15px', fontSize: '5rem', fontWeight: 900, color: 'rgba(212,175,55,0.03)', lineHeight: 1 }}>{item.step}</div>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(212,175,55,0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <Icon size={22} color="var(--gold)" />
                  </div>
                  <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.15rem' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 0 80px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="text-gradient-gold" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>Platform Features</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Everything you need to trade with confidence</p>
          </div>
          <div className="dashboard-grid">
            {[
              { title: 'Live Gold Price', desc: 'Real-time XAU/USD price updates with a live chart so you can make informed decisions.', icon: TrendingUp },
              { title: 'Profit Analytics', desc: 'Visual performance metrics showcasing balance growth, win rates, and profits.', icon: BarChart2 },
              { title: 'Crypto Integrations', desc: 'Fund your account via Bitcoin, Ethereum, or USDT with transaction proofs.', icon: Wallet },
              { title: 'Secure Payouts', desc: 'All withdrawals are manually reviewed by our admin team for maximum security.', icon: Shield },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`stagger-${i+1}`} style={{
                  position: 'relative',
                  background: 'rgba(8, 14, 26, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(212,175,55,0.08)',
                  borderTop: '2px solid rgba(212,175,55,0.2)',
                  borderRadius: '16px',
                  padding: '2rem',
                  overflow: 'hidden',
                  transition: 'all 0.35s ease',
                }}>
                  <Icon size={40} color="var(--gold)" style={{ marginBottom: '1.25rem', opacity: 0.9 }} />
                  <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.2rem' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{ padding: '40px 0 80px', textAlign: 'center', position: 'relative' }}>
          <div className="container">
            <div style={{
              position: 'relative',
              background: 'rgba(8, 14, 26, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212,175,55,0.1)',
              borderRadius: '20px',
              padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
              <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--gold)', filter: 'blur(100px)', opacity: 0.06 }} />
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '1rem', color: '#fff' }}>Ready to Start Trading?</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem', fontSize: '1.05rem' }}>
                Join traders who profit from gold price movements every day.
              </p>
              <Link href="/register" className="btn btn-gold" style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '12px' }}>
                Create Free Account <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
