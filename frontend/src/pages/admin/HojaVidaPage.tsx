import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { getHojaVidaEquipo } from '../../services/inventarioService';
import type { HojaVida } from '../../services/inventarioService';

export const HojaVidaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hojaVida, setHojaVida] = useState<HojaVida | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarHojaVida = async () => {
      const equipoId = Number(id);

      if (!id || Number.isNaN(equipoId)) {
        setError('Identificador de equipo inválido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getHojaVidaEquipo(equipoId);
        setHojaVida(data);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        if (axiosError.response?.status === 404) {
          setError(axiosError.response.data.message ?? 'Equipo no encontrado');
        } else {
          setError('No se pudo cargar la hoja de vida del equipo.');
        }
      } finally {
        setLoading(false);
      }
    };

    cargarHojaVida();
  }, [id]);

  const formatDate = (value: string) => new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(new Date(`${value}T00:00:00`));

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto text-gray-600">Cargando hoja de vida...</div>
      </main>
    );
  }

  if (error || !hojaVida) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white border border-red-200 rounded-lg p-6 text-left">
          <p className="text-red-700 font-semibold">{error ?? 'No se encontró información del equipo.'}</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Volver
          </button>
        </div>
      </main>
    );
  }

  const { equipo, mantenimientos } = hojaVida;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto text-left space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/admin" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
              Volver al panel
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Hoja de vida del activo</h1>
            <p className="text-gray-500">{equipo.marca} {equipo.modelo} - {equipo.numeroSerie}</p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-green-50 text-green-700 px-4 py-2 font-semibold">
            {equipo.estado}
          </span>
        </div>

        <section className="bg-white border border-gray-200 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Información del equipo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoItem label="Marca" value={equipo.marca} />
            <InfoItem label="Modelo" value={equipo.modelo} />
            <InfoItem label="Procesador" value={equipo.procesador} />
            <InfoItem label="Laboratorio" value={equipo.laboratorio} />
            <InfoItem label="Estado" value={equipo.estado} />
            <InfoItem label="Número de serie" value={equipo.numeroSerie} />
            <InfoItem label="Fecha de compra" value={formatDate(equipo.fechaCompra)} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-6">Mantenimientos</h2>

          {mantenimientos.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              Sin mantenimientos registrados
            </div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-blue-100" />
              <div className="space-y-4">
                {mantenimientos.map((mantenimiento) => (
                  <article key={mantenimiento.id} className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                    <span className="absolute -left-5 top-5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-bold text-gray-900">{formatDate(mantenimiento.fechaProgramada)}</h3>
                      <span className="inline-flex w-fit rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-semibold">
                        {mantenimiento.estado}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-3">
                      {mantenimiento.observaciones?.trim() || 'Sin observaciones'}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className="border border-gray-100 bg-gray-50 rounded-lg p-4">
    <p className="text-sm font-semibold text-gray-500">{label}</p>
    <p className="text-gray-900 font-bold mt-1 break-words">{value}</p>
  </div>
);
