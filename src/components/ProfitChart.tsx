'use client';

import React, { useEffect, useState, useRef } from 'react';

interface ChartProps {
  symbol?: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isUp: boolean;
}

export default function ProfitChart({ symbol = 'XAU/USD' }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [data, setData] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<number>(60); // seconds
  const [zoom, setZoom] = useState<number>(80); // amount of visible candles
  const [isMobile, setIsMobile] = useState(false);

  // Interactivity State
  const [hoverData, setHoverData] = useState<{ x: number, y: number, candle: Candle | null } | null>(null);

  // Auto-resize Logic
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setDimensions({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height
      });
    });
    observer.observe(containerRef.current);
    
    setDimensions({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    });

    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => { observer.disconnect(); window.removeEventListener('resize', checkMobile); };
  }, []);

  // Fetch API & Simulate Live Market
  useEffect(() => {
    let updateInterval: ReturnType<typeof setInterval>;
    let isCancelled = false;

    const initData = async () => {
      let basePrice = 4715.00; // Sensible 2026 fallback
      try {
        const res = await fetch('/api/price');
        if (res.ok) {
          const fetched = await res.json();
          if (fetched?.price > 0) basePrice = fetched.price;
        }
      } catch (err) {}

      if (isCancelled) return;

      const volatility = timeframe >= 86400 ? 60 : timeframe >= 3600 ? 25 : timeframe >= 900 ? 10 : timeframe >= 300 ? 4 : 1.5;

      let now = Math.floor(Date.now() / 1000);
      let currentTime = now - (now % timeframe) - (100 * timeframe); // Gen up to 100 candles
      const initialData: Candle[] = [];
      
      let price = basePrice;
      for (let i = 0; i < 100; i++) {
        const open = price + (Math.random() * 2 - 1) * (volatility * 0.8);
        const close = open + (Math.random() * 4 - 2) * (volatility * 0.8);
        initialData.push({
          time: currentTime,
          open,
          high: Math.max(open, close) + Math.random() * volatility,
          low: Math.min(open, close) - Math.random() * volatility,
          close,
          volume: Math.random() * 1000 + 100,
          isUp: close >= open,
        });
        price = close;
        currentTime += timeframe;
      }
      
      setData(initialData);
      setCurrentPrice(price);

      updateInterval = setInterval(() => {
        setData(prev => {
          if (prev.length === 0) return prev;
          const arr = [...prev];
          let last = { ...arr[arr.length - 1] };
          
          const currentNow = Math.floor(Date.now() / 1000);
          const currentCandleTime = currentNow - (currentNow % timeframe);
          
          const change = (Math.random() * 1.5 - 0.75); // Live tick stays volatile per second
          const newCurrentPrice = last.close + change;
          setCurrentPrice(newCurrentPrice);

          if (currentCandleTime > last.time) {
            if (arr.length >= 150) arr.shift();
            arr.push({
              time: currentCandleTime,
              open: last.close,
              high: Math.max(last.close, newCurrentPrice),
              low: Math.min(last.close, newCurrentPrice),
              close: newCurrentPrice,
              volume: Math.random() * 20,
              isUp: newCurrentPrice >= last.close,
            });
          } else {
            last.high = Math.max(last.high, newCurrentPrice);
            last.low = Math.min(last.low, newCurrentPrice);
            last.close = newCurrentPrice;
            last.isUp = newCurrentPrice >= last.open;
            last.volume += Math.random() * 20;
            arr[arr.length - 1] = last;
          }
          return arr;
        });
      }, 1000); // 1-second ticks
    };

    initData();
    return () => { 
        isCancelled = true;
        if (updateInterval) clearInterval(updateInterval); 
    };
  }, [timeframe]);

  const visibleData = data.slice(-zoom);
  const { width, height } = dimensions;
  const padding = { top: 20, bottom: 25, left: isMobile ? 5 : 10, right: isMobile ? 50 : 65 };
  const chartW = Math.max(1, width - padding.left - padding.right);
  const chartH = Math.max(1, height - padding.top - padding.bottom);
  const volumeH = Math.min(60, chartH * 0.25);
  
  const minPrice = visibleData.length ? Math.min(...visibleData.map(d => d.low)) : 0;
  const maxPrice = visibleData.length ? Math.max(...visibleData.map(d => d.high)) : 0;
  const range = (maxPrice - minPrice) || 1;
  const yMin = minPrice - range * 0.1; 
  const yMax = maxPrice + range * 0.1;
  const yRange = yMax - yMin;

  const maxVolume = visibleData.length ? Math.max(...visibleData.map(d => d.volume)) : 1;

  const getY = (val: number) => padding.top + chartH - ((val - yMin) / yRange) * chartH;
  const getPriceFromY = (y: number) => yMin + ((padding.top + chartH - y) / chartH) * yRange;
  const getVolY = (val: number) => padding.top + chartH - (val / maxVolume) * volumeH;

  const candleWidth = chartW / (visibleData.length || 1);
  const bodyWidth = Math.max(1, Math.floor(candleWidth * 0.75));

  const colorUp = '#26a69a';
  const colorDown = '#ef5350';
  const gridColor = 'rgba(212, 175, 55, 0.05)';
  const textColor = '#7B8CA8';

  const timeframes = [
    { label: '1M', val: 60 },
    { label: '5M', val: 300 },
    { label: '15M', val: 900 },
    { label: '1H', val: 3600 },
    { label: '1D', val: 86400 }
  ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < padding.left || x > width - padding.right || y < padding.top || y > height - padding.bottom) {
      setHoverData(null);
      return;
    }

    let index = Math.floor((x - padding.left) / candleWidth);
    if (index < 0) index = 0;
    if (index >= visibleData.length) index = visibleData.length - 1;

    const exactX = padding.left + index * candleWidth + (candleWidth / 2);
    setHoverData({ x: exactX, y, candle: visibleData[index] });
  };

  const currentHoverCandle = hoverData?.candle || (visibleData.length ? visibleData[visibleData.length - 1] : null);

  const renderDateStr = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    if (timeframe >= 86400) return `${date.getDate()}/${date.getMonth()+1}`;
    if (timeframe >= 3600) return `${date.getDate()}/${date.getMonth()+1} ${date.getHours().toString().padStart(2, '0')}:00`;
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      background: 'rgba(8, 14, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(212, 175, 55, 0.15)',
      borderRadius: '16px',
      padding: isMobile ? '1rem 0.5rem' : '1.25rem 1.5rem',
      height: '100%',
      minHeight: isMobile ? '350px' : '500px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25), transparent)' }} />
      
      {/* Chart Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem', position: 'relative', zIndex: 10, flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', color: '#fff', fontWeight: 600 }}>LIVE PRICE: <span className="text-gradient-gold">{symbol}</span></h3>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {timeframes.map(tf => (
               <button 
                  key={tf.val}
                  onClick={() => setTimeframe(tf.val)}
                  style={{
                    background: timeframe === tf.val ? 'rgba(212,175,55,0.15)' : 'transparent',
                    border: `1px solid ${timeframe === tf.val ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: timeframe === tf.val ? '#D4AF37' : '#7B8CA8',
                    padding: isMobile ? '3px 8px' : '4px 12px',
                    borderRadius: '6px',
                    fontSize: isMobile ? '0.68rem' : '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: timeframe === tf.val ? 600 : 400
                  }}
               >
                 {tf.label}
               </button>
            ))}
          </div>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#7B8CA8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Zoom</span>
            <input 
              type="range" 
              min="20" 
              max="120" 
              value={140 - zoom} 
              onChange={(e) => setZoom(140 - parseInt(e.target.value))} 
              style={{ width: '80px', accentColor: '#D4AF37', cursor: 'ew-resize' }}
            />
          </div>
        )}
      </div>

      {/* OHLC Bar */}
      <div style={{ minHeight: '24px', display: 'flex', gap: isMobile ? '8px' : '15px', alignItems: 'center', fontSize: isMobile ? '0.7rem' : '0.8rem', color: '#7B8CA8', zIndex: 10, flexWrap: 'wrap', overflow: 'hidden' }}>
        {currentHoverCandle && (
          <>
            <span>O <span style={{color: '#fff', fontWeight: 500}}>{currentHoverCandle.open.toFixed(2)}</span></span>
            <span>H <span style={{color: '#fff', fontWeight: 500}}>{currentHoverCandle.high.toFixed(2)}</span></span>
            <span>L <span style={{color: '#fff', fontWeight: 500}}>{currentHoverCandle.low.toFixed(2)}</span></span>
            <span>C <span style={{color: '#fff', fontWeight: 500}}>{currentHoverCandle.close.toFixed(2)}</span></span>
            <span style={{ color: currentHoverCandle.isUp ? colorUp : colorDown, fontWeight: 600 }}>
              {currentHoverCandle.isUp ? '▲' : '▼'} {Math.abs(currentHoverCandle.close - currentHoverCandle.open).toFixed(2)}
            </span>
          </>
        )}
      </div>
      
      <div ref={containerRef} style={{ width: '100%', flex: 1, position: 'relative', marginTop: '5px', minWidth: 0, overflow: 'hidden' }}>
        {visibleData.length > 0 && (
          <svg 
            width={width} 
            height={height} 
            style={{ position: 'absolute', top: 0, left: 0, cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverData(null)}
          >
            {/* Background Grid */}
            {[0.25, 0.50, 0.75].map((multiplier) => (
              <line key={multiplier} x1={0} y1={getY(yMin + yRange * multiplier)} x2={chartW} y2={getY(yMin + yRange * multiplier)} stroke={gridColor} strokeWidth={1} />
            ))}

            <defs>
              <linearGradient id="volUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorUp} stopOpacity={0.4} />
                <stop offset="100%" stopColor={colorUp} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="volDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorDown} stopOpacity={0.4} />
                <stop offset="100%" stopColor={colorDown} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Elements */}
            {visibleData.map((d, i) => {
              const xCenter = padding.left + i * candleWidth + (candleWidth / 2);
              const xLeft = xCenter - bodyWidth / 2;
              const yOpen = getY(d.open);
              const yClose = getY(d.close);
              const yHigh = getY(d.high);
              const yLow = getY(d.low);

              const color = d.isUp ? colorUp : colorDown;
              const fillGrad = d.isUp ? 'url(#volUp)' : 'url(#volDown)';
              const yTop = Math.min(yOpen, yClose);
              const yBottom = Math.max(yOpen, yClose);
              const bHeight = Math.max(1, yBottom - yTop);
              const volY = getVolY(d.volume);

              return (
                <g key={d.time}>
                  <rect x={xLeft} y={volY} width={bodyWidth} height={padding.top + chartH - volY} fill={fillGrad} />
                  <line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} stroke={color} strokeWidth="1.2" />
                  <rect x={xLeft} y={yTop} width={bodyWidth} height={bHeight} fill={color} stroke={color} strokeWidth="1" />
                </g>
              );
            })}

            {/* Price Y-Axis Labels */}
            {[0.25, 0.50, 0.75].map((multiplier) => (
              <text key={multiplier} x={chartW + 8} y={getY(yMin + yRange * multiplier) + 4} fill={textColor} fontSize="10" fontFamily="monospace">
                {(yMin + yRange * multiplier).toFixed(2)}
              </text>
            ))}

            {/* Time X-Axis Labels */}
            {visibleData.map((d, i) => {
               const step = Math.max(1, Math.floor(zoom / 6));
               if (i % step !== 0) return null;
               const x = padding.left + i * candleWidth;
               return <text key={i} x={x} y={padding.top + chartH + 18} fill={textColor} fontSize="10" textAnchor="middle" fontFamily="monospace">{renderDateStr(d.time)}</text>;
            })}

            {/* TradingView-Style Current Price Polygon Tag */}
            {currentPrice && (
               <g>
                 <line x1={padding.left} y1={getY(currentPrice)} x2={chartW} y2={getY(currentPrice)} stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 3" opacity={0.6}/>
                 
                 {/* Vector Polygon for sharp tag feel */}
                 <path 
                   d={`M ${chartW} ${getY(currentPrice)} 
                       L ${chartW + 8} ${getY(currentPrice) - 10} 
                       L ${chartW + 65} ${getY(currentPrice) - 10} 
                       L ${chartW + 65} ${getY(currentPrice) + 10} 
                       L ${chartW + 8} ${getY(currentPrice) + 10} Z`} 
                   fill="#D4AF37" 
                 />
                 <text x={chartW + 36} y={getY(currentPrice) + 4} fill="#000" fontSize="11" fontWeight="700" fontFamily="monospace" textAnchor="middle">
                   {currentPrice.toFixed(2)}
                 </text>
               </g>
            )}

            {/* Interactive Crosshair overlay */}
            {hoverData && (
              <g pointerEvents="none">
                <line x1={hoverData.x} y1={padding.top} x2={hoverData.x} y2={padding.top + chartH} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" strokeWidth={1} />
                <line x1={padding.left} y1={hoverData.y} x2={chartW} y2={hoverData.y} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" strokeWidth={1} />
                
                {/* Crosshair Price Tag */}
                <path 
                  d={`M ${chartW} ${hoverData.y} 
                      L ${chartW + 8} ${hoverData.y - 10} 
                      L ${chartW + 65} ${hoverData.y - 10} 
                      L ${chartW + 65} ${hoverData.y + 10} 
                      L ${chartW + 8} ${hoverData.y + 10} Z`} 
                  fill="#1E2A3B" 
                />
                <text x={chartW + 36} y={hoverData.y + 4} fill="#fff" fontSize="11" fontFamily="monospace" textAnchor="middle">
                  {getPriceFromY(hoverData.y).toFixed(2)}
                </text>

                {/* Crosshair Time Tag */}
                <rect x={hoverData.x - 30} y={padding.top + chartH + 5} width={60} height={18} fill="#1E2A3B" rx={2} />
                <text x={hoverData.x} y={padding.top + chartH + 18} fill="#fff" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {renderDateStr(hoverData.candle!.time)}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
