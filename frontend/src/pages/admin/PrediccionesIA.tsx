/**
 * PrediccionesIA.tsx – US-IA-01 Agente de IA para mantenimiento predictivo
 * Consume: GET /api/ia/predicciones  y  GET /api/ia/estadisticas
 * Sin TensorFlow.js – toda la lógica heurística corre en la API Flask.
 */

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Prediccion {
  equipoId: number;
  numeroSerie: string;
  laboratorio: string;
  marca: string;
  modelo: string;
  riesgo: 'Alto' | 'Medio' | 'Bajo';
  razon: string;
  diasSinMantenimiento: number | null;
  totalCorrectivos: number;
}

interface MesDato {
  tipo: string;
  total: number;
}

interface MantenimientoMes {
  mes: string;
  datos: MesDato[];
}

interface TopEquipo {
  equipoId: number;
  numeroSerie: string;
  marca: string;
  modelo: string;
  laboratorio: string;
  totalCorrectivos: number;
}

interface DistribucionLab {
  laboratorio: string;
  totalMantenimientos: number;
}

interface Resumen {
  total: number;
  completados: number;
  pendientes: number;
  cancelados: number;
}

interface Estadisticas {
  mantenimientosPorMes: MantenimientoMes[];
  topEquiposConFallas: TopEquipo[];
  distribucionPorLaboratorio: DistribucionLab[];
  resumen: Resumen;
}

// ─── Colores del proyecto ─────────────────────────────────────────────────────
const C_PRIMARY = '#7b1e2b';
const C_ALTO    = '#e97918';
const C_MEDIO   = '#ca8a04';
const C_BAJO    = '#16a34a';
const C_PIE     = ['#7b1e2b', '#e97918', '#ca8a04', '#16a34a', '#60a5fa', '#a855f7'];

