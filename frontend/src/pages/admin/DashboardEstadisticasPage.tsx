/**
 * DashboardEstadisticasPage.tsx – US-REP-02
 * Dashboard estadístico con filtro de fechas para el Administrador.
 * Consume: GET /api/mantenimientos/estadisticas?fechaInicio=&fechaFin=
 *
 * Patrón visual idéntico a PrediccionesIA.tsx
 * Librería de gráficos: recharts (ya instalada en el proyecto)
 */

import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { obtenerEstadisticas } from "../../services/mantenimientoService";
import type { EstadisticasResponseDto } from "../../services/mantenimientoService";

// ─── Paleta de colores del proyecto ─────────────────────────────────────────
const C_PRIMARY   = '#7b1e2b';
const C_ORANGE    = '#e97918';
const C_YELLOW    = '#ca8a04';
const C_GREEN     = '#16a34a';
const C_BLUE      = '#60a5fa';
const C_PURPLE    = '#a855f7';

const C_TIPOS: Record<string, string> = {
  Preventivo: C_PRIMARY,
  Correctivo: C_ORANGE,
  Adaptativo: C_YELLOW,
};

const C_PIE = [C_PRIMARY, C_ORANGE, C_YELLOW, C_GREEN, C_BLUE, C_PURPLE];

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Devuelve YYYY-MM-DD del primer y último día del mes actual */
function rangoMesActual(): { inicio: string; fin: string } {
  const hoy  = new Date();
  const y    = hoy.getFullYear();
  const m    = hoy.getMonth();
  const fmt  = (d: Date) => d.toISOString().split('T')[0];
  return {
    inicio: fmt(new Date(y, m, 1)),
    fin:    fmt(new Date(y, m + 1, 0)),
  };
}

/** Abrevia el GUID para mostrarlo en la etiqueta del eje Y */
function abreviarGuid(guid: string): string {
  if (!guid || guid.length < 8) return guid;
  return `...${guid.slice(-8)}`;
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 8px 20px rgba(0,0,0,.08)',
      fontSize: '0.85rem',
    }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#111' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 8px 20px rgba(0,0,0,.08)',
      fontSize: '0.85rem',
      maxWidth: 220,
    }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#111' }}>{d.name}</p>
      <p style={{ margin: 0, color: d.payload.fill }}>
        Cantidad: <strong>{d.payload.cantidad}</strong>
      </p>
      <p style={{ margin: 0, color: 'var(--color-muted)' }}>
        {d.payload.porcentaje}%
      </p>
    </div>
  );
};

