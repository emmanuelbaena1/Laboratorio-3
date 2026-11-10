import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiRow from './components/KpiRow';
import ProcessBarChart from './components/ProcessBarChart';
import RevenueLineChart from './components/RevenueLineChart';
import BoardingIndicators from './components/BoardingIndicators';
import RecentReservationsTable from './components/RecentReservationsTable';
import NewReservationModal from './components/NewReservationModal';
import AiChatWidget from './components/AiChatWidget';

import { 
  USUARIOS, 
  ETAPAS, 
  CLIENTES, 
  RESERVAS as INITIAL_RESERVAS 
} from './data/mockData';

import { 
  calculateKPIs, 
  getProcessBarChartData, 
  getRevenueEvolutionData, 
  getCheckinChannelsData 
} from './utils/analytics';

import { formatCOP } from './utils/formatters';
import { CheckCircle2, X, RotateCcw, CalendarDays } from 'lucide-react';

const STORAGE_KEY_RESERVAS = 'aeropulse_reservas';
const STORAGE_KEY_CLIENTES = 'aeropulse_clientes';

// Helpers para identificar Medellín y Bogotá (códigos o nombres de ciudades)
const isMDE = (val) => {
  if (!val) return false;
  const s = String(val).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s === 'mde' || s === 'medellin';
};

const isBOG = (val) => {
  if (!val) return false;
  const s = String(val).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s === 'bog' || s === 'bogota';
};

// Verifica si la reserva corresponde a la ruta MDE ⇄ BOG en ambos sentidos
const isRouteMdeBog = (r) => {
  if ((isMDE(r.origin) && isBOG(r.destination)) || (isBOG(r.origin) && isMDE(r.destination))) {
    return true;
  }
  if (r.title) {
    const t = String(r.title).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const hasMde = t.includes('mde') || t.includes('medellin');
    const hasBog = t.includes('bog') || t.includes('bogota');
    if (hasMde && hasBog) return true;
  }
  return false;
};

// Verifica si la fecha de salida (departure_at) corresponde a hoy
const isFlightToday = (departureAt) => {
  if (!departureAt) return false;
  const depDate = new Date(departureAt);
  if (isNaN(depDate.getTime())) return false;
  const now = new Date();
  return (
    depDate.getFullYear() === now.getFullYear() &&
    depDate.getMonth() === now.getMonth() &&
    depDate.getDate() === now.getDate()
  );
};

