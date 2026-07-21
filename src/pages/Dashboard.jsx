import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, AlertTriangle, Search } from 'lucide-react';
import { isBefore, isToday, addDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      // Fetch empleados en curso
      const { data: emps, error: errEmps } = await supabase
        .from('empleados')
        .select('*')
        .eq('estado', 'en_curso')
        .order('created_at', { ascending: false });
      
      if (errEmps) throw errEmps;

      // Fetch tareas for progress calculation
      const { data: tareas, error: errTareas } = await supabase
        .from('tareas_onboarding')
        .select('*');

      if (errTareas) throw errTareas;

      // Process data to calculate progress and next task
      const processed = emps.map(emp => {
        const empTareas = tareas.filter(t => t.empleado_id === emp.id);
        const total = empTareas.length;
        const completadas = empTareas.filter(t => t.estado === 'completada').length;
        const progress = total === 0 ? 0 : Math.round((completadas / total) * 100);

        // Find next task (earliest deadline among pending tasks)
        const pendingTareas = empTareas
          .filter(t => t.estado === 'pendiente')
          .sort((a, b) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime());
        
        let proximaTarea = pendingTareas.length > 0 ? pendingTareas[0] : null;
        let estadoColor = 'green';

        if (proximaTarea) {
          const limitDate = new Date(proximaTarea.fecha_limite);
          const today = new Date();
          // Reset time portion for accurate day comparison
          today.setHours(0, 0, 0, 0);
          limitDate.setHours(0,0,0,0);

          if (isBefore(limitDate, today)) {
            estadoColor = 'red';
          } else if (isToday(limitDate) || limitDate.getTime() === addDays(today, 1).getTime()) {
            estadoColor = 'amber';
          }
        }

        return {
          ...emp,
          progress,
          proximaTarea,
          estadoColor
        };
      });

      setEmpleados(processed);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (color) => {
    switch (color) {
      case 'red': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'amber': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Clock className="w-5 h-5 text-green-500" />;
    }
  };

  const getStatusBadge = (color) => {
    switch (color) {
      case 'red': return "bg-red-100 text-red-700 border-red-200";
      case 'amber': return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const filteredEmpleados = empleados.filter(emp => 
    emp.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Vista general del progreso de los nuevos ingresos.</p>
        </div>
        {user?.role === 'admin' && (
          <Link 
            to="/new" 
            className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <span>+ Nuevo Onboarding</span>
          </Link>
        )}
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre completo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
          />
        </div>
      </div>

      {filteredEmpleados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Todo al día</h3>
          <p className="text-slate-500 mb-6">No hay empleados en proceso de onboarding actualmente.</p>
          {user?.role === 'admin' && (
            <Link to="/new" className="text-primary font-medium hover:underline">
              Comenzar un nuevo proceso
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmpleados.map((emp) => (
            <Link 
              key={emp.id} 
              to={user?.role === 'admin' ? `/employee/${emp.id}` : '#'} 
              className={`block group ${user?.role === 'director' ? 'cursor-default' : ''}`}
            >
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-lg font-bold text-slate-900 ${user?.role === 'admin' ? 'group-hover:text-primary transition-colors' : ''}`}>
                      {emp.nombre}
                    </h3>
                    <p className="text-sm text-slate-500">{emp.cargo} • {emp.area}</p>
                  </div>
                  {emp.proximaTarea && (
                    <div className={`border px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusBadge(emp.estadoColor)}`}>
                      {getStatusIcon(emp.estadoColor)}
                      <span>{emp.progress}%</span>
                    </div>
                  )}
                </div>

                <div className="mb-4 flex-1">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600 font-medium">Progreso general</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                        emp.progress === 100 ? 'bg-green-500' : 'bg-primary'
                      }`}
                      style={{ width: `${emp.progress}%` }}
                    ></div>
                  </div>
                </div>

                {emp.proximaTarea ? (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Próxima tarea a vencer</p>
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{emp.proximaTarea.nombre_tarea}</p>
                    <p className={`text-xs mt-1 font-medium ${
                      emp.estadoColor === 'red' ? 'text-red-600' : 
                      emp.estadoColor === 'amber' ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      Límite: {new Date(emp.proximaTarea.fecha_limite).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-green-900">¡Todas las tareas completadas!</p>
                      <p className="text-xs text-green-700 mt-0.5">Listo para finalizar</p>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
