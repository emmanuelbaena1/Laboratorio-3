import React from 'react';
import { 
  UserX, 
  Luggage, 
  Smartphone, 
  Monitor, 
  Building2, 
  MoreVertical,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { formatCOP, formatPercent } from '../utils/formatters';

export default function BoardingIndicators({ 
  kpis, 
  channelsData, 
  agentes = [] 
}) {
  return (
    <div className="white-card boarding-indicators-card">
      {/* Encabezado */}
      <div className="chart-card-header" style={{ marginBottom: '8px' }}>
        <div className="chart-title-group">
          <h3>Proceso de Check-in y Embarque</h3>
          <p>Métricas operativas de sala, equipaje y no-show</p>
        </div>
        <button className="icon-button" style={{ border: 'none' }} title="Opciones" type="button">
          <MoreVertical size={16} color="#8A9289" />
        </button>
      </div>

      {/* Caja 1: Tasa de No-show (Critical Airline Metric) */}
      <div 
        className="indicator-stat-box"
        style={{ 
          backgroundColor: '#FFF7F5', 
          borderColor: '#FEE5DE' 
        }}
      >
        <div className="indicator-left">
          <div 
            className="indicator-icon-badge" 
            style={{ backgroundColor: '#FFE4DE', color: '#EF4442' }}
          >
            <UserX size={20} />
          </div>
          <div>
            <div className="indicator-title">Tasa de No-Show en Puerta</div>
            <div className="indicator-value" style={{ color: '#DC2626' }}>
              {formatPercent(kpis.noShowRate)}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="trend-pill negative">
            <AlertTriangle size={11} />
            {kpis.noShowCount} pasajeros
          </span>
          <div style={{ fontSize: '11px', color: '#959E96', marginTop: '2px' }}>
            No se presentaron
          </div>
        </div>
      </div>

      {/* Caja 2: Recaudo por Exceso de Equipaje */}
      <div 
        className="indicator-stat-box"
        style={{ 
          backgroundColor: '#F7FDF9', 
          borderColor: '#DDF5E6' 
        }}
      >
        <div className="indicator-left">
          <div 
            className="indicator-icon-badge" 
            style={{ backgroundColor: '#D1FAE5', color: '#059669' }}
          >
            <Luggage size={20} />
          </div>
          <div>
            <div className="indicator-title">Recaudo por Exceso de Equipaje</div>
            <div className="indicator-value" style={{ color: '#047857' }}>
              {formatCOP(kpis.excessBaggageRevenue)}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="trend-pill positive">
            <CheckCircle2 size={11} />
            {kpis.luggageCount} con maleta
          </span>
          <div style={{ fontSize: '11px', color: '#959E96', marginTop: '2px' }}>
            Tarifas adicionales
          </div>
        </div>
      </div>

      {/* Sección 3: Canales de Check-in */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#191E1A' }}>
            Reservas por Canal de Check-in
          </span>
          <span style={{ fontSize: '11px', color: '#646E65', fontWeight: 600 }}>
            {channelsData.total} realizados
          </span>
        </div>

        <div className="channels-progress-list">
          {channelsData.items.map(channel => {
            let Icon = Smartphone;
            if (channel.name.includes('Kiosco')) Icon = Monitor;
            if (channel.name.includes('Mostrador')) Icon = Building2;

            return (
              <div key={channel.name} className="channel-progress-item">
                <div className="channel-label-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon size={14} color={channel.color} />
                    {channel.name}
                  </span>
                  <span>
                    <strong>{channel.count}</strong> ({formatPercent(channel.percent)})
                  </span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${channel.percent}%`, 
                      backgroundColor: channel.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini lista de Agentes de turno */}
      <div style={{ borderTop: '1px solid #F0F2EA', paddingTop: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#191E1A', marginBottom: '8px' }}>
          Agentes en Servicio
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {agentes.map(agent => (
            <div 
              key={agent.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                backgroundColor: '#F8FAF3',
                borderRadius: '9999px',
                border: '1px solid #E8EBE0',
                fontSize: '11.5px'
              }}
              title={`Meta mensual: ${agent.monthly_target} pasajeros`}
            >
              <img 
                src={agent.avatar_url} 
                alt={agent.full_name} 
                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
              />
              <span style={{ fontWeight: 600, color: '#191E1A' }}>{agent.full_name.split(' ')[0]}</span>
              <span style={{ color: '#8A9289', fontSize: '10px' }}>{agent.role === 'agente_puerta' ? 'Puerta' : 'Check-in'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

