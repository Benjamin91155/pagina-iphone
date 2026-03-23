export const REPAIR_STATUS_LABELS = {
  INGRESADO: "Ingresado",
  DIAGNOSTICO: "En diagnostico",
  REPARACION: "En reparacion",
  ESPERANDO_REPUESTO: "Esperando repuesto",
  TERMINADO: "Terminado",
  ENTREGADO: "Entregado"
};

export function createTrackingCode(): string {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REP-${code}`;
}

