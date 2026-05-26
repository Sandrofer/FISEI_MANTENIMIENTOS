import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/inventario`;

export interface CrearEquipoDto {
  numeroSerie: string;
  marca: string;
  modelo: string;
  procesador: string;
  laboratorio: string;
  fechaCompra: string;
}

export interface MantenimientoResponse {
  id: number;
  fechaProgramada: string;
  estado: string;
  observaciones: string | null;
}

export interface Mantenimiento {
  id: number;
  fechaProgramada: string;
  fechaRealizada: string | null;
  estado: string;
  tipo: string | null;
  responsable: string | null;
  diagnostico: string | null;
  accionesRealizadas: string | null;
  observaciones: string | null;
}

export interface EquipoResponse {
  id: number;
  numeroSerie: string;
  marca: string;
  modelo: string;
  procesador: string;
  laboratorio: string;
  fechaCompra: string;
  estado: string;
  fechaRegistro: string;
  mantenimientos: MantenimientoResponse[];
}

export interface Equipo {
  id: number;
  numeroSerie: string;
  marca: string;
  modelo: string;
  procesador: string;
  laboratorio: string;
  fechaCompra: string;
  estado: string;
  fechaRegistro: string;
}

export interface HojaVida {
  equipo: Equipo;
  mantenimientos: Mantenimiento[];
}

export const registrarEquipo = async (dto: CrearEquipoDto): Promise<EquipoResponse> => {
  const response = await axios.post<EquipoResponse>(`${BASE_URL}/individual`, dto);
  return response.data;
};

export interface FiltrosEquipo {
  estado?: string;
  procesador?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export const obtenerEquipos = async (filtros?: FiltrosEquipo): Promise<Equipo[]> => {
  const response = await axios.get<Equipo[]>(`${BASE_URL}/equipos`, { params: filtros });
  return response.data;
};

export const getHojaVidaEquipo = async (id: number): Promise<HojaVida> => {
  const response = await axios.get<HojaVida>(`${BASE_URL}/equipos/${id}/hoja-vida`);
  return response.data;
};
