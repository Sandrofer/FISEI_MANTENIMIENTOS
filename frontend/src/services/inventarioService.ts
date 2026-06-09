import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5064/api'}/inventario`;

export interface CrearEquipoDto {
  codigoInventario: string;
  numeroSerie: string;
  nombreModelo: string;
  categoriaId: number;
  marcaId: number;
  ubicacionId: number;
  estado: string;
  responsableId: number;
  especificacionesTecnicas: string;
}

export interface ActualizarEquipoDto extends CrearEquipoDto {
  estado: string;
}

export interface MantenimientoResponse {
  id: number;
  fechaProgramada: string;
  estado: string;
  observaciones: string | null;
}

export interface Mantenimiento {
  id: string;
  codigoCaso: string | null;
  fechaProgramada: string;
  fechaInicio: string | null;
  fechaCierre: string | null;
  estado: string;
  tipo: string | null;
  responsable: string | null;
  diagnostico: string | null;
  accionesRealizadas: string | null;
  observaciones: string | null;
}

export interface EquipoResponse {
  id: string;
  codigoInventario: string;
  numeroSerie: string;
  nombreModelo: string;
  categoriaId: number;
  categoria: string;
  marcaId: number;
  marca: string;
  ubicacionId: number;
  ubicacion: string;
  estado: string;
  responsableId: number;
  especificacionesTecnicas: string;
  fechaRegistro: string;
  loteImportacionId: string | null;
}

export interface Equipo {
  id: string;
  codigoInventario: string;
  numeroSerie: string;
  nombreModelo: string;
  categoriaId: number;
  categoria: string;
  marcaId: number;
  marca: string;
  ubicacionId: number;
  ubicacion: string;
  estado: string;
  responsableId: number;
  especificacionesTecnicas: string;
  fechaRegistro: string;
  loteImportacionId: string | null;
}

export interface HojaVida {
  equipo: Equipo;
  mantenimientos: Mantenimiento[];
}

export interface RecursoSubcategoria {
  id: number;
  tipoPrincipal: string;
  nombreSubcategoria: string;
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

export const getHojaVidaEquipo = async (id: string): Promise<HojaVida> => {
  const response = await axios.get<HojaVida>(`${BASE_URL}/equipos/${id}/hoja-vida`);
  return response.data;
};

export const actualizarEquipo = async (id: string, dto: ActualizarEquipoDto): Promise<Equipo> => {
  const response = await axios.put<Equipo>(`${BASE_URL}/equipos/${id}`, dto);
  return response.data;
};

export const eliminarEquipo = async (id: string): Promise<void> => {
  await axios.delete(`${BASE_URL}/equipos/${id}`);
};

export const obtenerSubcategoriasRecursos = async (tipoPrincipal: string): Promise<RecursoSubcategoria[]> => {
  const response = await axios.get<RecursoSubcategoria[]>(`${BASE_URL}/recursos/subcategorias/${tipoPrincipal}`);
  return response.data;
};
