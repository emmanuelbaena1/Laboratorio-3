import React from 'react';
import { 
  Plane, 
  LayoutDashboard, 
  Ticket, 
  UserCheck, 
  Users, 
  Layers, 
  Settings, 
  Lock, 
  ChevronDown, 
  ChevronsUpDown,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab = 'overview', onSelectTab, currentUser }) {
  const navItems = [
    { id: 'overview', label: 'Visión General', icon: LayoutDashboard },
    { id: 'reservations', label: 'Reservas y Pagos', icon: Ticket },
    { id: 'boarding', label: 'Check-in & Embarque', icon: UserCheck },
    { id: 'agents', label: 'Agentes de Puerta', icon: Users },
    { id: 'flights', label: 'Vuelos y Rutas', icon: Layers },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Encabezado y Marca */}
        <div className="sidebar-header">
          <div className="brand-container">
            <div className="brand-icon-wrapper">
              <Plane size={20} strokeWidth={2.4} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-title">AeroPulse</span>
              <span className="brand-tag">Ops</span>
            </div>
          </div>

          {/* Selector de Workspace (Fiel al de la imagen "My Workspace / Free plan") */}
          <div className="workspace-selector" title="Espacio de trabajo operacional">
            <div className="workspace-info">
              <div className="workspace-icon">
                <Lock size={15} />
              </div>
              <div>
                <div className="workspace-name">Centro Operaciones</div>
                <div className="workspace-plan">Aerolínea Virtual · Pro</div>
              </div>
            </div>
            <ChevronDown size={14} color="#8A9289" />
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Perfil de Usuario en la parte inferior */}
      <div className="sidebar-footer">
        <div className="user-profile-card">
          <div className="user-profile-data">
            <img 
              src={currentUser?.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"} 
              alt={currentUser?.full_name || "Usuario"}
              className="user-avatar-img"
            />
            <div>
              <div className="user-name">{currentUser?.full_name || "Laura Restrepo"}</div>
              <div className="user-email">{currentUser?.email || "laura.restrepo@aeropulse.co"}</div>
            </div>
          </div>
          <ChevronsUpDown size={15} color="#8A9289" />
        </div>
      </div>
    </aside>
  );
}

