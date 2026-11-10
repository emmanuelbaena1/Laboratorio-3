import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { formatCOP, formatPercent } from '../utils/formatters';

// Mapa de etiquetas para mostrar los estados en español
const STATUS_LABELS = {
  open: 'Abiertas',
  won: 'Abordaron',
  lost: 'Perdidas'
};

export default function KpiRow({ kpis }) {
  const isRevenuePositive = kpis.revenueChangeMonth >= 0;

  return (
    <div className="white-card kpi-row-card">
      {/* Encabezado del Card de KPIs (Fiel a "Performance Over Time") */}
      <div className="kpi-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 className="kpi-title">Rendimiento Operativo General</h2>
          <span className="kpi-date-badge">Noviembre 2026 · Tiempo Real</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#646E65', fontWeight: 500 }}>
            Moneda: <strong>COP ($)</strong>
          </span>
        </div>
      </div>

      {/* Cuadrícula de 4 KPIs con divisores suaves */}
      <div className="kpi-grid">
        {/* KPI 1: Ingresos Totales */}
        <div className="kpi-cell">
          <div className="kpi-label">
            <DollarSign size={15} color="#FF6442" />
            <span>Ingresos Totales (Emitidos)</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{formatCOP(kpis.totalRevenue)}</span>
            <span className={`trend-pill ${isRevenuePositive ? 'positive' : 'negative'}`}>
              {isRevenuePositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(kpis.revenueChangeMonth).toFixed(1)}%
            </span>
          </div>
          <p className="kpi-subtext">
            {kpis.paidCount} tiquetes pagados y emitidos
          </p>
        </div>

        {/* KPI 2: Reservas Activas */}
        <div className="kpi-cell">
          <div className="kpi-label">
            <Clock size={15} color="#3B82F6" />
            <span>Reservas Activas (En Proceso)</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{kpis.activeReservations}</span>
            <span className="trend-pill neutral">
              Estado: {STATUS_LABELS['open']}
            </span>
          </div>
          <p className="kpi-subtext">
            Temporales, pagadas y con check-in
          </p>
        </div>

        {/* KPI 3: Tasa de Abordaje */}
        <div className="kpi-cell">
          <div className="kpi-label">
            <CheckCircle2 size={15} color="#10B981" />
            <span>Tasa de Abordaje</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{formatPercent(kpis.boardingRate)}</span>
            <span className={`trend-pill ${kpis.boardingRate >= 70 ? 'positive' : 'negative'}`}>
              <ArrowUpRight size={13} />
              {kpis.wonCount} {STATUS_LABELS['won'].toLowerCase()} / {kpis.closedCount} cerradas
            </span>
          </div>
          <p className="kpi-subtext">
            Abordaron sobre total de cerradas (abordó + perdidas)
          </p>
        </div>

        {/* KPI 4: Tiquete Promedio */}
        <div className="kpi-cell">
          <div className="kpi-label">
            <TrendingUp size={15} color="#8B5CF6" />
            <span>Tiquete Promedio</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{formatCOP(kpis.avgTicket)}</span>
            <span className="trend-pill positive">
              Promedio neto
            </span>
          </div>
          <p className="kpi-subtext">
            Por pasajero con pago confirmado
          </p>
        </div>
      </div>
    </div>
  );
}

