import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Plus, Trash2, Edit2, Copy, Save, X } from 'lucide-react';

const ETAPAS = [
  { id: 'antes_primer_dia', label: 'Antes del primer día' },
  { id: 'primer_dia', label: 'Primer día' },
  { id: 'primera_semana', label: 'Primera semana' },
  { id: 'primer_mes', label: 'Primer mes' }
];

const RESPONSABLES = ['RRHH', 'Supervisor', 'Empleado'];

export default function Templates() {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', cargo_area: '' });
  const [tareas, setTareas] = useState([]);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchPlantillas();
  }, []);

  async function fetchPlantillas() {
    setLoading(true);
    const { data, error } = await supabase.from('plantillas').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setPlantillas(data);
    }
    setLoading(false);
  }

  async function loadPlantillaDetails(id) {
    setLoading(true);
    const plantilla = plantillas.find(p => p.id === id);
    if (plantilla) {
      setFormData({ nombre: plantilla.nombre, cargo_area: plantilla.cargo_area });
      const { data, error } = await supabase.from('tareas_plantilla').select('*').eq('plantilla_id', id).order('dias_desde_ingreso');
      if (!error && data) {
        setTareas(data);
      }
    }
    setEditingId(id);
    setIsNew(false);
    setLoading(false);
  }

  function handleNewPlantilla() {
    setFormData({ nombre: '', cargo_area: '' });
    setTareas([
      { id: 'temp-1', nombre_tarea: 'Firmar contrato', etapa: 'antes_primer_dia', responsable_tipo: 'RRHH', dias_desde_ingreso: -3 },
      { id: 'temp-2', nombre_tarea: 'Configurar correo', etapa: 'primer_dia', responsable_tipo: 'Supervisor', dias_desde_ingreso: 0 }
    ]);
    setEditingId('new');
    setIsNew(true);
  }

  function handleDuplicate(id) {
    const plantilla = plantillas.find(p => p.id === id);
    if (!plantilla) return;
    
    setFormData({ nombre: `${plantilla.nombre} (Copia)`, cargo_area: plantilla.cargo_area });
    
    supabase.from('tareas_plantilla').select('*').eq('plantilla_id', id).order('dias_desde_ingreso').then(({data}) => {
      if (data) {
        const copiedTareas = data.map(t => ({...t, id: `temp-${Math.random()}`}));
        setTareas(copiedTareas);
      }
    });
    
    setEditingId('new');
    setIsNew(true);
  }

  async function handleSave() {
    if (!formData.nombre || !formData.cargo_area) {
      alert("Por favor completa el nombre y área de la plantilla.");
      return;
    }

    try {
      let currentPlantillaId = editingId;

      if (isNew) {
        // Create new plantilla
        const { data: newP, error: errP } = await supabase
          .from('plantillas')
          .insert([{ nombre: formData.nombre, cargo_area: formData.cargo_area }])
          .select()
          .single();
        if (errP) throw errP;
        currentPlantillaId = newP.id;
      } else {
        // Update existing plantilla
        const { error: errP } = await supabase
          .from('plantillas')
          .update({ nombre: formData.nombre, cargo_area: formData.cargo_area })
          .eq('id', currentPlantillaId);
        if (errP) throw errP;

        // Delete existing tareas to replace them
        await supabase.from('tareas_plantilla').delete().eq('plantilla_id', currentPlantillaId);
      }

      // Insert all tareas
      const tareasToInsert = tareas.map(t => ({
        plantilla_id: currentPlantillaId,
        nombre_tarea: t.nombre_tarea,
        etapa: t.etapa,
        responsable_tipo: t.responsable_tipo,
        dias_desde_ingreso: t.dias_desde_ingreso
      }));

      if (tareasToInsert.length > 0) {
        const { error: errT } = await supabase.from('tareas_plantilla').insert(tareasToInsert);
        if (errT) throw errT;
      }

      setEditingId(null);
      fetchPlantillas();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la plantilla");
    }
  }

  function addTarea() {
    setTareas([
      ...tareas,
      { id: `temp-${Math.random()}`, nombre_tarea: '', etapa: 'primer_dia', responsable_tipo: 'RRHH', dias_desde_ingreso: 0 }
    ]);
  }

  function updateTarea(id, field, value) {
    setTareas(tareas.map(t => t.id === id ? { ...t, [field]: value } : t));
  }

  function removeTarea(id) {
    setTareas(tareas.filter(t => t.id !== id));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Plantillas</h1>
          <p className="text-slate-500 mt-1">Configura planes de onboarding reutilizables.</p>
        </div>
        {!editingId && (
          <button 
            onClick={handleNewPlantilla}
            className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Crear Plantilla</span>
          </button>
        )}
      </div>

      {editingId ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {isNew ? 'Nueva Plantilla' : 'Editar Plantilla'}
              </h2>
              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la Plantilla</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Ej. Onboarding Comercial"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo / Área de aplicación</label>
                <input 
                  type="text" 
                  value={formData.cargo_area}
                  onChange={(e) => setFormData({...formData, cargo_area: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Ej. Ventas, IT, General..."
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Tareas del Plan</h3>
              <button 
                onClick={addTarea}
                className="text-primary hover:text-primary-light font-medium flex items-center gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" /> Agregar tarea
              </button>
            </div>

            <div className="space-y-3">
              {tareas.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No hay tareas configuradas en esta plantilla.</p>
              ) : (
                tareas.map((tarea, index) => (
                  <div key={tarea.id} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5">
                        <input 
                          type="text" 
                          value={tarea.nombre_tarea}
                          onChange={(e) => updateTarea(tarea.id, 'nombre_tarea', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                          placeholder="Descripción de la tarea"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <select 
                          value={tarea.etapa}
                          onChange={(e) => updateTarea(tarea.id, 'etapa', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                        >
                          {ETAPAS.map(etp => <option key={etp.id} value={etp.id}>{etp.label}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <select 
                          value={tarea.responsable_tipo}
                          onChange={(e) => updateTarea(tarea.id, 'responsable_tipo', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                        >
                          {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeTarea(tarea.id)}
                      className="text-red-400 hover:text-red-600 p-1 shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setEditingId(null)}
                className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantillas.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDuplicate(p.id)}
                    className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-lg hover:bg-primary/5"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => loadPlantillaDetails(p.id)}
                    className="p-2 text-slate-400 hover:text-amber-500 transition-colors bg-slate-50 rounded-lg hover:bg-amber-50"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{p.nombre}</h3>
              <p className="text-slate-500 text-sm mb-4">Para: <span className="font-medium text-slate-700">{p.cargo_area}</span></p>
              
              <div className="text-sm font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-lg inline-block">
                Plantilla activa
              </div>
            </div>
          ))}

          {plantillas.length === 0 && !loading && (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay plantillas</h3>
              <p className="text-slate-500 mb-6">Crea tu primera plantilla para estandarizar tus procesos de onboarding.</p>
              <button onClick={handleNewPlantilla} className="text-primary font-medium hover:underline">
                Crear Plantilla
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
