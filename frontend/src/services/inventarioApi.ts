import axios from 'axios';
import { getStoredToken } from './authService';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/inventario`;

const api = axios.create({
  baseURL: BASE_URL
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ErrorImportacion {
  fila: number;
  campo: string;
  mensaje: string;
}

export interface ImportacionEquiposResponse {
  success: boolean;
  loteImportacionId?: string | null;
  totalImportados: number;
  errores: ErrorImportacion[];
}

export interface FilaPreview {
  fila: number;
  codigoInventario: string;
  numeroSerie: string;
  nombreModelo: string;
  categoria: string;
  marca: string;
  ubicacion: string;
  estado: string;
}

export interface ResumenValidacion {
  success: boolean;
  mensaje?: string;
  totalFilas: number;
  totalFilasValidas: number;
  totalFilasConErrores: number;
  previsualizacion: FilaPreview[];
  errores: ErrorImportacion[];
  categoriasFaltantes: string[];
  marcasFaltantes: string[];
  ubicacionesFaltantes: string[];
}

export const descargarPlantillaEquipos = async (): Promise<void> => {
  const response = await api.get<Blob>('/plantilla', { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla_equipos.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const validarImportacionExcel = async (archivo: File): Promise<ResumenValidacion> => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  try {
    const response = await api.post<ResumenValidacion>('/equipos/validar-importacion', formData);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
       return error.response.data as ResumenValidacion;
    }
    throw error;
  }
};

export const importarEquipos = async (archivo: File, importacionParcial: boolean, autoCrear: boolean): Promise<ImportacionEquiposResponse> => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('importacionParcial', String(importacionParcial));
  formData.append('autoCrear', String(autoCrear));

  try {
    const response = await api.post<ImportacionEquiposResponse>('/equipos/importar', formData);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return normalizarRespuestaError(error.response.data);
    }

    throw error;
  }
};

const normalizarRespuestaError = (data: any): ImportacionEquiposResponse => {
  if (Array.isArray(data?.errores)) {
    return {
      success: Boolean(data.success),
      loteImportacionId: data.loteImportacionId ?? null,
      totalImportados: data.totalImportados ?? 0,
      errores: data.errores
    };
  }

  return {
    success: false,
    totalImportados: 0,
    errores: [
      {
        fila: 0,
        campo: 'Archivo',
        mensaje: data?.mensaje ?? 'No se pudo procesar el archivo.'
      }
    ]
  };
};
