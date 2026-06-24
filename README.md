# SIGA Escolar - Frontend

Stack: React 18 + Vite 5 + Tailwind CSS 3

## Instalación Local
1. Clonar el repo: `git clone https://github.com/MAcevedo91/siga-frontend.git`
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` a `.env.local` y configurar la URL del backend.
4. Levantar servidor: `npm run dev` → http://localhost:5173

## Variables de entorno
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend (ej: `http://localhost:3000/api/v1`) |

## Estructura de carpetas
```
src/
├── assets/        # Imágenes, íconos estáticos
├── components/    # Componentes reutilizables
├── hooks/         # Custom hooks
├── pages/         # Vistas por ruta (LoginPage, DashboardPage, ...)
├── router/        # AppRouter, PrivateRoute
├── services/      # api.js (axios), authService.js
├── store/         # Zustand stores (useAuthStore)
└── utils/         # Funciones utilitarias
```

## Importaciones absolutas
Alias `@/` apunta a `./src/`. Ejemplo:
```js
import { useAuth } from '@/store/useAuthStore'
```

## Scripts
| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en localhost:5173 |
| `npm run build` | Build de producción en `/dist` |
| `npm run preview` | Preview del build |
