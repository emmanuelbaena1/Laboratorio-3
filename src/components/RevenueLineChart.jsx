import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

const CustomLineTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-title">{data.date}</div>
        <div className="tooltip-row">
          <span>Ingresos Día:</span>
          <strong style={{ color: '#FF8A65' }}>{formatCOP(data.daily)}</strong>
        </div>
        <div className="tooltip-row">
          <span>Acumulado:</span>
          <strong style={{ color: '#4ADE80' }}>{formatCOP(data.cumulative)}</strong>
        </div>
        <div className="tooltip-row">
          <span>Tiquetes Emitidos:</span>
          <strong>{data.tickets} tiquetes</strong>
        </div>
      </div>
    );
  }
  return null;
};

export default function RevenueLineChart({ data }) {
  const [viewType, setViewType] = useState('cumulative'); // 'cumulative' o 'daily'

  return (
    <div className="white-card">
      <div className="chart-card-header">
        <div className="chart-title-group">
          <h3>Evolución de Ingresos por Tiquetes Emitidos</h3>
          <p>Trayectoria temporal del recaudo neto en pesos colombianos (COP)</p>
        </div>

        {/* Selector de vista Acumulado / Diario */}
        <div className="table-filter-tabs">
          <button 
            className={`tab-btn ${viewType === 'cumulative' ? 'active' : ''}`}
            onClick={() => setViewType('cumulative')}
            type="button"
          >
            Acumulado
          </button>
          <button 
            className={`tab-btn ${viewType === 'daily' ? 'active' : ''}`}
            onClick={() => setViewType('daily')}
            type="button"
          >
            Por Fecha
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueCoralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6442" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6442" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF1E8" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#646E65', fontSize: 11 }}
              axisLine={{ stroke: '#E8EAE2' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#8A9289', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCOP(v, true)}
            />
            <Tooltip content={<CustomLineTooltip />} />
            <Area 
              type="monotone" 
              dataKey={viewType === 'cumulative' ? 'cumulative' : 'daily'} 
              stroke="#FF6442" 
              strokeWidth={2.8}
              fillOpacity={1} 
              fill="url(#revenueCoralGradient)" 
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

