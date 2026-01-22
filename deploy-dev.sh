#!/bin/zsh
# Script para automatizar el build y deploy a Firebase desde la rama actual

set -e

# 1. Limpiar el build anterior
BUILD_DIR="dist/angular_18_login_with_local_storage"
echo "Limpiando build anterior..."
rm -rf "$BUILD_DIR"

# 2. Construir el proyecto Angular en modo producción
echo "Construyendo el proyecto Angular..."
npm run build --prod

# 3. Verificar que la carpeta de salida existe
if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: No se encontró la carpeta de build $BUILD_DIR."
  exit 1
fi

echo "Build generado en $BUILD_DIR."

# 4. Setear el endpoint del backend
echo "Introduce la URL del backend (ejemplo: https://epica-labs-backend-dev-sbn8dy.laravel.cloud/api/):"
read API_URL
if [ -z "$API_URL" ]; then
  echo "Debes ingresar una URL válida."
  exit 1
fi
./set-api-url.sh "$API_URL"

# 5. (Opcional) Mostrar los archivos generados
echo "Archivos generados:"
ls -lh $BUILD_DIR/browser

# 6. Desplegar a Firebase Hosting (requiere firebase-tools instalado y login previo)
echo "¿Deseas desplegar a Firebase ahora? (y/n)"
read respuesta
if [[ "$respuesta" == "y" ]]; then
  firebase deploy --only hosting --project "epica-dev"
else
  echo "Puedes desplegar manualmente con:"
  echo "firebase deploy --only hosting --project epica-dev"
fi
