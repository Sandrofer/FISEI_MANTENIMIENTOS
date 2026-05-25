import axios from 'axios';
import type { LoginRequest, LoginResponse } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const login = async (datos: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, datos);
  return response.data;
};
