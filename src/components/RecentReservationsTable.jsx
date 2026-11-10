import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Luggage,
  X,
  UserCheck
} from 'lucide-react';
import { formatCOP, formatDate } from '../utils/formatters';

// Mapa de etiquetas en español para categorías de estado
const STATUS_CATEGORY_LABELS = {
  open: 'abierta',
  won: 'ganada',
  lost: 'perdida'
};

export default function RecentReservationsTable({ 
  reservas, 
  etapas, 
  clientes, 
  onUpdateReservationStage 
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'open', 'won', 'lost'
  const [tableSearch, setTableSearch] = useState('');
  const [aviso, setAviso] = useState(null);

  // Estado para la ventana modal sencilla de Check-in
  const [checkinReserva, setCheckinReserva] = useState(null);
  const [checkinForm, setCheckinForm] = useState({
    checkin_channel: 'web_app',
    seat: '',
    has_luggage: false,
    luggage_weight_kg: '',
    excess_fee_amount: 0
  });

  // Limpiar aviso automáticamente después de 4 segundos
  useEffect(() => {
    if (aviso) {
      const timer = setTimeout(() => {
        setAviso(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [aviso]);

  // Mapear clientes por ID para búsqueda rápida
  const clientsMap = new Map(clientes.map(c => [c.id, c]));
  const stagesMap = new Map(etapas.map(s => [s.id, s]));

  // Filtrado de reservas
  const filtered = reservas.filter(r => {
    if (filterTab !== 'all' && r.status !== filterTab) return false;
    
    if (tableSearch.trim() !== '') {
      const q = tableSearch.toLowerCase();
      const passenger = clientsMap.get(r.passenger_id);
      const passName = passenger ? passenger.full_name.toLowerCase() : '';
      const flight = r.flight_code ? r.flight_code.toLowerCase() : '';
      const title = r.title ? r.title.toLowerCase() : '';
      return passName.includes(q) || flight.includes(q) || title.includes(q);
    }
    return true;
  });

  // Manejo de cambio de estado con las reglas estrictas de negocio
  const handleStageChange = (reserva, newStageId) => {
    if (newStageId === reserva.stage_id) return;

    // Regla 1: "Check-in" (s3)
    // Solo si la reserva tiene paid_at; si no, muestra el aviso "La reserva debe estar pagada".
    if (newStageId === 's3') {
      if (!reserva.paid_at) {
        setAviso('La reserva debe estar pagada');
        return;
      }
      // Al elegirlo, abre una ventana sencilla que pida canal, asiento, equipaje y cobro por exceso
      setCheckinReserva(reserva);
      setCheckinForm({
        checkin_channel: reserva.checkin_channel || 'web_app',
        seat: reserva.seat || '',
        has_luggage: Boolean(reserva.has_luggage),
        luggage_weight_kg: reserva.luggage_weight_kg || '',
        excess_fee_amount: reserva.excess_fee_amount ?? 0
      });
      return;
    }

    // Regla 2: "Abordó" (s4)
    // Solo si ya tiene checkin_channel; si no, muestra el aviso "Primero debe hacer check-in".
    if (newStageId === 's4') {
      if (!reserva.checkin_channel) {
        setAviso('Primero debe hacer check-in');
        return;
      }
      onUpdateReservationStage(reserva.id, 's4');
      return;
    }

    // Regla 3: "Pagada" (s2)
    // Pone paid_at = ahora si no lo tenía.
    if (newStageId === 's2') {
      onUpdateReservationStage(reserva.id, 's2');
      return;
    }

    // Regla 4: "Expirada" (s5), "Cancelada" (s6), "Pago rechazado" (s7), "No-show" (s8) o "Reserva temporal" (s1)
    onUpdateReservationStage(reserva.id, newStageId);
  };

  // Guardar datos del modal de check-in
  const handleConfirmCheckin = (e) => {
    e.preventDefault();
    if (!checkinReserva) return;

    const seatVal = checkinForm.seat.trim() ? checkinForm.seat.trim().toUpperCase() : null;
    const hasLuggage = Boolean(checkinForm.has_luggage);
    const luggageWeight = hasLuggage && checkinForm.luggage_weight_kg !== '' 
      ? Number(checkinForm.luggage_weight_kg) 
      : null;
    const excessFee = Number(checkinForm.excess_fee_amount) || 0;

    onUpdateReservationStage(checkinReserva.id, 's3', {
      checkin_channel: checkinForm.checkin_channel,
      seat: seatVal,
      has_luggage: hasLuggage,
      luggage_weight_kg: luggageWeight,
      excess_fee_amount: excessFee
    });

    setCheckinReserva(null);
  };

  return (
    <div className="white-card">
      {/* Aviso de validación cuando no se cumple una regla de transición */}
      {aviso && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991B1B',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={17} color="#DC2626" />
            <span>{aviso}</span>
          </div>
          <button 
            onClick={() => setAviso(null)}
            style={{ background: 'transparent', border: 'none', color: '#991B1B', cursor: 'pointer', padding: '2px' }}
            type="button"
            title="Cerrar aviso"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Controles superiores de la tabla */}
      <div className="table-header-controls">
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#191E1A' }}>
            Reservas y Operaciones Recientes
          </h3>
          <p style={{ fontSize: '12.5px', color: '#646E65', marginTop: '2px' }}>
            Listado dinámico con modificador de estado en tiempo real para verificar reactividad
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Tabs de estado */}
          <div className="table-filter-tabs">
            <button 
              className={`tab-btn ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
              type="button"
            >
              Todas ({reservas.length})
            </button>
            <button 
              className={`tab-btn ${filterTab === 'open' ? 'active' : ''}`}
              onClick={() => setFilterTab('open')}
              type="button"
            >
              Activas ({reservas.filter(r => r.status === 'open').length})
            </button>
            <button 
              className={`tab-btn ${filterTab === 'won' ? 'active' : ''}`}
              onClick={() => setFilterTab('won')}
              type="button"
            >
              Abordó ({reservas.filter(r => r.status === 'won').length})
            </button>
            <button 
              className={`tab-btn ${filterTab === 'lost' ? 'active' : ''}`}
              onClick={() => setFilterTab('lost')}
              type="button"
            >
              Perdidas ({reservas.filter(r => r.status === 'lost').length})
            </button>
          </div>

          {/* Campo de búsqueda en tabla */}
          <input 
            type="text"
            className="table-search"
            placeholder="Filtrar pasajero o vuelo..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla con scroll horizontal responsivo */}
      <div className="reservations-table-container">
        <table className="reservations-table">
          <thead>
            <tr>
              <th>Vuelo / Ruta</th>
              <th>Pasajero</th>
              <th>Asiento & Equipaje</th>
              <th>Canal Check-in</th>
              <th>Monto (COP)</th>
              <th>Fecha Creación</th>
              <th>Estado Actual</th>
              <th>Cambiar Estado (Test Reactivo)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#646E65', fontSize: '14px', fontWeight: 500 }}>
                  No hay reservas con estos filtros
                </td>
              </tr>
            ) : (
              filtered.slice(0, 15).map(reserva => {
                const passenger = clientsMap.get(reserva.passenger_id) || { full_name: 'Pasajero Anónimo', email: '' };
                const stage = stagesMap.get(reserva.stage_id) || { name: 'Desconocido', status_category: 'open' };

                return (
                  <tr key={reserva.id}>
                  {/* Vuelo y Ruta */}
                  <td>
                    <div style={{ fontWeight: 700, color: '#191E1A' }}>{reserva.title}</div>
                    <div style={{ fontSize: '11px', color: '#8A9289' }}>
                      Código: <strong>{reserva.flight_code}</strong> · {reserva.origin} → {reserva.destination}
                    </div>
                  </td>

                  {/* Pasajero */}
                  <td>
                    <div style={{ fontWeight: 600, color: '#191E1A' }}>{passenger.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#8A9289' }}>{passenger.email}</div>
                  </td>

                  {/* Asiento y Equipaje */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ 
                        fontWeight: 600, 
                        fontSize: '11.5px',
                        backgroundColor: reserva.seat ? '#F0F3E8' : 'transparent',
                        padding: reserva.seat ? '2px 6px' : '0',
                        borderRadius: '4px'
                      }}>
                        {reserva.seat ? `Asiento ${reserva.seat}` : 'Sin asiento'}
                      </span>
                    </div>
                    {reserva.has_luggage ? (
                      <div style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Luggage size={11} />
                        {reserva.luggage_weight_kg ? `${reserva.luggage_weight_kg} kg` : 'Doc. equipaje'}
                        {reserva.excess_fee_amount > 0 && ` (+${formatCOP(reserva.excess_fee_amount)})`}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#959E96', marginTop: '2px' }}>Solo mano</div>
                    )}
                  </td>

                  {/* Canal de Check-in: muestra el canal si ya hizo check-in; si no, "Pendiente" */}
                  <td>
                    <span style={{ 
                      fontSize: '11.5px', 
                      color: reserva.checkin_channel ? '#191E1A' : '#959E96',
                      fontWeight: reserva.checkin_channel ? 600 : 400
                    }}>
                      {reserva.checkin_channel === 'web_app' ? 'Web / App Móvil' :
                       reserva.checkin_channel === 'kiosco' ? 'Kiosco' :
                       reserva.checkin_channel === 'mostrador' ? 'Mostrador' : 'Pendiente'}
                    </span>
                  </td>

                  {/* Monto en COP */}
                  <td>
                    <div style={{ fontWeight: 700, color: '#191E1A' }}>
                      {formatCOP(reserva.amount)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: reserva.paid_at ? '#059669' : '#D97706' }}>
                      {reserva.paid_at ? 'Pagado (Emitido)' : 'Pendiente pago'}
                    </div>
                  </td>

                  {/* Fecha */}
                  <td style={{ color: '#646E65', fontSize: '12px' }}>
                    {formatDate(reserva.created_at)}
                  </td>

                  {/* Badge de Estado Actual */}
                  <td>
                    <span className={`status-badge ${reserva.status}`}>
                      {reserva.status === 'won' && <CheckCircle2 size={12} />}
                      {reserva.status === 'open' && <Clock size={12} />}
                      {reserva.status === 'lost' && <XCircle size={12} />}
                      {stage.name}
                    </span>
                  </td>

                  {/* Selector Interactivo de Cambio de Estado en Vivo */}
                  <td>
                    <select
                      className="stage-quick-select"
                      value={reserva.stage_id}
                      onChange={(e) => handleStageChange(reserva, e.target.value)}
                      title="Cambia el estado siguiendo las reglas operativas de la aerolínea"
                    >
                      {etapas.map(et => (
                        <option key={et.id} value={et.id}>
                          {et.display_order}. {et.name} ({STATUS_CATEGORY_LABELS[et.status_category] || et.status_category})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>

      {filtered.length > 15 && (
        <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '12px', color: '#646E65' }}>
          Mostrando 15 de {filtered.length} reservas registradas. Utiliza el buscador o las pestañas para explorar más registros.
        </div>
      )}

      {/* Ventana Sencilla de Check-in */}
      {checkinReserva && (
        <div className="modal-overlay" onClick={() => setCheckinReserva(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Realizar Check-in</h3>
                <p style={{ fontSize: '12px', color: '#646E65', marginTop: '2px' }}>
                  {checkinReserva.title}
                </p>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setCheckinReserva(null)} 
                type="button" 
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckin}>
              {/* Canal de Check-in */}
              <div className="form-group">
                <label className="form-label">
                  Canal de Check-in <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select 
                  className="form-select"
                  value={checkinForm.checkin_channel}
                  onChange={e => setCheckinForm({ ...checkinForm, checkin_channel: e.target.value })}
                  required
                >
                  <option value="web_app">Web / App Móvil</option>
                  <option value="kiosco">Kiosco</option>
                  <option value="mostrador">Mostrador</option>
                </select>
              </div>

              {/* Asiento (Opcional, ej. 14C) */}
              <div className="form-group">
                <label className="form-label">
                  Asiento <span style={{ color: '#8A9289', fontWeight: 400 }}>(Opcional, ej. 14C)</span>
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej. 14C"
                  value={checkinForm.seat}
                  onChange={e => setCheckinForm({ ...checkinForm, seat: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              {/* Equipaje en bodega y peso en kg */}
              <div style={{ marginBottom: '14px', borderTop: '1px solid #EEF0E8', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="checkbox"
                    checked={checkinForm.has_luggage}
                    onChange={e => setCheckinForm({ ...checkinForm, has_luggage: e.target.checked })}
                  />
                  ¿Lleva equipaje en bodega?
                </label>

                {checkinForm.has_luggage && (
                  <div style={{ marginTop: '10px' }} className="form-group">
                    <label className="form-label">
                      Peso del equipaje (kg) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input 
                      type="number" 
                      className="form-input"
                      placeholder="Ej. 23"
                      min="0.5"
                      step="0.5"
                      required={checkinForm.has_luggage}
                      value={checkinForm.luggage_weight_kg}
                      onChange={e => setCheckinForm({ ...checkinForm, luggage_weight_kg: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Cobro por exceso de equipaje (0 por defecto) */}
              <div className="form-group">
                <label className="form-label">
                  Cobro por exceso de equipaje (COP)
                </label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="0"
                  min="0"
                  step="1000"
                  value={checkinForm.excess_fee_amount}
                  onChange={e => setCheckinForm({ ...checkinForm, excess_fee_amount: e.target.value })}
                />
                <span style={{ fontSize: '11px', color: '#8A9289', marginTop: '3px', display: 'block' }}>
                  0 por defecto si no supera la franquicia
                </span>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setCheckinReserva(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  Guardar Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
