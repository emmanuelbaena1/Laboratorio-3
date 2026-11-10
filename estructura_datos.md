# Estructura de DATOS:

## 1. Tabla de Usuarios (Agentes de Check-in y Puerta)
Esta entidad es necesaria para los filtros del dashboard (ver el rendimiento individual vs. equipo de agentes). Los agentes atienden el proceso de Check-in y embarque. Las reservas con check-in por web/app no tienen agente asignado.

```json
{
  "id": "string (UUID - identificador único del agente)",
  "full_name": "string (Nombre completo, ej: 'Laura Restrepo')",
  "email": "string (Correo corporativo)",
  "role": "string (Permisos: 'admin', 'agente_checkin', 'agente_puerta')",
  "avatar_url": "string (URL de la imagen para mostrar en la interfaz)",
  "monthly_target": "integer (Meta mensual de pasajeros atendidos, para comparar vs atendidos reales)",
  "status": "string (active, inactive)"
}
```

## 2. Tabla de Etapas (Estados del Proceso)
Define las columnas del gráfico de barras "Reservas por Estado del Proceso". Es vital que sea una tabla separada para poder reordenar o cambiar nombres en el futuro sin romper los datos.

```json
{
  "id": "string (UUID - identificador del estado)",
  "name": "string (Nombre visible: 'Reserva temporal', 'Pagada', 'Check-in', 'Abordó', 'Expirada', 'Cancelada', 'Pago rechazado', 'No-show')",
  "display_order": "integer (1, 2, 3... para ordenar el gráfico de izquierda a derecha)",
  "win_probability": "integer (Porcentaje estimado de que la reserva termine en abordaje, ej: 70%)"
}
```

## 3. Tabla de Clientes (Pasajeros)
La entidad a la que le vendemos los tiquetes. Es un modelo B2C (Business to Consumer): el cliente es una persona, no una empresa.

```json
{
  "id": "string (UUID - identificador único del pasajero)",
  "full_name": "string (Nombre completo del pasajero)",
  "email": "string (Email de contacto, donde se envía la confirmación y el e-ticket)",
  "phone": "string (Teléfono)",
  "created_at": "datetime (Fecha de alta en el sistema)"
}
```

## 4. Tabla de Oportunidades (Reservas)
Esta es la tabla más importante. De aquí salen todos los KPIs (Ingresos, Tasa de Abordaje, Reservas Activas). Cada registro es una reserva, desde que se crea la reserva temporal hasta que el pasajero aborda o el proceso se cierra.

```json
{
  "id": "string (UUID - identificador único de la reserva)",
  "title": "string (Nombre de la reserva, ej: 'Medellín → Bogotá · AV1234')",
  "passenger_id": "string (Foreign Key -> Tabla Clientes/Pasajeros)",
  "agent_id": "string (Foreign Key -> Tabla Usuarios/Agentes. Opcional: null si el check-in fue por web/app)",
  "stage_id": "string (Foreign Key -> Tabla Etapas. En qué estado está la reserva ahora)",

  "flight_code": "string (Código del vuelo, ej: 'AV1234'. Sirve para filtrar por vuelo)",
  "origin": "string (Código IATA del origen, ej: 'MDE'. Sirve para filtrar por ruta)",
  "destination": "string (Código IATA del destino, ej: 'BOG')",
  "departure_at": "datetime (Fecha y hora de salida del vuelo)",

  "amount": "decimal (Valor del tiquete. Alimenta 'Total Revenue' y 'Avg Ticket Size'. Solo cuenta si la reserva fue pagada, es decir, si tiene paid_at)",
  "currency": "string (ISO code, ej: 'COP')",

  "status": "string (Estado final: 'open' = reserva temporal, pagada o con check-in; 'won' = abordó; 'lost' = expirada, cancelada, pago rechazado o no-show. Vital para la 'Tasa de Abordaje')",

  "created_at": "datetime (Creación de la reserva temporal. Alimenta el KPI '+4 reservas esta semana')",
  "expires_at": "datetime (created_at + 24 horas. Si pasa ese plazo sin pago, la reserva expira)",
  "paid_at": "datetime (Opcional. Cuándo se aprobó el pago y se emitió el e-ticket)",
  "closed_at": "datetime (Fecha real de cierre: abordó o salió del proceso. Para gráficas históricas)",

  "checkin_channel": "string (Opcional. Canal del check-in: 'web_app', 'kiosco' o 'mostrador')",
  "has_luggage": "boolean (Si el pasajero documentó equipaje en el check-in)",
  "luggage_weight_kg": "decimal (Opcional. Peso del equipaje documentado)",
  "excess_fee_amount": "decimal (Tarifa cobrada por exceso de peso, 0 si no excede. Alimenta 'Recaudo por exceso de equipaje')",
  "seat": "string (Opcional. Asiento asignado o confirmado, ej: '14C')",

  "loss_reason": "string (Opcional. Por qué se perdió: 'plazo vencido', 'compra no confirmada', 'pago rechazado', 'no-show')"
}
```

## Resumen de Relaciones para el Desarrollador
1 Agente atiende N Reservas (check-in y embarque).

1 Pasajero puede tener N Reservas (Histórico de viajes).

1 Estado contiene N Reservas (Para agrupar en el gráfico de barras).