import { useState } from 'react';
import { registrarEquipo } from '../../services/inventarioService';
import type { CrearEquipoDto, EquipoResponse } from '../../services/inventarioService';

export default function RegistrarEquipoPage() {
  const [form, setForm] = useState<CrearEquipoDto>({
    numeroSerie: '',
    marca: '',
    modelo: '',
    procesador: '',
    laboratorio: '',
    fechaCompra: '',
  });

  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState<EquipoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExito(null);

    try {
      const resultado = await registrarEquipo(form);
      setExito(resultado);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(`⚠️ ${err.response.data.mensaje}`);
      } else {
        setError('❌ Error al registrar el equipo. Intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Registrar Equipo</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
            <input name="numeroSerie" value={form.numeroSerie} onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: DELL-001" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Marca</label>
            <input name="marca" value={form.marca} onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Dell" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Modelo</label>
            <input name="modelo" value={form.modelo} onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Inspiron 15" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Procesador</label>
            <input name="procesador" value={form.procesador} onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Intel Core i5" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Laboratorio</label>
            <select name="laboratorio" value={form.laboratorio} onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
              <option value="">Seleccione un laboratorio</option>
              <option value="Laboratorio 1">Laboratorio 1</option>
              <option value="Laboratorio 2">Laboratorio 2</option>
              <option value="Laboratorio 3">Laboratorio 3</option>
              <option value="Laboratorio 4">Laboratorio 4</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Compra</label>
            <input name="fechaCompra" type="date" value={form.fechaCompra} onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50">
            {loading ? 'Registrando...' : 'Registrar Equipo'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {exito && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <p className="font-semibold">✅ Equipo registrado exitosamente</p>
            <p className="text-sm mt-1">Serie: {exito.numeroSerie} — {exito.marca} {exito.modelo}</p>
            <p className="text-sm font-medium mt-2">Mantenimientos programados:</p>
            <ul className="text-sm list-disc list-inside">
              {exito.mantenimientos.map(m => (
                <li key={m.id}>{m.fechaProgramada} — {m.estado}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}