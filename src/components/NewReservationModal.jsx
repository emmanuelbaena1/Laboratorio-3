import React, { useState } from 'react';
import { X, Plane, Mail, User, Phone, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

// Mapa de etiquetas en español para los estados de reserva
const STATUS_LABELS = {
  open: 'Abierta',
  won: 'Abordó',
  lost: 'Perdida'
};

export default function NewReservationModal({ 
  isOpen, 
  onClose, 
  onAddReservation, 
  etapas, 
  clientes 
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    origin: '',
    destination: '',
    flight_code: '',
    seat: '',
    departure_at: '',
    amount: ''
  });

  const [errors, setErrors] = useState({});

  // Calcular la fecha y hora mínima (momento actual en formato local YYYY-MM-DDTHH:mm)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  // Detección en tiempo real de si el correo ya existe en el store
  const matchedClient = formData.email.trim()
    ? clientes.find(c => c.email && c.email.trim().toLowerCase() === formData.email.trim().toLowerCase())
    : null;

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Convertir código de vuelo y asiento a mayúsculas
    if (field === 'flight_code' || field === 'seat') {
      processedValue = value.toUpperCase().trimStart();
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validate = () => {
    const errs = {};

    // 1. Nombre del pasajero (obligatorio)
    if (!formData.name.trim()) {
      errs.name = 'El nombre del pasajero es obligatorio.';
    }

    // 2. Correo electrónico del pasajero (obligatorio y formato válido)
    const emailClean = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean) {
      errs.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(emailClean)) {
      errs.email = 'Ingresa un correo electrónico con formato válido (ej. pasajero@ejemplo.com).';
    }

    // 3. Origen (campo libre, obligatorio, sin espacios sobrantes)
    const originClean = formData.origin.trim();
    if (!originClean) {
      errs.origin = 'El origen es obligatorio.';
    }

    // 4. Destino (campo libre, obligatorio, distinto del origen sin distinguir mayúsculas)
    const destClean = formData.destination.trim();
    if (!destClean) {
      errs.destination = 'El destino es obligatorio.';
    } else if (originClean && destClean.toLowerCase() === originClean.toLowerCase()) {
      errs.destination = 'El destino debe ser diferente al aeropuerto de origen.';
    }

    // 5. Código de vuelo (obligatorio)
    if (!formData.flight_code.trim()) {
      errs.flight_code = 'El código de vuelo es obligatorio (ej. AV1234).';
    }

    // 6. Fecha y hora de salida (obligatoria y en el futuro)
    if (!formData.departure_at) {
      errs.departure_at = 'La fecha y hora de salida es obligatoria.';
    } else {
      const depDate = new Date(formData.departure_at);
      if (isNaN(depDate.getTime()) || depDate <= new Date()) {
        errs.departure_at = 'La fecha y hora de salida debe ser en el futuro.';
      }
    }

    // 7. Valor del tiquete (obligatorio y mayor que 0)
    if (formData.amount === '' || formData.amount === null || formData.amount === undefined) {
      errs.amount = 'El valor del tiquete en COP es obligatorio.';
    } else if (Number(formData.amount) <= 0 || isNaN(Number(formData.amount))) {
      errs.amount = 'El valor del tiquete debe ser mayor a 0 COP.';
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const nowIso = new Date().toISOString();
    const createdDate = new Date();
    const expiresDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000); // created_at + 24 horas

    // Reutilizar o crear pasajero según coincidencia de correo (sin distinguir mayúsculas)
    let passengerId;
    let newPassenger = null;

    if (matchedClient) {
      passengerId = matchedClient.id;
    } else {
      passengerId = `p-${Date.now()}`;
      newPassenger = {
        id: passengerId,
        full_name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        created_at: nowIso
      };
    }

    // Encontrar id de la etapa "Reserva temporal"
    const tempStage = etapas.find(
      s => s.id === 's1' || s.name.toLowerCase().includes('temporal')
    ) || etapas[0];

    const originClean = formData.origin.trim();
    const destClean = formData.destination.trim();
    const flightClean = formData.flight_code.trim().toUpperCase();
    const seatValue = formData.seat.trim() ? formData.seat.trim().toUpperCase() : null;

    // Crear la nueva reserva con stage "Reserva temporal", status "open" y title limpio
    const newReservation = {
      id: `r-${Date.now()}`,
      title: `${originClean} → ${destClean} · ${flightClean}`,
      passenger_id: passengerId,
      agent_id: null,
      stage_id: tempStage.id, // "s1" - Reserva temporal
      flight_code: flightClean,
      origin: originClean,
      destination: destClean,
      departure_at: new Date(formData.departure_at).toISOString(),
      amount: Number(formData.amount),
      currency: "COP",
      status: "open",
      created_at: nowIso,
      expires_at: expiresDate.toISOString(),
      paid_at: null,
      closed_at: null,
      checkin_channel: null,
      has_luggage: false,
      luggage_weight_kg: null,
      excess_fee_amount: 0,
      seat: seatValue,
      loss_reason: null
    };

    onAddReservation(newReservation, newPassenger);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Crear Nueva Reserva</h3>
            <p style={{ fontSize: '12px', color: '#646E65', marginTop: '2px' }}>
              Etapa inicial: <strong>Reserva temporal (24h)</strong> · Estado: <strong>{STATUS_LABELS['open']}</strong>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* SECCIÓN 1: DATOS DEL PASAJERO */}
          <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #EEF0E8' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#191E1A', marginBottom: '10px' }}>
              Datos del Pasajero
            </div>

            {/* Nombre Completo */}
            <div className="form-group">
              <label className="form-label">
                Nombre del Pasajero <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Ej. Andrés Camilo Morales"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                style={{ borderColor: errors.name ? '#DC2626' : undefined }}
              />
              {errors.name && (
                <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                  {errors.name}
                </span>
              )}
            </div>

            {/* Correo y Teléfono */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">
                  Correo Electrónico <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="email" 
                  className="form-input"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  style={{ borderColor: errors.email ? '#DC2626' : undefined }}
                />
                {errors.email && (
                  <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {errors.email}
                  </span>
                )}
                {matchedClient && !errors.email && (
                  <span style={{ color: '#059669', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <CheckCircle2 size={12} /> Pasajero existente: {matchedClient.full_name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Teléfono <span style={{ color: '#8A9289', fontWeight: 400 }}>(Opcional)</span>
                </label>
                <input 
                  type="tel" 
                  className="form-input"
                  placeholder="+57 300 123 4567"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: INFORMACIÓN DEL VUELO Y RUTA */}
          <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #EEF0E8' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#191E1A', marginBottom: '10px' }}>
              Información del Vuelo y Ruta
            </div>

            {/* Origen, Destino y Código de Vuelo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">
                  Origen <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej. Medellín"
                  value={formData.origin}
                  onChange={e => handleInputChange('origin', e.target.value)}
                  style={{ borderColor: errors.origin ? '#DC2626' : undefined }}
                />
                {errors.origin && (
                  <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {errors.origin}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Destino <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej. Bogotá"
                  value={formData.destination}
                  onChange={e => handleInputChange('destination', e.target.value)}
                  style={{ borderColor: errors.destination ? '#DC2626' : undefined }}
                />
                {errors.destination && (
                  <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {errors.destination}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Código Vuelo <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej. AV1234"
                  value={formData.flight_code}
                  onChange={e => handleInputChange('flight_code', e.target.value)}
                  style={{ textTransform: 'uppercase', borderColor: errors.flight_code ? '#DC2626' : undefined }}
                />
                {errors.flight_code && (
                  <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {errors.flight_code}
                  </span>
                )}
              </div>
            </div>

            {/* Fecha y Hora de Salida, Monto en COP y Asiento (Opcional) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">
                  Fecha y Hora de Salida <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="datetime-local" 
                  className="form-input"
                  min={minDateTime}
                  value={formData.departure_at}
                  onChange={e => handleInputChange('departure_at', e.target.value)}
                  style={{ borderColor: errors.departure_at ? '#DC2626' : undefined }}
                />
                {errors.departure_at && (
                  <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {errors.departure_at}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Valor Tiquete (COP) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="350000"
                  step="1000"
                  min="1"
                  value={formData.amount}
                  onChange={e => handleInputChange('amount', e.target.value)}
                  style={{ borderColor: errors.amount ? '#DC2626' : undefined }}
                />
                {errors.amount && (
                  <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {errors.amount}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Asiento <span style={{ color: '#8A9289', fontWeight: 400 }}>(Opcional)</span>
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej. 14C"
                  value={formData.seat}
                  onChange={e => handleInputChange('seat', e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit">
              Guardar Reserva Temporal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
