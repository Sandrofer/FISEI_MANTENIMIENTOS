import axios from 'axios';

const API_URL = 'http://localhost:5260/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
});

export const getUsuarios = async (pagina = 1, tamano = 10) => {
  const res = await axios.get(`${API_URL}/usuarios?pagina=${pagina}&tamano=${tamano}`, getHeaders());
  return res.data;
};

export const crearUsuario = async (datos: {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  rol: string;
}) => {
  const res = await axios.post(`${API_URL}/usuarios`, datos, getHeaders());
  return res.data;
};

export const actualizarRol = async (id: number, rol: string) => {
  const res = await axios.put(`${API_URL}/usuarios/${id}/rol`, { rol }, getHeaders());
  return res.data;
};