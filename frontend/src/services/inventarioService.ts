import axios from 'axios';

const BASE_URL = 'http://localhost:5064/api/inventario';

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
  estado: string;
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

export const obtenerEquipos = async (): Promise<Equipo[]> => {
  const response = await axios.get<Equipo[]>(`${BASE_URL}/equipos`);
  return response.data;
};

export const getHojaVidaEquipo = async (id: number): Promise<HojaVida> => {
  const response = await axios.get<HojaVida>(`${BASE_URL}/equipos/${id}/hoja-vida`);
  return response.data;
};
