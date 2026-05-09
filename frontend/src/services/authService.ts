import axios from 'axios';
import type { LoginRequest, LoginResponse } from '../types/auth';

const API_URL = 'http://localhost:5260/api';

export const login = async (datos: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, datos);
  return response.data;
};