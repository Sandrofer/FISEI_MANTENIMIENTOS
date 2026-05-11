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

export const registrarEquipo = async (dto: CrearEquipoDto): Promise<EquipoResponse> => {
  const response = await axios.post<EquipoResponse>(`${BASE_URL}/individual`, dto);
  return response.data;
};