import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5082/api'}/mantenimientos`;

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('fisei_token')}` }
});

export interface EquipoResumenDto {
  id: number;
  numeroSerie: string;
  laboratorio: string;
}

export interface MantenimientoDto {
  id: number;
  equipoId: number;
  fechaProgramada: string;
  fechaRealizada: string | null;
  estado: string;
  tipo: string | null;
  responsable: string | null;
  prioridad: string | null;
  observaciones: string | null;
  diagnostico: string | null;
  accionesRealizadas: string | null;
  fechaCreacion: string;
  equipo: EquipoResumenDto;
}

export interface CrearMantenimientoDto {
  equipoId: number;
  tipo: string;
  responsable: string;
  prioridad: string;
  observaciones?: string;
  fechaProgramada?: string;
}

export interface ActualizarMantenimientoDto {
  tipo: string;
  responsable: string;
  prioridad: string;
  fechaProgramada: string;
  observaciones?: string;
}

export interface CompletarMantenimientoDto {
  fechaRealizada: string;
  diagnostico: string;
  accionesRealizadas: string;
  observaciones?: string;
}

export interface ReprogramarMantenimientoDto {
  nuevaFecha: string;
  motivo: string;
}

export const obtenerMantenimientos = async (estado?: string, laboratorio?: string): Promise<MantenimientoDto[]> => {
  const params = new URLSearchParams();
  if (estado) params.append('estado', estado);
  if (laboratorio) params.append('laboratorio', laboratorio);
  
  const res = await axios.get(`${API_URL}?${params.toString()}`, getHeaders());
  return res.data;
};

export const obtenerMantenimientosPorEquipo = async (equipoId: number): Promise<MantenimientoDto[]> => {
  const res = await axios.get(`${API_URL}/equipo/${equipoId}`, getHeaders());
  return res.data;
};

export const obtenerMantenimientoPorId = async (id: number): Promise<MantenimientoDto> => {
  const res = await axios.get(`${API_URL}/${id}`, getHeaders());
  return res.data;
};

export const crearMantenimiento = async (dto: CrearMantenimientoDto): Promise<MantenimientoDto> => {
  const res = await axios.post(API_URL, dto, getHeaders());
  return res.data;
};

export const actualizarMantenimiento = async (id: number, dto: ActualizarMantenimientoDto): Promise<void> => {
  await axios.put(`${API_URL}/${id}`, dto, getHeaders());
};

export const reprogramarMantenimiento = async (id: number, dto: ReprogramarMantenimientoDto): Promise<void> => {
  await axios.put(`${API_URL}/${id}/reprogramar`, dto, getHeaders());
};

export const iniciarMantenimiento = async (id: number): Promise<void> => {
  await axios.put(`${API_URL}/${id}/iniciar`, {}, getHeaders());
};

export const completarMantenimiento = async (id: number, dto: CompletarMantenimientoDto): Promise<void> => {
  await axios.put(`${API_URL}/${id}/completar`, dto, getHeaders());
};

export const cancelarMantenimiento = async (id: number): Promise<void> => {
  await axios.put(`${API_URL}/${id}/cancelar`, {}, getHeaders());
};

// --- NUEVOS ENDPOINTS (Sprint 3) ---

export interface DetalleEquipoRequestDto {
  equipoId: string;
  laboratoristaAsignadoId: number;
}

export interface CrearOrdenRequestDto {
  fechaIngreso: string;
  descripcionGeneral?: string;
  tipoMantenimiento: string;
  equipos: {
    equipoId: string;
    laboratoristaAsignadoId: number;
  }[];
}

export interface ActualizarEstadoRequestDto {
  estadoIndividual: string;
}

export const crearOrdenMantenimiento = async (dto: CrearOrdenRequestDto) => {
  const res = await axios.post(`${API_URL}/ordenes`, dto, getHeaders());
  return res.data;
};

export const obtenerTodasLasOrdenes = async () => {
  const res = await axios.get(`${API_URL}`, getHeaders());
  return res.data;
};

export const obtenerOrdenPorId = async (id: string) => {
  const res = await axios.get(`${API_URL}/ordenes/${id}`, getHeaders());
  return res.data;
};

export const cerrarOrdenMaestra = async (id: string) => {
  const res = await axios.patch(`${API_URL}/ordenes/${id}/cerrar`, {}, getHeaders());
  return res.data;
};

export const actualizarEstadoDetalle = async (ordenId: string, detalleId: string, estadoIndividual: string) => {
  const res = await axios.patch(
    `${API_URL}/ordenes/${ordenId}/detalle/${detalleId}/estado`,
    { estadoIndividual },
    getHeaders()
  );
  return res.data;
};

// --- ENDPOINTS CATALOGOS Y RESOLUCION ---

export interface DiagnosticoPredefinido {
  id: number;
  codigo: string;
  descripcion: string;
  categoriaEquipo: string;
}

export interface AccionPredefinida {
  id: number;
  nombre: string;
  categoriaEquipo: string;
}

export interface RecursoUtilizadoDto {
  tipoRecursoPrincipal: string;
  recursoSubcategoriaId?: number;
  cantidadUtilizada: number;
}

export interface ResolverDetalleDto {
  diagnosticoPredefinidoId: number;
  descripcionDetallada: string;
  accionesIds: number[];
  recursos: RecursoUtilizadoDto[];
}

export const obtenerDiagnosticosPorCategoria = async (categoria: string): Promise<DiagnosticoPredefinido[]> => {
  const res = await axios.get(`${API_URL}/catalogos/diagnosticos/${categoria}`, getHeaders());
  return res.data;
};

export const obtenerAccionesPorCategoria = async (categoria: string): Promise<AccionPredefinida[]> => {
  const res = await axios.get(`${API_URL}/catalogos/acciones/${categoria}`, getHeaders());
  return res.data;
};

export const resolverDetalleMantenimiento = async (ordenId: string, detalleId: string, dto: ResolverDetalleDto) => {
  const res = await axios.post(`${API_URL}/ordenes/${ordenId}/detalle/${detalleId}/resolver`, dto, getHeaders());
  return res.data;
};