export default function App() {
  // Estado principal de reservas con persistencia en localStorage (mockData.js solo primera vez)
  const [reservas, setReservas] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESERVAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error al leer reservas de localStorage:', error);
    }
    return INITIAL_RESERVAS;
  });

  // Estado principal de pasajeros con persistencia en localStorage
  const [clientes, setClientes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error al leer clientes de localStorage:', error);
    }
    return CLIENTES;
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [filterScope, setFilterScope] = useState('all'); // 'all', 'route_mde_bog', 'today'
  const [dateRange, setDateRange] = useState('all');     // 'all', '7d', '30d', '3m'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const currentUser = USUARIOS[0]; // Laura Restrepo

  // Guardar en localStorage cada vez que cambien las reservas (envuelto en try/catch)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(reservas));
    } catch (error) {
      console.error('Error al guardar reservas en localStorage:', error);
    }
  }, [reservas]);

  // Guardar en localStorage cada vez que cambien los pasajeros (envuelto en try/catch)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    } catch (error) {
      console.error('Error al guardar clientes en localStorage:', error);
    }
  }, [clientes]);

  // Cierre automático de la notificación de confirmación después de 4 segundos
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Filtrado reactivo: rango de fechas + alcance (ruta/vuelos hoy) + buscador
  const filteredReservas = useMemo(() => {
    let result = reservas;

    // 1. Filtro por rango de fechas (created_at)
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoff;
      if (dateRange === '7d') {
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '3m') {
        cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      if (cutoff) {
        result = result.filter(r => {
          if (!r.created_at) return false;
          return new Date(r.created_at) >= cutoff;
        });
      }
    }

    // 2. Filtro por alcance seleccionado (ruta MDE⇄BOG, vuelos hoy)
    if (filterScope === 'route_mde_bog') {
      result = result.filter(isRouteMdeBog);
    } else if (filterScope === 'today') {
      result = result.filter(r => isFlightToday(r.departure_at));
    }

    // 3. Filtro por barra de búsqueda superior (Código de vuelo, origen, destino, pasajero)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const clientMap = new Map(clientes.map(c => [c.id, c.full_name.toLowerCase()]));

      result = result.filter(r => {
        const passengerName = clientMap.get(r.passenger_id) || '';
        return (
          r.flight_code?.toLowerCase().includes(q) ||
          r.origin?.toLowerCase().includes(q) ||
          r.destination?.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          passengerName.includes(q)
        );
      });
    }

    return result;
  }, [reservas, filterScope, dateRange, searchQuery, clientes]);

  // CÁLCULOS DINÁMICOS DE KPIs Y GRÁFICAS (No estáticos, 100% reactivos)
  const kpis = useMemo(() => calculateKPIs(filteredReservas), [filteredReservas]);
  const barChartData = useMemo(() => getProcessBarChartData(filteredReservas, ETAPAS), [filteredReservas]);
  const revenueEvolutionData = useMemo(() => getRevenueEvolutionData(filteredReservas), [filteredReservas]);
  const channelsData = useMemo(() => getCheckinChannelsData(filteredReservas), [filteredReservas]);

  // Indica si hay algún filtro activo (para mostrar el botón "Limpiar filtros")
  const hasActiveFilter = filterScope !== 'all' || dateRange !== 'all' || searchQuery.trim() !== '';

  // Limpia todos los filtros de una vez
  const handleClearFilters = () => {
    setFilterScope('all');
    setDateRange('all');
    setSearchQuery('');
  };

  // Contexto resumido del dashboard que se envía al agente de IA en cada mensaje
  const dashboardContext = useMemo(() => {
    const DATE_LABELS = { all: 'Todo', '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', '3m': 'Últimos 3 meses' };
    const SCOPE_LABELS = { all: 'Todo el sistema', route_mde_bog: 'Ruta MDE ⇄ BOG', today: 'Vuelos Hoy' };

    // Conteo por etapa
    const byStage = ETAPAS.map(et => {
      const count = filteredReservas.filter(r => r.stage_id === et.id).length;
      return `${et.name}: ${count}`;
    }).join(', ');

    return [
      `=== Contexto del Dashboard AeroPulse ===`,
      `Filtros activos: Ruta="${SCOPE_LABELS[filterScope]}", Fecha="${DATE_LABELS[dateRange]}"`,
      `Total de reservas visibles: ${filteredReservas.length}`,
      `Ingresos totales: ${kpis.totalRevenue !== undefined ? `$${kpis.totalRevenue.toLocaleString('es-CO')} COP` : 'N/D'}`,
      `Reservas activas (open): ${kpis.activeReservations ?? 'N/D'}`,
      `Tasa de abordaje: ${kpis.boardingRate !== undefined ? `${kpis.boardingRate.toFixed(1)}%` : 'N/D'}`,
      `Tiquete promedio: ${kpis.avgTicket !== undefined ? `$${kpis.avgTicket.toLocaleString('es-CO')} COP` : 'N/D'}`,
      `Reservas por estado: ${byStage}`,
    ].join('\n');
  }, [filteredReservas, kpis, filterScope, dateRange]);

  // Reservas para la vista Check-in & Embarque (pagadas o con check-in)
  const boardingReservas = useMemo(() => {
    return filteredReservas.filter(r => 
      Boolean(r.paid_at) || 
      r.stage_id === 's2' || 
      r.stage_id === 's3' || 
      r.stage_id === 's4' || 
      Boolean(r.checkin_channel)
    );
  }, [filteredReservas]);

  // Estadísticas consolidadas para la vista de Agentes de Puerta
  const agentsStats = useMemo(() => {
    return USUARIOS.map(agent => {
      const attendedCount = reservas.filter(r => r.agent_id === agent.id).length;
      const roleLabel = agent.role === 'agente_puerta' 
        ? 'Agente de Puerta' 
        : agent.role === 'agente_checkin' 
        ? 'Agente de Check-in' 
        : 'Administrador Operativo';
      return {
        ...agent,
        attendedCount,
        roleLabel
      };
    });
  }, [reservas]);

  // Consolidado para la vista de Vuelos y Rutas (agrupado por vuelo y ruta)
  const flightsGrouped = useMemo(() => {
    const map = new Map();
    filteredReservas.forEach(r => {
      const key = r.flight_code || `${r.origin}-${r.destination}`;
      if (!map.has(key)) {
        map.set(key, {
          flight_code: r.flight_code || 'N/A',
          route: `${r.origin} → ${r.destination}`,
          reservasCount: 0,
          revenue: 0,
          paidCount: 0
        });
      }
      const item = map.get(key);
      item.reservasCount += 1;
      if (r.paid_at) {
        item.revenue += Number(r.amount) || 0;
        item.paidCount += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.reservasCount - a.reservasCount);
  }, [filteredReservas]);

  // Manejador para actualizar en tiempo real el estado de una reserva según reglas de negocio
  const handleUpdateReservationStage = (reservationId, newStageId, extraData = null) => {
    const stageObj = ETAPAS.find(s => s.id === newStageId);
    if (!stageObj) return;

    setReservas(prevList => {
      return prevList.map(item => {
        if (item.id !== reservationId) return item;

        const statusCategory = stageObj.status_category; // 'open', 'won', 'lost'
        const nowIso = new Date().toISOString();

        let updatedPaidAt = item.paid_at;
        let updatedClosedAt = item.closed_at;
        let lossReason = null;
        let checkinChannel = item.checkin_channel;
        let seat = item.seat;
        let hasLuggage = item.has_luggage;
        let luggageWeight = item.luggage_weight_kg;
        let excessFee = item.excess_fee_amount;

        // Regla "Pagada": pone paid_at = ahora si no lo tenía
        if (newStageId === 's2') {
          if (!updatedPaidAt) updatedPaidAt = nowIso;
          updatedClosedAt = null;
        } 
        // Regla "Check-in": guarda datos de check-in y el stage pasa a "Check-in"
        else if (newStageId === 's3') {
          updatedClosedAt = null;
          if (extraData) {
            checkinChannel = extraData.checkin_channel;
            seat = extraData.seat !== undefined ? extraData.seat : seat;
            hasLuggage = extraData.has_luggage !== undefined ? extraData.has_luggage : hasLuggage;
            luggageWeight = extraData.luggage_weight_kg !== undefined ? extraData.luggage_weight_kg : luggageWeight;
            excessFee = extraData.excess_fee_amount !== undefined ? extraData.excess_fee_amount : excessFee;
          }
        } 
        // Regla "Abordó": status "won" y closed_at = ahora
        else if (newStageId === 's4') {
          updatedClosedAt = nowIso;
        } 
        // Regla "Expirada", "Cancelada", "Pago rechazado" o "No-show": status "lost", closed_at = ahora y loss_reason
        else if (statusCategory === 'lost') {
          updatedClosedAt = nowIso;
          lossReason = newStageId === 's8' ? 'no-show' :
                       newStageId === 's7' ? 'pago rechazado' :
                       newStageId === 's6' ? 'compra no confirmada' : 'plazo vencido';
        } 
        // "Reserva temporal" (s1)
        else {
          updatedClosedAt = null;
        }

        return {
          ...item,
          stage_id: newStageId,
          status: statusCategory,
          paid_at: updatedPaidAt,
          closed_at: updatedClosedAt,
          loss_reason: lossReason,
          checkin_channel: checkinChannel,
          seat: seat,
          has_luggage: hasLuggage,
          luggage_weight_kg: luggageWeight,
          excess_fee_amount: excessFee
        };
      });
    });
  };

  // Manejador para agregar una nueva reserva (y nuevo pasajero si corresponde)
  const handleAddReservation = (newReserva, newPassenger = null) => {
    if (newPassenger) {
      setClientes(prev => [...prev, newPassenger]);
    }
    setReservas(prev => [newReserva, ...prev]);

    // Mensaje de confirmación visible
    setNotification({
      type: 'success',
      title: '¡Reserva Creada Exitosamente!',
      message: `Se registró la reserva temporal ${newReserva.title} (${formatCOP(newReserva.amount)}). Expira en 24 horas.`
    });
  };

  // Restablecer datos: borra lo guardado en localStorage y vuelve a cargar mockData.js
  const handleResetData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_RESERVAS);
      localStorage.removeItem(STORAGE_KEY_CLIENTES);
    } catch (error) {
      console.error('Error al borrar datos de localStorage:', error);
    }
    setReservas(INITIAL_RESERVAS);
    setClientes(CLIENTES);
    setFilterScope('all');
    setDateRange('all');
    setSearchQuery('');
    setActiveTab('overview');
    setNotification({
      type: 'info',
      title: 'Datos restablecidos',
      message: 'Se han eliminado los datos locales y recargado los valores originales de mockData.js.'
    });
  };

  // ── Barra de filtros reutilizable (scope + fecha + limpiar) ───────────────
  const DATE_OPTIONS = [
    { value: 'all',  label: 'Todo' },
    { value: '7d',   label: 'Últimos 7 días' },
    { value: '30d',  label: 'Últimos 30 días' },
    { value: '3m',   label: 'Últimos 3 meses' },
  ];

  const FilterBar = ({ showReset = false }) => (
    <div className="filter-pills" style={{ flexWrap: 'wrap', gap: '8px' }}>
      {/* Grupo: alcance de ruta */}
      <button
        className={`filter-pill ${filterScope === 'all' ? 'active' : ''}`}
        onClick={() => setFilterScope('all')}
        type="button"
      >
        Todo el Sistema
      </button>
      <button
        className={`filter-pill ${filterScope === 'route_mde_bog' ? 'active' : ''}`}
        onClick={() => setFilterScope('route_mde_bog')}
        type="button"
      >
        Ruta MDE ⇄ BOG
      </button>
      <button
        className={`filter-pill ${filterScope === 'today' ? 'active' : ''}`}
        onClick={() => setFilterScope('today')}
        type="button"
      >
        Vuelos Hoy
      </button>

      {/* Separador visual */}
      <span style={{ width: '1px', background: '#E8EAE2', alignSelf: 'stretch', margin: '0 2px' }} />

      {/* Grupo: rango de fechas */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
                    border: '1.5px solid #E8EAE2', borderRadius: '999px',
                    padding: '2px 10px', background: '#FFFFFF', fontSize: '12.5px' }}>
        <CalendarDays size={13} color="#646E65" style={{ flexShrink: 0 }} />
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '12.5px', fontWeight: 600, color: dateRange !== 'all' ? '#143A32' : '#646E65',
            cursor: 'pointer', paddingRight: '2px'
          }}
        >
          {DATE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Limpiar filtros — solo visible cuando hay un filtro activo */}
      {hasActiveFilter && (
        <button
          className="filter-pill"
          onClick={handleClearFilters}
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px',
                   color: '#1D4ED8', borderColor: '#BFDBFE' }}
          title="Quitar todos los filtros activos"
        >
          <X size={12} />
          Limpiar filtros
        </button>
      )}

      {/* Restablecer datos — solo en vista Visión General */}
      {showReset && (
        <button
          className="filter-pill"
          onClick={handleResetData}
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px',
                   color: '#DC2626', borderColor: '#FCA5A5' }}
          title="Borrar datos guardados en localStorage y volver a cargar mockData.js"
        >
          <RotateCcw size={12} />
          Restablecer datos
        </button>
      )}
    </div>
  );

  return (
    <div className="app-layout">
      {/* Notificación flotante de confirmación */}
      {notification && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            backgroundColor: '#143A32',
            color: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000,
            maxWidth: '440px'
          }}
        >
          <div style={{ backgroundColor: '#10B981', borderRadius: '50%', padding: '4px', display: 'flex' }}>
            <CheckCircle2 size={16} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{notification.title}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{notification.message}</div>
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '2px' }}
            type="button"
            title="Cerrar"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Barra Lateral Izquierda (Fiel a la referencia de diseño) */}
      <Sidebar 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
        currentUser={currentUser} 
      />

      {/* Área Principal de Contenido */}
      <div className="main-wrapper">
        {/* Header Superior con Buscador y Acciones */}
        <Header 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNewReservation={() => setIsModalOpen(true)}
          onResetData={handleResetData}
          currentUser={currentUser}
        />

        {/* Dashboard Operacional — renderizado condicional según vista activa */}
        <main className="dashboard-container">

          {/* ══════════════════════════════════════════
              VISTA: Visión General (overview)
              ══════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              <div className="dashboard-heading">
                <div>
                  <h1 className="heading-title">Dashboard Operacional</h1>
                  <p className="heading-subtitle">
                    Gestión en tiempo real de los ciclos de <strong>Reserva y Pago (24h)</strong> y <strong>Check-in y Abordaje</strong>
                  </p>
                </div>
                <FilterBar showReset={true} />
              </div>

              <KpiRow kpis={kpis} />

              <div className="dashboard-main-grid">
                <ProcessBarChart
                  data={barChartData}
                  totalReservas={filteredReservas.length}
                />
                <BoardingIndicators
                  kpis={kpis}
                  channelsData={channelsData}
                  agentes={USUARIOS}
                />
              </div>

              <div className="dashboard-secondary-grid">
                <RevenueLineChart data={revenueEvolutionData} />
              </div>

              <RecentReservationsTable
                reservas={filteredReservas}
                etapas={ETAPAS}
                clientes={clientes}
                onUpdateReservationStage={handleUpdateReservationStage}
              />
            </>
          )}

          {/* ══════════════════════════════════════════
              VISTA: Reservas y Pagos (reservations)
              ══════════════════════════════════════════ */}
          {activeTab === 'reservations' && (
            <>
              <div className="dashboard-heading">
                <div>
                  <h1 className="heading-title">Reservas y Pagos</h1>
                  <p className="heading-subtitle">
                    Administra el ciclo completo de <strong>Reserva temporal → Pago → Emisión de tiquete</strong>
                  </p>
                </div>
                <FilterBar />
              </div>
              <RecentReservationsTable
                reservas={filteredReservas}
                etapas={ETAPAS}
                clientes={clientes}
                onUpdateReservationStage={handleUpdateReservationStage}
              />
            </>
          )}

          {/* ══════════════════════════════════════════
              VISTA: Check-in & Embarque (boarding)
              ══════════════════════════════════════════ */}
          {activeTab === 'boarding' && (
            <>
              <div className="dashboard-heading">
                <div>
                  <h1 className="heading-title">Check-in & Embarque</h1>
                  <p className="heading-subtitle">
                    Reservas con pago confirmado en proceso de <strong>check-in, asignación de asiento y abordaje</strong>
                  </p>
                </div>
              </div>
              <RecentReservationsTable
                reservas={boardingReservas}
                etapas={ETAPAS}
                clientes={clientes}
                onUpdateReservationStage={handleUpdateReservationStage}
              />
            </>
          )}

          {/* ══════════════════════════════════════════
              VISTA: Agentes de Puerta (agents)
              ══════════════════════════════════════════ */}
          {activeTab === 'agents' && (
            <>
              <div className="dashboard-heading">
                <div>
                  <h1 className="heading-title">Agentes de Puerta y Check-in</h1>
                  <p className="heading-subtitle">
                    Desempeño y carga operativa de cada agente en el período activo
                  </p>
                </div>
              </div>
              <div className="white-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="reservations-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Agente</th>
                      <th>Rol</th>
                      <th style={{ textAlign: 'center' }}>Reservas Atendidas</th>
                      <th style={{ textAlign: 'center' }}>Meta Mensual</th>
                      <th style={{ textAlign: 'center' }}>% Cumplimiento</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentsStats.map(agent => {
                      const pct = agent.monthly_target > 0
                        ? Math.round((agent.attendedCount / agent.monthly_target) * 100)
                        : 0;
                      return (
                        <tr key={agent.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={agent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.full_name)}&background=D9F175&color=172A15&size=36`}
                                alt={agent.full_name}
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.full_name)}&background=D9F175&color=172A15&size=36`; }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#191E1A' }}>{agent.full_name}</div>
                                <div style={{ fontSize: '11px', color: '#8A9289' }}>{agent.email || `${agent.id}@aeropulse.co`}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              backgroundColor: '#F0F3E8',
                              color: '#143A32',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              {agent.roleLabel}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '18px', color: '#191E1A' }}>
                            {agent.attendedCount}
                          </td>
                          <td style={{ textAlign: 'center', color: '#646E65', fontSize: '13px' }}>
                            {agent.monthly_target}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                              <div style={{
                                width: '80px',
                                height: '6px',
                                backgroundColor: '#EEF0E8',
                                borderRadius: '999px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  height: '100%',
                                  backgroundColor: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444',
                                  borderRadius: '999px',
                                  transition: 'width 0.4s ease'
                                }} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#191E1A', minWidth: '32px' }}>
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '999px',
                              backgroundColor: agent.status === 'active' ? '#EBFDF4' : '#FEF2F2',
                              color: agent.status === 'active' ? '#059669' : '#DC2626'
                            }}>
                              {agent.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════
              VISTA: Vuelos y Rutas (flights)
              ══════════════════════════════════════════ */}
          {activeTab === 'flights' && (
            <>
              <div className="dashboard-heading">
                <div>
                  <h1 className="heading-title">Vuelos y Rutas</h1>
                  <p className="heading-subtitle">
                    Resumen de reservas e ingresos agrupados por vuelo y ruta
                  </p>
                </div>
                <FilterBar />
              </div>
              <div className="white-card" style={{ padding: '0', overflow: 'hidden' }}>
                {flightsGrouped.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#646E65', fontSize: '14px', fontWeight: 500 }}>
                    No hay reservas con estos filtros
                  </div>
                ) : (
                  <table className="reservations-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Código de Vuelo</th>
                        <th>Ruta</th>
                        <th style={{ textAlign: 'center' }}>Total Reservas</th>
                        <th style={{ textAlign: 'center' }}>Tiquetes Emitidos</th>
                        <th style={{ textAlign: 'right' }}>Ingresos Totales</th>
                        <th style={{ textAlign: 'right' }}>Tiquete Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flightsGrouped.map((f, idx) => (
                        <tr key={`${f.flight_code}-${idx}`}>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '13px',
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              {f.flight_code}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#191E1A' }}>{f.route}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '16px', color: '#191E1A' }}>
                            {f.reservasCount}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontWeight: 600,
                              fontSize: '13px',
                              color: f.paidCount > 0 ? '#059669' : '#959E96'
                            }}>
                              {f.paidCount}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#FF6442', fontSize: '13.5px' }}>
                            {formatCOP(f.revenue)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#646E65', fontSize: '13px' }}>
                            {f.paidCount > 0 ? formatCOP(Math.round(f.revenue / f.paidCount)) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════
              VISTA: Configuración (settings)
              ══════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <>
              <div className="dashboard-heading">
                <div>
                  <h1 className="heading-title">Configuración</h1>
                  <p className="heading-subtitle">Opciones del sistema y datos de la aplicación</p>
                </div>
              </div>
              <div className="white-card" style={{ maxWidth: '520px', padding: '32px 36px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#191E1A', marginBottom: '8px' }}>
                    Restablecer datos de demostración
                  </h3>
                  <p style={{ fontSize: '13px', color: '#646E65', lineHeight: 1.6 }}>
                    Borra las reservas y pasajeros guardados en el navegador y restaura los valores
                    originales de <code style={{ backgroundColor: '#F0F3E8', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>mockData.js</code>.
                    Útil para limpiar pruebas o reiniciar el flujo desde cero.
                  </p>
                </div>
                <button
                  className="filter-pill"
                  onClick={handleResetData}
                  type="button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    color: '#DC2626',
                    borderColor: '#FCA5A5',
                    padding: '10px 18px',
                    fontSize: '13.5px',
                    fontWeight: 700
                  }}
                >
                  <RotateCcw size={14} />
                  Restablecer datos
                </button>
              </div>
            </>
          )}

        </main>
      </div>

      {/* Modal para Crear Nueva Reserva */}
      <NewReservationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddReservation={handleAddReservation}
        etapas={ETAPAS}
        clientes={clientes}
      />

      {/* Chat flotante con agente de IA (n8n) */}
      <AiChatWidget dashboardContext={dashboardContext} />
    </div>
  );
}
