import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, Briefcase, MapPin, Calendar, Flag } from 'lucide-react';

const ETAPAS_ORDEN = {
  'antes_primer_dia': { label: 'Antes del primer día', order: 1 },
  'primer_dia': { label: 'Primer día', order: 2 },
  'primera_semana': { label: 'Primera semana', order: 3 },
  'primer_mes': { label: 'Primer mes', order: 4 }
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empleado, setEmpleado] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEtapas, setExpandedEtapas] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: emp, error: errEmp } = await supabase.from('empleados').select('*').eq('id', id).single();
      if (errEmp) throw errEmp;
      setEmpleado(emp);

      const { data: ts, error: errTs } = await supabase.from('tareas_onboarding').select('*').eq('empleado_id', id);
      if (errTs) throw errTs;
      setTareas(ts);

      // Expand all stages by default
      const allEtapas = [...new Set(ts.map(t => t.etapa))];
      const initialExpanded = {};
      allEtapas.forEach(e => initialExpanded[e] = true);
      setExpandedEtapas(initialExpanded);

    } catch (err) {
      console.error(err);
      alert('Error cargando empleado');
    } finally {
      setLoading(false);
    }
  }

  const toggleEtapa = (etapa) => {
    setExpandedEtapas(prev => ({ ...prev, [etapa]: !prev[etapa] }));
  };

  const handleToggleTarea = async (tarea) => {
    const nuevoEstado = tarea.estado === 'completada' ? 'pendiente' : 'completada';
    const fechaComp = nuevoEstado === 'completada' ? new Date().toISOString() : null;

    // Update local state instantly
    setTareas(tareas.map(t => t.id === tarea.id ? { ...t, estado: nuevoEstado, fecha_completado: fechaComp } : t));

    // Update DB
    const { error } = await supabase
      .from('tareas_onboarding')
      .update({ estado: nuevoEstado, fecha_completado: fechaComp })
      .eq('id', tarea.id);

    if (error) {
      console.error(error);
      alert('Error al actualizar tarea');
      fetchData(); // revert
    }
  };

  const handleFinalizar = async () => {
    if (!window.confirm("¿Estás seguro de que quieres finalizar este onboarding? El registro pasará al historial.")) return;
    
    try {
      // 1. Update empleado status
      await supabase.from('empleados').update({ estado: 'finalizado' }).eq('id', id);

      // 2. Insert into history
      await supabase.from('historial_onboardings').insert([{
        empleado_id: empleado.id,
        nombre_empleado: empleado.nombre,
        fecha_cierre: new Date().toISOString().split('T')[0],
        porcentaje_completado: progress
      }]);

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Error al finalizar el onboarding.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!empleado) {
    return <div className="text-center py-12 text-slate-500">Empleado no encontrado</div>;
  }

  const completadas = tareas.filter(t => t.estado === 'completada').length;
  const progress = tareas.length === 0 ? 0 : Math.round((completadas / tareas.length) * 100);

  // Agrupar tareas por etapa
  const tareasPorEtapa = tareas.reduce((acc, tarea) => {
    if (!acc[tarea.etapa]) acc[tarea.etapa] = [];
    acc[tarea.etapa].push(tarea);
    return acc;
  }, {});

  // Ordenar etapas
  const etapasSorted = Object.keys(tareasPorEtapa).sort((a, b) => {
    const orderA = ETAPAS_ORDEN[a]?.order || 99;
    const orderB = ETAPAS_ORDEN[b]?.order || 99;
    return orderA - orderB;
  });

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{empleado.nombre}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
            <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {empleado.cargo}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {empleado.area}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Ingreso: {new Date(empleado.fecha_ingreso).toLocaleDateString()}</span>
          </div>
          
          <button 
            onClick={handleFinalizar}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
          >
            <Flag className="w-4 h-4" /> Finalizar Onboarding
          </button>
        </div>
        
        {/* Progress Circle */}
        <div className="relative w-32 h-32 flex shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={progress === 100 ? "text-green-500 transition-all duration-1000" : "text-primary transition-all duration-1000"}
              strokeWidth="3"
              strokeDasharray={`${progress}, 100`}
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{progress}%</span>
            <span className="text-xs text-slate-500 uppercase font-semibold">Completado</span>
          </div>
        </div>
      </div>

      {/* Tareas List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4 px-1">Checklist de Onboarding</h2>
        
        {etapasSorted.length === 0 ? (
          <p className="text-slate-500 bg-white p-6 rounded-xl border border-slate-200">No hay tareas asignadas a este empleado.</p>
        ) : (
          etapasSorted.map(etapaKey => {
            const tareasEtapa = tareasPorEtapa[etapaKey];
            const isExpanded = expandedEtapas[etapaKey];
            const completadasEtapa = tareasEtapa.filter(t => t.estado === 'completada').length;
            const esCompletadaEtapa = completadasEtapa === tareasEtapa.length;
            
            return (
              <div key={etapaKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleEtapa(etapaKey)}
                  className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                    esCompletadaEtapa ? 'bg-green-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {esCompletadaEtapa ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                      <h3 className="text-lg font-semibold text-slate-800">
                        {ETAPAS_ORDEN[etapaKey]?.label || etapaKey}
                      </h3>
                    </div>
                    <span className="text-sm text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {completadasEtapa}/{tareasEtapa.length}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {tareasEtapa.map(tarea => (
                      <div 
                        key={tarea.id} 
                        className={`p-4 pl-14 flex items-center justify-between transition-colors hover:bg-slate-50/50 ${
                          tarea.estado === 'completada' ? 'bg-slate-50/50 opacity-75' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <button 
                            onClick={() => handleToggleTarea(tarea)}
                            className="shrink-0 text-slate-300 hover:text-primary transition-colors focus:outline-none"
                          >
                            {tarea.estado === 'completada' ? (
                              <CheckCircle2 className="w-6 h-6 text-primary" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>
                          
                          <div className={tarea.estado === 'completada' ? 'line-through text-slate-500' : 'text-slate-700'}>
                            <p className="font-medium text-sm">{tarea.nombre_tarea}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="font-medium bg-slate-200/50 px-2 py-0.5 rounded text-slate-600">
                                {tarea.responsable_tipo}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Vence: {new Date(tarea.fecha_limite).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
