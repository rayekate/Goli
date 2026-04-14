'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface ChartProps {
  data: { time: string; price: number }[];
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(8, 14, 26, 0.97)',
      border: '1px solid rgba(212,175,55,0.2)',
      borderRadius: '10px',
      padding: '0.65rem 1rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(10px)',
    }}>
      <p style={{ color: '#7B8CA8', fontSize: '0.7rem', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ color: '#D4AF37', fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        ${Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
}

export default function PriceChart({ data }: ChartProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Waiting for price data…</p>
      </div>
    );
  }

  const prices = data.map(d => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP;
  // Add a small padding so the line isn't right at the edge
  const domainMin = Number((minP - range * 0.3).toFixed(2));
  const domainMax = Number((maxP + range * 0.3).toFixed(2));

  // For dense data (per-second), only show every Nth tick on X axis
  const tickInterval = data.length > 60 ? 29 : data.length > 30 ? 14 : 'preserveStartEnd';

  const isUp = data.length >= 2 ? data[data.length - 1].price >= data[0].price : true;
  const strokeColor = isUp ? '#00e68a' : '#ff4757';
  const fillId = isUp ? 'colorUp' : 'colorDown';
  const stopColorUp = '#00e68a';
  const stopColorDown = '#ff4757';
  const stopColor = isUp ? stopColorUp : stopColorDown;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'rgba(8,14,26,0.7)',
      borderRadius: '16px',
      border: '1px solid rgba(212,175,55,0.06)',
      padding: isMobile ? '0.75rem 0.25rem 0.25rem' : '1rem 0.5rem 0.5rem',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      {/* Mini header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#7B8CA8', letterSpacing: '1px', textTransform: 'uppercase' }}>
          XAU/USD · {data.length}s of data
        </span>
        {data.length >= 2 && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: isUp ? '#00e68a' : '#ff4757',
            background: isUp ? 'rgba(0,230,138,0.07)' : 'rgba(255,71,87,0.07)',
            border: `1px solid ${isUp ? 'rgba(0,230,138,0.15)' : 'rgba(255,71,87,0.15)'}`,
            borderRadius: '6px',
            padding: '2px 8px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {isUp ? '▲' : '▼'} {Math.abs(data[data.length - 1].price - data[0].price).toFixed(2)}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minHeight: '230px', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: isMobile ? -10 : 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={stopColorUp}   stopOpacity={0.22} />
                <stop offset="60%" stopColor={stopColorUp}   stopOpacity={0.05} />
                <stop offset="95%" stopColor={stopColorUp}   stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={stopColorDown} stopOpacity={0.22} />
                <stop offset="60%" stopColor={stopColorDown} stopOpacity={0.05} />
                <stop offset="95%" stopColor={stopColorDown} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#3a4a5c"
              fontSize={isMobile ? 9 : 10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
              interval={tickInterval}
              minTickGap={isMobile ? 40 : 50}
              tick={{ fill: '#7B8CA8' }}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              stroke="#3a4a5c"
              fontSize={isMobile ? 9 : 10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => isMobile ? `${Number(v).toFixed(0)}` : `$${Number(v).toFixed(2)}`}
              tick={{ fill: '#7B8CA8' }}
              width={isMobile ? 40 : 68}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              fillOpacity={1}
              fill={`url(#${fillId})`}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: strokeColor, stroke: 'rgba(8,14,26,0.9)', strokeWidth: 2 }}
              isAnimationActive={false}  /* disable animation for per-second updates */
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