const RIESGO_CONFIG = {
  Alto:  { color: C_PRIMARY, bg: '#fff1f2', badge: 'badge--error'   },
  Medio: { color: C_MEDIO,   bg: '#fefce8', badge: 'badge--neutral' },
  Bajo:  { color: C_BAJO,    bg: '#f0fdf4', badge: 'badge--success' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
const IA_BASE = import.meta.env.VITE_IA_URL ?? 'http://localhost:5090/api/ia';

const getToken = () => localStorage.getItem('fisei_token') ?? '';

async function fetchIA<T>(ruta: string): Promise<T> {
  const res = await fetch(`${IA_BASE}${ruta}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Error ${res.status} al consultar ${ruta}`);
  return res.json();
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 8px 20px rgba(0,0,0,.08)', fontSize: '0.85rem',
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
export const PrediccionesIA = () => {
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filtroRiesgo, setFiltroRiesgo] = useState('TODOS');
  const [busqueda, setBusqueda]   = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);
        const [pred, est] = await Promise.all([
          fetchIA<Prediccion[]>('/predicciones'),
          fetchIA<Estadisticas>('/estadisticas'),
        ]);
        setPredicciones(Array.isArray(pred) ? pred : []);
        setEstadisticas(est);
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo conectar con el servicio de IA. Verifica que la API Flask esté corriendo en el puerto 5090.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // ── Datos derivados ────────────────────────────────────────────────────────
  const altos   = predicciones.filter(p => p.riesgo === 'Alto').length;
  const medios  = predicciones.filter(p => p.riesgo === 'Medio').length;
  const bajos   = predicciones.filter(p => p.riesgo === 'Bajo').length;

  const predFiltradas = predicciones.filter(p => {
    const matchRiesgo  = filtroRiesgo === 'TODOS' || p.riesgo === filtroRiesgo;
    const term         = busqueda.toLowerCase();
    const matchBusq    = !busqueda ||
      p.numeroSerie.toLowerCase().includes(term) ||
      p.marca.toLowerCase().includes(term) ||
      p.modelo.toLowerCase().includes(term) ||
      p.laboratorio.toLowerCase().includes(term);
    return matchRiesgo && matchBusq;
  });

  // Aplanar mantenimientosPorMes para BarChart
  const datosBarras = (() => {
    if (!estadisticas?.mantenimientosPorMes) return [];
    return estadisticas.mantenimientosPorMes.map(m => {
      const obj: Record<string, any> = { mes: m.mes };
      (m.datos || []).forEach(d => { obj[d.tipo] = d.total; });
      return obj;
    });
  })();

  // Tipos únicos para las barras
  const tiposUnicos = Array.from(
    new Set(
      (estadisticas?.mantenimientosPorMes ?? [])
        .flatMap(m => (m.datos || []).map(d => d.tipo))
    )
  );

  // Datos para el pie de distribución por laboratorio
  const dataPie = (estadisticas?.distribucionPorLaboratorio ?? []).map(d => ({
    name: d.laboratorio,
    value: d.totalMantenimientos,
  }));

  // Top equipos para barras horizontales
  const dataTop = (estadisticas?.topEquiposConFallas ?? []).map(e => ({
    nombre: `${e.numeroSerie}`,
    correctivos: e.totalCorrectivos,
    lab: e.laboratorio,
  }));

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="page-section">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div className="auth-loader" style={{ margin: '0 auto 20px' }} />
          <p style={{ color: C_PRIMARY, fontWeight: 700 }}>
            Consultando servicio de predicciones...
          </p>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Analizando historial de mantenimientos con reglas heurísticas
          </p>
        </div>
      </section>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <section className="page-section">
        <div className="alert alert--error" style={{ marginBottom: 16 }}>
          <strong>⚠ Error al conectar con la API de IA:</strong> {error}
        </div>
        <div className="card card--padded">
          <p className="section-kicker">Verifica que el servicio esté activo</p>
          <p style={{ color: 'var(--color-muted)', marginBottom: 12 }}>
            Ejecuta en la terminal dentro de <code>services/FISEI.IA.API</code>:
          </p>
          <pre style={{
            background: '#f8f5f2', borderRadius: 8, padding: '12px 16px',
            fontSize: '0.85rem', color: '#333', border: '1px solid var(--color-border)',
          }}>
{`venv\\Scripts\\activate
python app.py`}
          </pre>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: 8 }}>
            El servicio debe correr en <strong>http://localhost:5090</strong>
          </p>
        </div>
      </section>
    );
  }

  // ── Vista principal ────────────────────────────────────────────────────────
  return (
    <section className="page-section">

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <p className="section-kicker">Análisis heurístico · API Flask</p>
          <h2 className="section-title">Predicciones de la IA</h2>
          <p className="section-description">
            Equipos analizados con reglas heurísticas sobre el historial de mantenimientos.
            Identifica riesgos y proyecta intervenciones futuras.
          </p>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        <StatCard label="Total equipos"   value={predicciones.length} sub="Analizados"               color={C_PRIMARY} />
        <StatCard label="Riesgo Alto"     value={altos}               sub="Revisión urgente"          color={C_PRIMARY} />
        <StatCard label="Riesgo Medio"    value={medios}              sub="Seguimiento recomendado"   color={C_MEDIO}   />
        <StatCard label="Riesgo Bajo"     value={bajos}               sub="Al día"                    color={C_BAJO}    />
        <StatCard label="Total mant."     value={estadisticas?.resumen?.total      ?? 0} sub="Histórico"      />
        <StatCard label="Completados"     value={estadisticas?.resumen?.completados ?? 0} sub="Finalizados"   color={C_BAJO}  />
        <StatCard label="Pendientes"      value={estadisticas?.resumen?.pendientes  ?? 0} sub="En espera"     color={C_MEDIO} />
        <StatCard label="Cancelados"      value={estadisticas?.resumen?.cancelados  ?? 0} sub="Cancelados"    color={C_ALTO}  />
      </div>

      {/* Gráficas superiores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Gráfico 1 – Mantenimientos por mes */}
        <div className="card card--padded">
          <div style={{ marginBottom: 14 }}>
            <p className="section-kicker" style={{ marginBottom: 2 }}>Historial mensual</p>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>
              Mantenimientos por mes y tipo
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              Últimos 6 meses registrados
            </p>
          </div>
          {datosBarras.length === 0 ? (
            <div className="state-box">Sin datos suficientes</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datosBarras} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe8" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {tiposUnicos.map((tipo, i) => (
                  <Bar
                    key={tipo}
                    dataKey={tipo}
                    name={tipo}
                    stackId="a"
                    fill={C_PIE[i % C_PIE.length]}
                    radius={i === tiposUnicos.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico 2 – Distribución por laboratorio */}
        <div className="card card--padded">
          <div style={{ marginBottom: 14 }}>
            <p className="section-kicker" style={{ marginBottom: 2 }}>Distribución</p>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>
              Mantenimientos por laboratorio
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              Proporción histórica por sede
            </p>
          </div>
          {dataPie.length === 0 ? (
            <div className="state-box">Sin datos suficientes</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dataPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine
                >
                  {dataPie.map((_, i) => (
                    <Cell key={i} fill={C_PIE[i % C_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Gráfico 3 – Top 5 equipos con más correctivos */}
      <div className="card card--padded" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <p className="section-kicker" style={{ marginBottom: 2 }}>Equipos críticos</p>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>
            Top 5 equipos con más mantenimientos correctivos
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            Mayor frecuencia de intervenciones históricas
          </p>
        </div>
        {dataTop.length === 0 ? (
          <div className="state-box">Sin datos de correctivos registrados</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={dataTop}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe8" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="correctivos" name="Correctivos" fill={C_PRIMARY} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabla de alertas */}
      <div className="table-card">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p className="section-kicker" style={{ margin: 0 }}>Alertas de riesgo</p>
            <strong style={{ fontSize: '0.95rem', color: '#111' }}>
              {predFiltradas.length} equipo{predFiltradas.length !== 1 ? 's' : ''}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar por serie, marca, laboratorio..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="form-input"
              style={{ minWidth: 240, padding: '7px 12px', fontSize: '0.85rem' }}
            />
            <select
              value={filtroRiesgo}
              onChange={e => setFiltroRiesgo(e.target.value)}
              className="form-select"
              style={{ padding: '7px 12px', fontSize: '0.85rem', minWidth: 150 }}
            >
              <option value="TODOS">Todos los niveles</option>
              <option value="Alto">Riesgo Alto</option>
              <option value="Medio">Riesgo Medio</option>
              <option value="Bajo">Riesgo Bajo</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Laboratorio</th>
                <th>Riesgo</th>
                <th>Días sin mantenimiento</th>
                <th>Correctivos totales</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {predFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="state-box">
                    No hay equipos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                predFiltradas.map(p => {
                  const cfg = RIESGO_CONFIG[p.riesgo] ?? RIESGO_CONFIG['Bajo'];
                  return (
                    <tr
                      key={p.equipoId}
                      style={{
                        background: p.riesgo === 'Alto' ? '#fff8f8' :
                                    p.riesgo === 'Medio' ? '#fffdf0' : undefined,
                      }}
                    >
                      <td>
                        <div className="cell-title">{p.marca} {p.modelo}</div>
                        <div className="cell-subtitle">{p.numeroSerie}</div>
                      </td>
                      <td>{p.laboratorio}</td>
                      <td>
                        <span
                          className={`badge ${cfg.badge}`}
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {p.riesgo}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: p.riesgo === 'Alto' ? C_PRIMARY : '#111',
                        }}>
                          {p.diasSinMantenimiento !== null
                            ? `${p.diasSinMantenimiento} días`
                            : 'Sin registro'}
                        </span>
                      </td>
                      <td>
                        <span className="cell-title">{p.totalCorrectivos}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.83rem', color: 'var(--color-muted)' }}>
                          {p.razon}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: '10px 20px', borderTop: '1px solid var(--color-border)',
          fontSize: '0.78rem', color: 'var(--color-muted)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
          </svg>
          Predicciones generadas por reglas heurísticas sobre la base de datos de mantenimientos.
          Los resultados mejoran con más historial registrado.
        </div>
      </div>

    </section>
  );
};