const StatCard = ({
  label, value, sub, color = C_PRIMARY,
}: { label: string; value: string | number; sub?: string; color?: string }) => (
  <div className="card card--padded" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{
      fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
    }}>
      {label}
    </span>
    <span style={{ fontSize: '2rem', fontWeight: 850, color, lineHeight: 1.1 }}>{value}</span>
    {sub && <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{sub}</span>}
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────
export const DashboardEstadisticasPage = () => {
  const rango = rangoMesActual();

  const [fechaInicio, setFechaInicio] = useState(rango.inicio);
  const [fechaFin,    setFechaFin]    = useState(rango.fin);
  const [datos,       setDatos]       = useState<EstadisticasResponseDto | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Guard para evitar solicitudes simultáneas
  const fetchingRef = useRef(false);

  const cargar = async (inicio: string, fin: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await obtenerEstadisticas(inicio, fin);
      setDatos(result);
    } catch (e: any) {
      const msg = e?.response?.data?.Mensaje ?? e?.message ?? 'Error al obtener estadísticas.';
      setError(msg);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Carga inicial con el mes actual
  useEffect(() => {
    cargar(rango.inicio, rango.fin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltrar = () => {
    cargar(fechaInicio, fechaFin);
  };

  // ── Datos derivados ──────────────────────────────────────────────────────
  const tarjetas = datos?.tarjetas ?? {
    totalMantenimientos: 0,
    totalCompletados:    0,
    totalPendientes:     0,
    promedioDuracion:    0,
  };

  // Gráfico 1 – datos para BarChart
  const datosGrafico1 = (datos?.grafico1 ?? []).map(m => ({
    mes:        m.mes,
    Preventivo: m.preventivo,
    Correctivo: m.correctivo,
    Adaptativo: m.adaptativo,
  }));

  // Gráfico 2 – datos para PieChart (enriquecemos con propiedades extra para tooltip)
  const datosGrafico2 = (datos?.grafico2 ?? []).map(c => ({
    name:       c.causa,
    value:      c.cantidad,
    cantidad:   c.cantidad,
    porcentaje: c.porcentaje,
  }));

  // Gráfico 3 – datos para BarChart horizontal
  const datosGrafico3 = (datos?.grafico3 ?? []).map(e => ({
    equipo:             abreviarGuid(e.equipoId),
    equipoCompleto:     e.equipoId,
    totalMantenimientos: e.totalMantenimientos,
  }));

  const sinDatos = datos !== null &&
    datosGrafico1.length === 0 &&
    datosGrafico2.length === 0 &&
    datosGrafico3.length === 0 &&
    tarjetas.totalMantenimientos === 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="page-section">

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 22 }}>
        <div>
          <p className="section-kicker">Análisis de periodo · MantenimientosDB</p>
          <h2 className="section-title">Dashboard Estadístico</h2>
          <p className="section-description">
            Visualiza tendencias, causas de falla y equipos críticos en el rango de fechas seleccionado.
          </p>
        </div>
      </div>

      {/* Filtro de fechas */}
      <div className="card card--padded" style={{ marginBottom: 22 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 14,
          flexWrap: 'wrap',
        }}>
          <div className="form-field" style={{ flex: '1 1 160px' }}>
            <label className="form-label" htmlFor="dash-fecha-inicio">Fecha inicio</label>
            <input
              id="dash-fecha-inicio"
              type="date"
              className="form-input"
              value={fechaInicio}
              max={fechaFin}
              onChange={e => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="form-field" style={{ flex: '1 1 160px' }}>
            <label className="form-label" htmlFor="dash-fecha-fin">Fecha fin</label>
            <input
              id="dash-fecha-fin"
              type="date"
              className="form-input"
              value={fechaFin}
              min={fechaInicio}
              onChange={e => setFechaFin(e.target.value)}
            />
          </div>
          <button
            id="dash-btn-filtrar"
            className="btn btn--primary"
            onClick={handleFiltrar}
            disabled={loading}
            style={{ minWidth: 110 }}
          >
            {loading ? (
              <>
                <span className="auth-loader" style={{
                  width: 16, height: 16,
                  borderWidth: 2,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: 6,
                }} />
                Cargando...
              </>
            ) : 'Filtrar'}
          </button>
        </div>
      </div>

      {/* Estado de error */}
      {error && (
        <div className="alert alert--error" style={{ marginBottom: 18 }}>
          <strong>⚠ Error:</strong> {error}
        </div>
      )}

      {/* Estado de carga inicial */}
      {loading && !datos && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div className="auth-loader" style={{ margin: '0 auto 20px' }} />
          <p style={{ color: C_PRIMARY, fontWeight: 700 }}>Cargando estadísticas...</p>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Consultando la base de datos de mantenimientos
          </p>
        </div>
      )}

      {/* Contenido principal (visible cuando hay datos o estado vacío) */}
      {!loading || datos ? (
        <>
          {/* 4 Tarjetas de resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 22,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 200ms ease',
          }}>
            <StatCard
              label="Total mantenimientos"
              value={tarjetas.totalMantenimientos}
              sub="En el periodo seleccionado"
              color={C_PRIMARY}
            />
            <StatCard
              label="Completados"
              value={tarjetas.totalCompletados}
              sub="Estado Cerrado"
              color={C_GREEN}
            />
            <StatCard
              label="Pendientes"
              value={tarjetas.totalPendientes}
              sub="En curso o abiertos"
              color={C_ORANGE}
            />
            <StatCard
              label="Promedio duración"
              value={tarjetas.promedioDuracion === 0 ? '—' : `${tarjetas.promedioDuracion} d`}
              sub="Días promedio (cerrados)"
              color={C_YELLOW}
            />
          </div>

          {/* Sin datos */}
          {sinDatos && !error && (
            <div className="card card--padded" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '1rem' }}>
                No se encontraron mantenimientos en el rango seleccionado.
              </p>
              <p style={{ margin: '8px 0 0', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                Selecciona otro período y presiona <strong>Filtrar</strong>.
              </p>
            </div>
          )}

          {/* Gráficos (solo si hay datos) */}
          {!sinDatos && (
            <>
              {/* Fila superior: Gráfico 1 + Gráfico 2 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 18,
                marginBottom: 18,
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 200ms ease',
              }}>

                {/* Gráfico 1 – Barras agrupadas por tipo de mantenimiento */}
                <div className="card card--padded">
                  <div style={{ marginBottom: 14 }}>
                    <p className="section-kicker" style={{ marginBottom: 2 }}>Tendencia mensual</p>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>
                      Mantenimientos por mes y tipo
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                      Preventivo · Correctivo · Adaptativo
                    </p>
                  </div>
                  {datosGrafico1.length === 0 ? (
                    <div className="state-box">Sin datos en el periodo</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={datosGrafico1}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe8" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Preventivo" name="Preventivo" fill={C_TIPOS.Preventivo} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Correctivo" name="Correctivo" fill={C_TIPOS.Correctivo} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Adaptativo" name="Adaptativo" fill={C_TIPOS.Adaptativo} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Gráfico 2 – Pastel de causas de falla */}
                <div className="card card--padded">
                  <div style={{ marginBottom: 14 }}>
                    <p className="section-kicker" style={{ marginBottom: 2 }}>Causas de falla</p>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>
                      Distribución de diagnósticos
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                      Porcentaje sobre total de diagnósticos del periodo
                    </p>
                  </div>
                  {datosGrafico2.length === 0 ? (
                    <div className="state-box">Sin diagnósticos registrados en el periodo</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={datosGrafico2}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          label={({ name, porcentaje }: any) =>
                            `${name.length > 16 ? name.slice(0, 14) + '…' : name} ${porcentaje}%`
                          }
                          labelLine
                        >
                          {datosGrafico2.map((_, i) => (
                            <Cell key={i} fill={C_PIE[i % C_PIE.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico 3 – Top 5 equipos (barras horizontales) */}
              <div
                className="card card--padded"
                style={{
                  marginBottom: 8,
                  opacity: loading ? 0.5 : 1,
                  transition: 'opacity 200ms ease',
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <p className="section-kicker" style={{ marginBottom: 2 }}>Equipos críticos</p>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>
                    Top 5 equipos con más mantenimientos
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    Identificador de equipo (GUID) · mayor frecuencia en el periodo
                  </p>
                </div>
                {datosGrafico3.length === 0 ? (
                  <div className="state-box">Sin datos de equipos en el periodo</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={datosGrafico3}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe8" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="equipo"
                        width={110}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="totalMantenimientos"
                        name="Mantenimientos"
                        fill={C_PRIMARY}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </>
      ) : null}
    </section>
  );
};
