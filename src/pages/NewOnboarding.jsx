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
    plantillas_ids: []
  });

  useEffect(() => {
    fetchPlantillas();
  }, []);

  async function fetchPlantillas() {
    const { data, error } = await supabase.from('plantillas').select('id, nombre');
    if (!error && data) {
      setPlantillas(data);
    }
  }

  const togglePlantilla = (id) => {
    setFormData(prev => {
      const isSelected = prev.plantillas_ids.includes(id);
      return {
        ...prev,
        plantillas_ids: isSelected 
          ? prev.plantillas_ids.filter(pId => pId !== id)
          : [...prev.plantillas_ids, id]
      };
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.nombre || !formData.cargo || !formData.area || !formData.fecha_ingreso || formData.plantillas_ids.length === 0) {
      alert("Por favor completa todos los campos y selecciona al menos una plantilla.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Empleado (omitimos plantilla_id ya que ahora son múltiples y la FK es opcional en la DB)
      const { data: empData, error: empError } = await supabase
        .from('empleados')
        .insert([{
          nombre: formData.nombre,
          cargo: formData.cargo,
          area: formData.area,
          fecha_ingreso: formData.fecha_ingreso
        }])
        .select()
        .single();
        
      if (empError) throw empError;

      // 2. Fetch template tasks para TODAS las plantillas seleccionadas
      const { data: tareasPlantilla, error: tareasError } = await supabase
        .from('tareas_plantilla')
        .select('*')
        .in('plantilla_id', formData.plantillas_ids);
        
      if (tareasError) throw tareasError;

      // 3. Create real tasks for the employee
      const fechaIngresoDate = new Date(formData.fecha_ingreso);
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Plantillas a utilizar (Puedes seleccionar varias)</label>
                  <div className="w-full border border-slate-300 rounded-lg max-h-48 overflow-y-auto bg-slate-50 p-2 space-y-1">
                    {plantillas.length === 0 && <p className="text-sm text-slate-500 p-2">No hay plantillas disponibles</p>}
                    {plantillas.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                        <input 
                          type="checkbox" 
                          checked={formData.plantillas_ids.includes(p.id)}
                          onChange={() => togglePlantilla(p.id)}
                          className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-slate-700">{p.nombre}</span>
                      </label>
                    ))}
                  </div>
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
