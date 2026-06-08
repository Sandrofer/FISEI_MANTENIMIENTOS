import type { LoginResponse } from '../types/auth';

const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:5260';
const STORAGE_TOKEN_KEY = 'fisei_token';
const STORAGE_NAME_KEY = 'fisei_nombre';
const STORAGE_ROLE_KEY = 'fisei_rol';
export const FORCE_REAUTH_STORAGE_KEY = 'fisei_force_reauth';

export const getAuthLoginUrl = (forceReauth = false): string => {
  const url = new URL(`${AUTH_URL}/api/auth/microsoft/login`);

  if (forceReauth) {
    url.searchParams.set('prompt', 'login');
  }

  return url.toString();
};

export const authLoginUrl = getAuthLoginUrl();

export const handleMicrosoftCallback = async (): Promise<LoginResponse> => {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const message = params.get('message');
  const token = params.get('token');

  if (error) {
    throw new Error(message ?? 'No se pudo completar el inicio de sesion.');
  }

  if (!token) {
    throw new Error('Token de autenticacion no encontrado en la URL.');
  }

  const payload = parseJwt(token);
  const fullName = payload.fullName ?? payload.name ?? '';
  const role = payload.role ?? payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ?? '';

  if (!fullName || !role) {
    throw new Error('El token de autenticacion no contiene los datos necesarios.');
  }

  localStorage.setItem(STORAGE_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_NAME_KEY, fullName);
  localStorage.setItem(STORAGE_ROLE_KEY, role);

  return {
    token,
    nombre: fullName,
    rol: role
  };
};

const parseJwt = (token: string): Record<string, any> => {
  const [, payload] = token.split('.');
  if (!payload) return {};

  try {
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(
      decoded.split('').map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join('')
    ));
  } catch {
    return {};
  }
};

export const getStoredToken = (): string | null => localStorage.getItem(STORAGE_TOKEN_KEY);
export const getStoredUserName = (): string | null => localStorage.getItem(STORAGE_NAME_KEY);
export const getStoredUserRole = (): string | null => localStorage.getItem(STORAGE_ROLE_KEY);
export const clearAuthStorage = (): void => {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_NAME_KEY);
  localStorage.removeItem(STORAGE_ROLE_KEY);
};
