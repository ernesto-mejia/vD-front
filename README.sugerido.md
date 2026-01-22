# Epyca Frontend

## Requisitos previos
- Node.js 22.x ([descargar](https://nodejs.org/en/download/))
- Angular CLI 18.x
- Acceso a los scripts de despliegue y configuración (`set-api-url.sh`, `deploy-dev.sh`)

## Instalación
```sh
npm install -g @angular/cli@18.2.13
npm install
```

## Scripts disponibles
| Comando                | Descripción                                                        |
|-----------------------|--------------------------------------------------------------------|
| npm run start:local   | Inicia el servidor local usando el backend local (proxy.conf.json)   |
| npm run start:dev     | Inicia el servidor usando el backend remoto de desarrollo            |
| npm run build         | Compila la app para producción                                      |
| npm run test          | Ejecuta pruebas unitarias                                           |
| npm run lint          | Linting del código                                                  |
| ./deploy-dev.sh       | Despliega a Firebase (dev)                                          |
| ./set-api-url.sh URL  | Cambia la URL base del backend en el build productivo               |

## Uso en diferentes ambientes
- **Local:** `npm run start:local` (usa backend local)
- **Desarrollo:** `npm run start:dev` (usa backend remoto de desarrollo)
- **Producción:**
  1. `npm run build`
  2. `./set-api-url.sh <URL_BACKEND>`
  3. Despliega el contenido de `dist/` a tu hosting

## Configuración dinámica del endpoint de backend
El endpoint de la API se define en tiempo de ejecución usando `window._API_URL` en `index.html`. El script `set-api-url.sh` reemplaza el marcador por la URL deseada después del build.

## Dependencias principales
- `chart.js`: Gráficas y visualizaciones
- `sweetalert`: Alertas personalizadas
- `datatables.net`: Tablas avanzadas
- `angularx-qrcode`: Generación de QR
- `jspdf`, `jspdf-autotable`: Exportación a PDF
- `xlsx`: Exportación a Excel

## Testing
- Pruebas unitarias: `npm run test`
- Pruebas end-to-end: `ng e2e` (requiere configuración adicional)

## Troubleshooting
- Si tienes errores de presupuesto de build, ajusta la sección `budgets` en `angular.json`.
- Si necesitas cambiar la versión de Angular CLI, usa:
  ```sh
  npm install -g @angular/cli@18.2.13 --force
  ```

## Notas adicionales
- El script `set-api-url.sh` requiere permisos de ejecución: `chmod +x set-api-url.sh`
- Puedes cambiar la URL del backend tantas veces como quieras antes de desplegar.
- El flujo es compatible con integración continua y cualquier entorno.

---

> Para más ayuda, consulta la [documentación oficial de Angular CLI](https://angular.io/cli).
