# AuroraOS - Sistema Operativo Interfaz

**AuroraOS** es una interfaz de escritorio inspirada en sistemas operativos modernos, desarrollado como proyecto final para la materia **Sistemas de Operación** del 7mo semestre de la Universidad José Antonio Páez.

## Descripción

AuroraOS es una aplicación de escritorio construida con tecnologías web (React + TypeScript + Vite) que simula un entorno de sistema operativo con:
- Menú de aplicaciones (App Drawer)
- Dock inferior
- Barra de estado
- Configuración del sistema
- Múltiples aplicaciones integradas

## Tecnologías Utilizadas

- **React 19** con TypeScript
- **Vite** como bundler de desarrollo
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Zustand** para manejo de estado
- **React Compiler** (optimizaciones experimentales)
- **Electron** para ejecución como aplicación de escritorio

## Estructura del Proyecto

```
aurora-os/
├── src/                    # Código fuente de React
│   ├── components/         # Componentes UI
│   │   ├── apps/          # Aplicaciones integradas
│   │   └── shell/         # Componentes del shell (barra, dock, etc.)
│   ├── stores/            # Stores Zustand (state management)
│   ├── core/              # Módulos principales (battery, storage, etc.)
│   └── App.tsx            # Punto de entrada principal
├── electron/              # Configuración y entrada de Electron
├── package.json           # Dependencias y scripts
├── vite.config.ts         # Configuración de Vite
└── tailwind.config.js     # Configuración de Tailwind
```

## Scripts Disponibles

En la raíz del proyecto (`aurora-os/`):

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el modo desarrollo con Vite |
| `npm run build` | Construye la aplicación para producción |
| `npm run lint` | Ejecuta el linter Oxlint |
| `npm run preview` | Vista previa de la build de producción |
| `npm run desktop` | Construye y ejecuta la aplicación Electron |
| `npm run desktop:dev` | Ejecuta Electron en modo desarrollo |

## Cómo Ejecutar el Proyecto

### 1. Instalación de dependencias

```bash
cd aurora-os
npm install
```

### 2. Modo Desarrollo

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo de Vite en `http://localhost:5173`. La aplicación se recargará automáticamente al hacer cambios.

### 3. Ejecutar como aplicación de escritorio (Electron)

```bash
npm run desktop
```

O en modo desarrollo:

```bash
npm run desktop:dev
```

Esto compilará la aplicación y la abrirá en una ventana de Electron.

### 4. Build de Producción

```bash
npm run build
```

Esto generará los archivos optimizados en la carpeta `dist/`.

## Verificación del .gitignore

El archivo `.gitignore` existente está adecuadamente configurado para un proyecto React + TypeScript + Electron:

✅ **Incluye:**
- `node_modules/` - Dependencias instaladas
- `dist/` - Build de producción
- `*.log` - Archivos de log de npm/yarn
- Directorios de editores (`/.vscode/`, `/.idea/`, `/.DS_Store`)
- Archivos de solución de Visual Studio/Soluciones

✅ **Buenas prácticas:**
- Excluye logs de depuración
- Mantiene separada la configuración del editor
- No versiona archivos build generados

El .gitignore es suficiente y no requiere modificaciones para este proyecto.

## Licencia

Este proyecto es para fines educativos de la materia Sistemas de Operación, Universidad José Antonio Páez, 7mo semestre.