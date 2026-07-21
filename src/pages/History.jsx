import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { History as HistoryIcon, Search, CheckCircle2 } from 'lucide-react';

export default function History() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorial();
  }, []);

  async function fetchHistorial() {
    setLoading(true);
    const { data, error } = await supabase
      .from('historial_onboardings')
      .select('*')
      .order('fecha_cierre', { ascending: false });
      
    if (!error && data) {
      setHistorial(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Historial</h1>
          <p className="text-slate-500 mt-1">Registro de onboardings finalizados.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar empleado..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>

        {historial.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HistoryIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay historial</h3>
            <p className="text-slate-500">Aún no se ha finalizado ningún proceso de onboarding.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="px-6 py-4">Empleado</th>
                  <th className="px-6 py-4">Fecha de Cierre</th>
                  <th className="px-6 py-4">% Completado</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map((registro) => (
                  <tr key={registro.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {registro.nombre_empleado}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(registro.fecha_cierre).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full ${registro.porcentaje_completado === 100 ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${registro.porcentaje_completado}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{registro.porcentaje_completado}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {registro.porcentaje_completado === 100 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Exitoso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          Incompleto
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
