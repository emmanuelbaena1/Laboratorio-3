import React from 'react';
import { Search, Bell, Plus, RefreshCw } from 'lucide-react';

export default function Header({ 
  searchQuery, 
  onSearchChange, 
  onOpenNewReservation, 
  onResetData,
  currentUser 
}) {
  return (
    <header className="top-header">
      {/* Barra de Búsqueda Global */}
      <div className="search-bar-wrapper">
        <Search size={16} color="#8A9289" />
        <input 
          type="text"
          className="search-input"
          placeholder="Buscar vuelo (ej. AV1234), ruta o pasajero..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <span className="search-shortcut">⌘ K</span>
      </div>

      {/* Acciones del Lado Derecho */}
      <div className="header-right-actions">
        {/* Botón de recarga / reseteo a datos mock originales */}
        <button 
          className="icon-button" 
          title="Restablecer datos originales"
          onClick={onResetData}
          type="button"
        >
          <RefreshCw size={16} />
        </button>

        {/* Notificaciones */}
        <button className="icon-button" title="Notificaciones operativas" type="button">
          <Bell size={16} />
          <span className="notification-badge" />
        </button>

        {/* Botón de Acción Principal (Estilo de la imagen de referencia: píldora verde pino oscuro) */}
        <button 
          className="btn-primary-action"
          onClick={onOpenNewReservation}
          type="button"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span>Nueva Reserva</span>
        </button>
      </div>
    </header>
  );
}

