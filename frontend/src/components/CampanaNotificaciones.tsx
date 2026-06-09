import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import type { NotificacionDto } from '../services/signalRService';

const API_URL = `${import.meta.env.VITE_NOTIFICACIONES_URL ?? 'http://localhost:5086'}/api/notificaciones`;

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('fisei_token')}` }
});

interface CampanaNotificacionesProps {
  destino?: string;
}

export const CampanaNotificaciones = ({ destino = '/mis-mantenimientos' }: CampanaNotificacionesProps) => {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [vista, setVista] = useState<'pendientes' | 'historial'>('pendientes');
  const contenedorRef = useRef<HTMLDivElement>(null);

  const pendientes = notificaciones.filter((notificacion) => !notificacion.leido);
  const notificacionesVisibles = vista === 'pendientes' ? pendientes : notificaciones;

  const cargarNotificaciones = useCallback(async () => {
    try {
      setCargando(true);
      const res = await axios.get<NotificacionDto[]>(`${API_URL}/historial`, getHeaders());
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
    const ids = pendientes.map((n) => n.id);
    if (ids.length === 0) {
      return;
    }

    await axios.patch(`${API_URL}/marcar-leidas`, ids, getHeaders());
    const ahora = new Date().toISOString();
    setNotificaciones((actuales) => actuales.map((notificacion) => (
      ids.includes(notificacion.id)
        ? { ...notificacion, leido: true, fechaLectura: ahora }
        : notificacion
    )));
  };

  const abrirNotificacion = async (notificacion: NotificacionDto) => {
    setAbierto(false);
    if (notificacion.leido) {
      return;
    }

    const ahora = new Date().toISOString();
    setNotificaciones((actuales) => actuales.map((n) => (
      n.id === notificacion.id ? { ...n, leido: true, fechaLectura: ahora } : n
    )));

    try {
      await axios.patch(`${API_URL}/marcar-leidas`, [notificacion.id], getHeaders());
    } catch (error) {
      console.error('No se pudo marcar la notificacion como leida', error);
      void cargarNotificaciones();
    }
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

        {pendientes.length > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-[11px] font-bold leading-none text-white">
            {pendientes.length > 99 ? '99+' : pendientes.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notificaciones</h3>
              <p className="text-xs text-slate-500">{pendientes.length} pendientes</p>
            </div>
            <button
              type="button"
              onClick={marcarTodas}
              disabled={pendientes.length === 0}
              className="text-xs font-bold text-red-800 disabled:text-slate-300"
            >
              Marcar todas como leidas
            </button>
          </div>

          <div className="grid grid-cols-2 border-b border-slate-100 p-2">
            <button
              type="button"
              onClick={() => setVista('pendientes')}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${vista === 'pendientes' ? 'bg-red-50 text-red-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setVista('historial')}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${vista === 'historial' ? 'bg-red-50 text-red-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Historial
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {cargando && notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">Cargando...</p>
            ) : notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No hay notificaciones registradas.</p>
            ) : notificacionesVisibles.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No hay notificaciones pendientes.</p>
            ) : (
              notificacionesVisibles.map((notificacion) => (
                <Link
                  key={notificacion.id}
                  to={`${destino}?caso=${encodeURIComponent(notificacion.codigoCaso)}&equipo=${encodeURIComponent(notificacion.equipoId)}`}
                  onClick={() => void abrirNotificacion(notificacion)}
                  className={`block border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${notificacion.leido ? 'bg-white' : 'bg-red-50/40'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xs font-bold uppercase ${notificacion.leido ? 'text-slate-500' : 'text-red-800'}`}>
                      {notificacion.tipo}
                    </span>
                    <span className="text-xs text-slate-500">{formatearFecha(notificacion.fechaCreacion)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{notificacion.codigoCaso}</p>
                  <p className="mt-1 text-sm text-slate-600">{notificacion.mensaje}</p>
                  {notificacion.leido && notificacion.fechaLectura && (
                    <p className="mt-2 text-xs text-slate-400">Leida: {formatearFecha(notificacion.fechaLectura)}</p>
                  )}
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
