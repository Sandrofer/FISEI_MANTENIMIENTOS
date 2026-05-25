import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/mantenimientos`;

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
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
