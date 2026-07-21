# OnBoard 360

OnBoard 360 es un aplicativo web moderno diseñado para digitalizar el proceso de onboarding de nuevos empleados. Reemplaza correos y archivos de Excel dispersos por un panel centralizado donde RRHH puede crear planes estructurados, asignar tareas a distintos responsables y hacer seguimiento del avance en tiempo real.

## 🚀 Tecnologías Utilizadas

- **Frontend:** React + Vite
- **Estilos:** Tailwind CSS v4 + `lucide-react` para iconografía
- **Enrutamiento:** React Router DOM
- **Backend/Base de Datos:** Supabase (PostgreSQL)

## ✨ Características Principales

1. **Dashboard General:** Monitorea el progreso (% completado) de todos los nuevos ingresos, visualiza la próxima tarea a vencer y su estado (a tiempo, próxima a vencer, vencida).
2. **Gestión de Plantillas:** Crea y edita planes de onboarding reutilizables por cargo o área (ej. "Onboarding Ventas", "Onboarding General").
3. **Nuevo Onboarding:** Ingresa un nuevo empleado, selecciona su plantilla y el sistema generará automáticamente su checklist con fechas límite calculadas desde su ingreso.
4. **Detalle del Empleado:** Checklist interactivo agrupado por etapas (Antes del primer día, Primer día, etc.). Las tareas pueden ser marcadas como completadas al instante.
5. **Historial:** Registro histórico de todos los procesos de onboarding cerrados, detallando su fecha de cierre y porcentaje de éxito.

## ⚙️ Configuración Local

Si deseas correr este proyecto de forma local:

1. Clona este repositorio:
   ```bash
   git clone https://github.com/valeriacloretor-max/onboard.360.git
   ```
2. Instala las dependencias:
   ```bash
   cd onboard-360
   npm install
   ```
3. Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

El proyecto estará disponible en `http://localhost:5173`.

## 📦 Estructura de la Base de Datos (Supabase)

El proyecto utiliza un esquema relacional con las siguientes tablas:
- `empleados`: Almacena la información de los ingresos activos.
- `plantillas`: Contiene la metadata de los planes base.
- `tareas_plantilla`: Las tareas predeterminadas asignadas a cada plantilla.
- `tareas_onboarding`: Las tareas reales instanciadas para cada empleado específico (con control de estado y fecha límite).
- `historial_onboardings`: Registro final de los empleados que concluyeron su proceso.

---
*Desarrollado como Proyecto Final para IA Aplicada — UCAB, Escuela de Relaciones Industriales. Autora: Valeria Loreto.*
