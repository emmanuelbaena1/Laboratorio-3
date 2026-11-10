// ==============================================================================
// FORMATTERS - MONEDA (COP), FECHAS Y PORCENTAJES
// ==============================================================================

/**
 * Formatea un número como Pesos Colombianos (COP)
 * Ejemplo: 320000 -> "$ 320.000"
 */
export function formatCOP(amount, compact = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return "$ 0";
  
  if (compact && Math.abs(amount) >= 1_000_000) {
    const millions = (amount / 1_000_000).toFixed(1);
    return `$ ${millions}M COP`;
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formatea porcentajes con un decimal
 * Ejemplo: 72.456 -> "72.5%"
 */
export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return "0.0%";
  return `${Number(value).toFixed(1)}%`;
}

/**
 * Formatea fechas ISO a formato legible en español
 * Ejemplo: "2026-11-08T14:10:00-05:00" -> "8 Nov, 2026"
 */
export function formatDate(isoString, includeTime = false) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";

  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat('es-CO', options).format(date);
}

/**
 * Formatea hora corta
 * Ejemplo: "08:30 a. m."
 */
export function formatTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

