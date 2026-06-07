import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import type { NotificacionDto } from '../services/signalRService';

const API_URL = `${import.meta.env.VITE_NOTIFICACIONES_URL ?? 'http://localhost:5086'}/api/notificaciones`;

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('fisei_token')}` }
});

export const CampanaNotificaciones = () => {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const cargarNotificaciones = useCallback(async () => {
    try {
      setCargando(true);
      const res = await axios.get<NotificacionDto[]>(`${API_URL}/mis-notificaciones`, getHeaders());
      setNotificaciones(res.data);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarNotificaciones();
    const intervalId = window.setInterval(cargarNotificaciones, 30000);

    const refrescar = () => void cargarNotificaciones();
    window.addEventListener('fisei:notificacion-recibida', refrescar);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('fisei:notificacion-recibida', refrescar);
    };
  }, [cargarNotificaciones]);

  useEffect(() => {
    const cerrarAlClickFuera = (event: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', cerrarAlClickFuera);
    return () => document.removeEventListener('mousedown', cerrarAlClickFuera);
  }, []);

  const marcarTodas = async () => {
    const ids = notificaciones.map((n) => n.id);
    if (ids.length === 0) {
      return;
    }

    await axios.patch(`${API_URL}/marcar-leidas`, ids, getHeaders());
    setNotificaciones([]);
  };

  return (
    <div ref={contenedorRef} className="relative z-40">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-800"
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
        </svg>

        {notificaciones.length > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-[11px] font-bold leading-none text-white">
            {notificaciones.length > 99 ? '99+' : notificaciones.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Notificaciones</h3>
            <button
              type="button"
              onClick={marcarTodas}
              disabled={notificaciones.length === 0}
              className="text-xs font-bold text-red-800 disabled:text-slate-300"
            >
              Marcar todas como leidas
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {cargando && notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">Cargando...</p>
            ) : notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No hay notificaciones pendientes.</p>
            ) : (
              notificaciones.map((notificacion) => (
                <Link
                  key={notificacion.id}
                  to={`/mis-mantenimientos?caso=${encodeURIComponent(notificacion.codigoCaso)}`}
                  onClick={() => setAbierto(false)}
                  className="block border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase text-red-800">{notificacion.tipo}</span>
                    <span className="text-xs text-slate-500">{formatearFecha(notificacion.fechaCreacion)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{notificacion.codigoCaso}</p>
                  <p className="mt-1 text-sm text-slate-600">{notificacion.mensaje}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const formatearFecha = (fecha: string | null) => {
  if (!fecha) {
    return '';
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(fecha));
};
