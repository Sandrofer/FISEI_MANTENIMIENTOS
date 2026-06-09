/**
 * prediccionService.ts
 * Servicio de Predicción IA - US-IA-01
 *
 * Consume los endpoints existentes (/api/mantenimientos y /api/inventario/equipos)
 * y calcula métricas heurísticas + prepara tensores para TensorFlow.js.
 * No requiere ningún cambio en el backend.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('fisei_token')}` },
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface OrdenRaw {
  id: string;
  codigoCaso: string;
  fechaIngreso: string;
  tipoMantenimiento: string;
  estadoGeneral: string;
  fechaCierre: string | null;
  detallesMantenimientos: DetalleRaw[];
}

export interface DetalleRaw {
  id: string;
  equipoId: string;
  estadoIndividual: string;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface EquipoRaw {
  id: string;
  codigoInventario: string;
  numeroSerie: string;
  nombreModelo: string;
  marca: string;
  ubicacion: string;
  categoria: string;
  estado: string;
  fechaRegistro: string;
}

// ─── Salidas del servicio ────────────────────────────────────────────────────

export type NivelRiesgo = 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO';

export interface AlertaPrediccion {
  equipoId: string;
  codigoInventario: string;
  nombreModelo: string;
  marca: string;
  ubicacion: string;
  nivelRiesgo: NivelRiesgo;
  scoreRiesgo: number;          // 0–100
  diasDesdeUltimoMantenimiento: number;
  totalMantenimientos: number;
  fallasCriticas: number;       // finalizados como "No Reparado (De Baja)" o correctivos
  intervaloDiasPromedio: number; // promedio de días entre mantenimientos
  proximoMantenimientoPredichoDias: number; // días hasta próxima intervención predicha
  motivos: string[];
}

export interface PrediccionMensual {
  mes: string;           // "Ene 2026"
  preventivos: number;
  correctivos: number;
  total: number;
}

export interface ResumenPredicciones {
  alertas: AlertaPrediccion[];
  prediccionProximos30Dias: number;
  prediccionProximos60Dias: number;
  prediccionProximos90Dias: number;
  historialMensual: PrediccionMensual[];    // últimos 6 meses reales
  proyeccionMensual: PrediccionMensual[];   // próximos 3 meses predichos
  distribucionTipos: { tipo: string; cantidad: number }[];
  topEquiposProblematicos: { nombre: string; total: number; ubicacion: string }[];
  tensorFeatures: number[][];  // para TF.js
  tensorLabels: number[];      // para TF.js
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const diffDias = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const mesLabel = (date: Date) =>
  date.toLocaleString('es-EC', { month: 'short', year: 'numeric' });

// ─── Función principal ───────────────────────────────────────────────────────

export async function calcularPredicciones(): Promise<ResumenPredicciones> {
  // 1. Fetch paralelo de datos existentes
  const [ordenesRes, equiposRes] = await Promise.all([
    axios.get<OrdenRaw[]>(`${API_URL}/mantenimientos/ordenes`, getHeaders()),
    axios.get<EquipoRaw[]>(`${API_URL}/inventario/equipos`, getHeaders()),
  ]);

  const ordenes: OrdenRaw[] = ordenesRes.data ?? [];
  const equipos: EquipoRaw[] = equiposRes.data ?? [];

  const ahora = new Date();

  // 2. Mapa equipoId → historial de mantenimientos
  type HistorialEntry = {
    fecha: Date;
    tipo: string;
    esCritico: boolean;
    diasDesdePrevio: number;
  };

  const historialPorEquipo = new Map<string, HistorialEntry[]>();

  for (const orden of ordenes) {
    const fechaOrden = new Date(orden.fechaIngreso);
    for (const detalle of orden.detallesMantenimientos ?? []) {
      const existente = historialPorEquipo.get(detalle.equipoId) ?? [];
      existente.push({
        fecha: fechaOrden,
        tipo: orden.tipoMantenimiento,
        esCritico:
          detalle.estadoIndividual === 'No Reparado (De Baja)' ||
          orden.tipoMantenimiento === 'Correctivo',
        diasDesdePrevio: 0, // se calcula después
      });
      historialPorEquipo.set(detalle.equipoId, existente);
    }
  }

  // Ordenar historial y calcular intervalos
  historialPorEquipo.forEach((entradas, id) => {
    entradas.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    for (let i = 1; i < entradas.length; i++) {
      entradas[i].diasDesdePrevio = diffDias(entradas[i - 1].fecha, entradas[i].fecha);
    }
    historialPorEquipo.set(id, entradas);
  });

  // 3. Calcular score de riesgo heurístico por equipo
  const alertas: AlertaPrediccion[] = [];

  for (const equipo of equipos) {
    const historial = historialPorEquipo.get(equipo.id) ?? [];
    const total = historial.length;
    const fallasCriticas = historial.filter((h) => h.esCritico).length;

    const ultimaFecha =
      historial.length > 0 ? historial[historial.length - 1].fecha : new Date(equipo.fechaRegistro);
    const diasUltimo = diffDias(ultimaFecha, ahora);

    const intervalos = historial
      .slice(1)
      .map((h) => h.diasDesdePrevio)
      .filter((d) => d > 0);
    const intervaloPromedio =
      intervalos.length > 0
        ? intervalos.reduce((a, b) => a + b, 0) / intervalos.length
        : 180; // default: 6 meses si no hay historial

    // Score heurístico (0-100):
    // - Días sin mantenimiento vs intervalo esperado: 40 pts
    // - Frecuencia de fallos críticos: 30 pts
    // - Total mantenimientos (más historial = más confianza, pero también más desgaste): 20 pts
    // - Estado del equipo: 10 pts
    let score = 0;

    const ratioTiempo = Math.min(diasUltimo / Math.max(intervaloPromedio, 1), 2);
    score += Math.min(ratioTiempo * 20, 40);

    const ratioFallas = total > 0 ? fallasCriticas / total : 0;
    score += ratioFallas * 30;

    score += Math.min(total * 2, 20);

    if (equipo.estado === 'Mantenimiento' || equipo.estado === 'Dado de baja') score += 10;

    score = Math.round(Math.min(score, 100));

    // Predicción de próxima intervención
    const proximoDias = Math.max(
      Math.round(intervaloPromedio - diasUltimo),
      0
    );

    // Nivel de riesgo
    let nivelRiesgo: NivelRiesgo = 'BAJO';
    if (score >= 70) nivelRiesgo = 'CRÍTICO';
    else if (score >= 50) nivelRiesgo = 'ALTO';
    else if (score >= 30) nivelRiesgo = 'MEDIO';

    // Motivos textuales
    const motivos: string[] = [];
    if (diasUltimo > intervaloPromedio)
      motivos.push(`Sin mantenimiento hace ${diasUltimo} días (intervalo esperado: ${Math.round(intervaloPromedio)} días)`);
    if (fallasCriticas > 0)
      motivos.push(`${fallasCriticas} falla(s) crítica(s) registrada(s)`);
    if (total >= 3)
      motivos.push(`${total} intervenciones en el historial`);
    if (motivos.length === 0)
      motivos.push('Equipo dentro de parámetros normales');

    alertas.push({
      equipoId: equipo.id,
      codigoInventario: equipo.codigoInventario,
      nombreModelo: equipo.nombreModelo,
      marca: equipo.marca,
      ubicacion: equipo.ubicacion,
      nivelRiesgo,
      scoreRiesgo: score,
      diasDesdeUltimoMantenimiento: diasUltimo,
      totalMantenimientos: total,
      fallasCriticas,
      intervaloDiasPromedio: Math.round(intervaloPromedio),
      proximoMantenimientoPredichoDias: proximoDias,
      motivos,
    });
  }

  // Ordenar por score descendente
  alertas.sort((a, b) => b.scoreRiesgo - a.scoreRiesgo);

  // 4. Historial mensual real (últimos 6 meses)
  const historialMensual: PrediccionMensual[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const siguiente = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
    const ordenesDelMes = ordenes.filter((o) => {
      const f = new Date(o.fechaIngreso);
      return f >= d && f < siguiente;
    });
    historialMensual.push({
      mes: mesLabel(d),
      preventivos: ordenesDelMes.filter((o) => o.tipoMantenimiento === 'Preventivo').length,
      correctivos: ordenesDelMes.filter((o) => o.tipoMantenimiento === 'Correctivo').length,
      total: ordenesDelMes.length,
    });
  }

  // 5. Proyección próximos 3 meses (usando tasa de crecimiento simple del historial)
  const promedioMensual =
    historialMensual.reduce((a, b) => a + b.total, 0) / historialMensual.length || 1;
  const ultimosMeses = historialMensual.slice(-3);
  const tendencia =
    ultimosMeses.length > 1
      ? (ultimosMeses[ultimosMeses.length - 1].total - ultimosMeses[0].total) /
        Math.max(ultimosMeses.length - 1, 1)
      : 0;

  const proyeccionMensual: PrediccionMensual[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1);
    const predicho = Math.max(Math.round(promedioMensual + tendencia * i), 0);
    const preventivosRatio =
      historialMensual.reduce((a, b) => a + b.preventivos, 0) /
      Math.max(historialMensual.reduce((a, b) => a + b.total, 0), 1);
    proyeccionMensual.push({
      mes: mesLabel(d),
      preventivos: Math.round(predicho * preventivosRatio),
      correctivos: Math.round(predicho * (1 - preventivosRatio)),
      total: predicho,
    });
  }

  // 6. Predicciones en ventanas de tiempo
  const prediccionProximos30Dias = alertas.filter(
    (a) => a.proximoMantenimientoPredichoDias <= 30
  ).length;
  const prediccionProximos60Dias = alertas.filter(
    (a) => a.proximoMantenimientoPredichoDias <= 60
  ).length;
  const prediccionProximos90Dias = alertas.filter(
    (a) => a.proximoMantenimientoPredichoDias <= 90
  ).length;

  // 7. Distribución por tipo
  const tiposMap = new Map<string, number>();
  for (const orden of ordenes) {
    tiposMap.set(orden.tipoMantenimiento, (tiposMap.get(orden.tipoMantenimiento) ?? 0) + 1);
  }
  const distribucionTipos = Array.from(tiposMap.entries()).map(([tipo, cantidad]) => ({
    tipo,
    cantidad,
  }));

  // 8. Top 5 equipos problemáticos
  const topEquiposProblematicos = alertas
    .slice(0, 5)
    .map((a) => ({
      nombre: `${a.marca} ${a.nombreModelo}`,
      total: a.totalMantenimientos,
      ubicacion: a.ubicacion,
    }));

  // 9. Features para TensorFlow.js
  // Features: [diasSinMant, totalMant, fallasCriticas, intervaloPromedio]
  // Label: scoreRiesgo (0-1 normalizado)
  const tensorFeatures: number[][] = alertas.map((a) => [
    Math.min(a.diasDesdeUltimoMantenimiento / 365, 1),
    Math.min(a.totalMantenimientos / 20, 1),
    Math.min(a.fallasCriticas / 5, 1),
    Math.min(a.intervaloDiasPromedio / 365, 1),
  ]);
  const tensorLabels: number[] = alertas.map((a) => a.scoreRiesgo / 100);

  return {
    alertas,
    prediccionProximos30Dias,
    prediccionProximos60Dias,
    prediccionProximos90Dias,
    historialMensual,
    proyeccionMensual,
    distribucionTipos,
    topEquiposProblematicos,
    tensorFeatures,
    tensorLabels,
  };
}