import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { MoreVertical, TrendingUp, CheckCircle, Info } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

// Mapa de etiquetas en español para categorías de estado
const STATUS_CATEGORY_MAP = {
  open: 'Abierta',
  won: 'Abordó (Ganada)',
  lost: 'Perdida'
};

// Custom Tooltip estilizado con temática oscura moderna
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-title">{data.name}</div>
        <div className="tooltip-row">
          <span>Reservas:</span>
          <strong>{data.count}</strong>
        </div>
        <div className="tooltip-row">
          <span>Volumen Dinero:</span>
          <strong>{formatCOP(data.totalAmount)}</strong>
        </div>
        <div className="tooltip-row">
          <span>Prob. Éxito:</span>
          <strong>{data.winProbability}%</strong>
        </div>
        <div className="tooltip-row">
          <span>Categoría:</span>
          <span style={{ 
            textTransform: 'uppercase', 
            fontWeight: 700, 
            fontSize: '10px',
            color: data.statusCategory === 'won' ? '#34D399' : data.statusCategory === 'lost' ? '#F87171' : '#60A5FA'
          }}>
            {STATUS_CATEGORY_MAP[data.statusCategory] || data.statusCategory}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProcessBarChart({ data, totalReservas }) {
  // Calcular promedio de reservas por etapa para la línea de referencia
  const counts = data.map(d => d.count);
  const avgCount = counts.length > 0 ? (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1) : 0;
  
  // Encontrar el estado con mayor volumen (para mostrar banner destacado)
  const maxStage = data.reduce((max, cur) => cur.count > max.count ? cur : max, data[0] || { count: 0, name: '' });

  return (
    <div className="white-card">
      {/* Encabezado del gráfico */}
      <div className="chart-card-header">
        <div className="chart-title-group">
          <h3>Reservas por Estado del Proceso</h3>
          <p>Flujo completo de Reserva temporal → Pago → Check-in → Abordaje o Pérdida</p>
        </div>
        <button className="icon-button" style={{ border: 'none' }} title="Opciones" type="button">
          <MoreVertical size={16} color="#8A9289" />
        </button>
      </div>

      {/* Banner de métrica destacada (Fiel al banner "$24,747.01 +12% vs last month" de la imagen) */}
      <div className="chart-stat-banner">
        <div>
          <span className="stat-banner-number">{totalReservas}</span>
          <span style={{ fontSize: '13px', color: '#646E65', marginLeft: '6px', fontWeight: 500 }}>
            reservas registradas
          </span>
        </div>
        <span className="trend-pill positive" style={{ fontSize: '12px', padding: '4px 10px' }}>
          <TrendingUp size={13} />
          {maxStage.name}: {maxStage.count} máx
        </span>
      </div>

      {/* Leyenda de colores coincidente con los tonos */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', fontSize: '11.5px', color: '#646E65', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'flex', gap: '2px' }}>
            <span style={{ width: '8px', height: '10px', borderRadius: '2px', backgroundColor: '#60A5FA' }} title="Reserva temporal"></span>
            <span style={{ width: '8px', height: '10px', borderRadius: '2px', backgroundColor: '#3B82F6' }} title="Pagada"></span>
            <span style={{ width: '8px', height: '10px', borderRadius: '2px', backgroundColor: '#1D4ED8' }} title="Check-in"></span>
          </span>
          <span>Abiertas (3 tonos de azul)</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#10B981' }}></span>
          <span>Abordó (Verde)</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'flex', gap: '2px' }}>
            <span style={{ width: '8px', height: '10px', borderRadius: '2px', backgroundColor: '#F87171' }} title="Expirada"></span>
            <span style={{ width: '8px', height: '10px', borderRadius: '2px', backgroundColor: '#EF4444' }} title="Cancelada"></span>
            <span style={{ width: '8px', height: '10px', borderRadius: '2px', backgroundColor: '#DC2626' }} title="Pago rechazado"></span>
            <span style={{ width: '8px', height: '10px', borderRadius: '2px', backgroundColor: '#991B1B' }} title="No-show"></span>
          </span>
          <span>Perdidas (Tonos de rojo)</span>
        </span>
      </div>

      {/* Gráfico de Barras de Recharts */}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 15, right: 10, left: -20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF1E8" />
            <XAxis 
              dataKey="shortName" 
              tick={{ fill: '#646E65', fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: '#E8EAE2' }}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={45}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fill: '#8A9289', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217, 241, 117, 0.15)' }} />
            
            {/* Línea de referencia posicionada a la derecha para no superponerse con la primera barra */}
            <ReferenceLine 
              y={avgCount} 
              stroke="#A3ACB9" 
              strokeDasharray="4 4" 
              label={{ 
                value: `Promedio: ${avgCount}`, 
                position: 'insideTopRight', 
                fill: '#646E65', 
                fontSize: 11,
                fontWeight: 600,
                dy: -10
              }} 
            />

            <Bar 
              dataKey="count" 
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              {data.map((entry, index) => {
                // Color dinámico según la etapa
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    style={{
                      filter: entry.isHighlight ? 'drop-shadow(0 4px 6px rgba(255, 100, 66, 0.25))' : 'none',
                      transition: 'opacity 0.2s'
                    }}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

