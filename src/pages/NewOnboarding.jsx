import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Calendar, Briefcase, MapPin } from 'lucide-react';
import { addDays, format } from 'date-fns';

export default function NewOnboarding() {
  const navigate = useNavigate();
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    area: '',
    fecha_ingreso: format(new Date(), 'yyyy-MM-dd'),
    plantilla_id: ''
  });

  useEffect(() => {
    fetchPlantillas();
  }, []);

  async function fetchPlantillas() {
    const { data, error } = await supabase.from('plantillas').select('id, nombre');
    if (!error && data) {
      setPlantillas(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, plantilla_id: data[0].id }));
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.nombre || !formData.cargo || !formData.area || !formData.fecha_ingreso || !formData.plantilla_id) {
      alert("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Empleado
      const { data: empData, error: empError } = await supabase
        .from('empleados')
        .insert([{
          nombre: formData.nombre,
          cargo: formData.cargo,
          area: formData.area,
          fecha_ingreso: formData.fecha_ingreso,
          plantilla_id: formData.plantilla_id
        }])
        .select()
        .single();
        
      if (empError) throw empError;

      // 2. Fetch template tasks
      const { data: tareasPlantilla, error: tareasError } = await supabase
        .from('tareas_plantilla')
        .select('*')
        .eq('plantilla_id', formData.plantilla_id);
        
      if (tareasError) throw tareasError;

      // 3. Create real tasks for the employee
      const fechaIngresoDate = new Date(formData.fecha_ingreso);
      // Ajustar zona horaria local para que addDays no se desfase por la hora
      fechaIngresoDate.setMinutes(fechaIngresoDate.getMinutes() + fechaIngresoDate.getTimezoneOffset());

      if (tareasPlantilla && tareasPlantilla.length > 0) {
        const tareasReales = tareasPlantilla.map(tp => {
          const limitDate = addDays(fechaIngresoDate, tp.dias_desde_ingreso);
          return {
            empleado_id: empData.id,
            nombre_tarea: tp.nombre_tarea,
            etapa: tp.etapa,
            responsable_tipo: tp.responsable_tipo,
            fecha_limite: format(limitDate, 'yyyy-MM-dd')
          };
        });

        const { error: insertError } = await supabase
          .from('tareas_onboarding')
          .insert(tareasReales);
          
        if (insertError) throw insertError;
      }

      // Success
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al crear el onboarding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Nuevo Onboarding</h1>
        <p className="text-slate-500 mt-1">Registra a un nuevo empleado y asígnale un plan de trabajo.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            
            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Información del Empleado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Cargo
                  </label>
                  <input 
                    type="text" 
                    value={formData.cargo}
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Ej. Analista de Marketing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Área / Departamento
                  </label>
                  <input 
                    type="text" 
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Ej. Comercial"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Configuración del Plan */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Plan de Onboarding
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Ingreso</label>
                  <input 
                    type="date" 
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Las fechas límite se calcularán a partir de este día.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Plantilla a utilizar</label>
                  <select 
                    value={formData.plantilla_id}
                    onChange={(e) => setFormData({...formData, plantilla_id: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    {plantillas.length === 0 && <option value="">No hay plantillas disponibles</option>}
                    {plantillas.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-light text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Guardando...' : 'Crear Onboarding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
