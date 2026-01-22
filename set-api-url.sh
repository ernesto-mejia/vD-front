#!/bin/zsh
# Script para reemplazar el marcador __API_URL__ en el index.html del build
# Uso: ./set-api-url.sh <API_URL>

API_URL="$1"
INDEX_FILE="dist/angular_18_login_with_local_storage/browser/index.html"

if [ -z "$API_URL" ]; then
  echo "Uso: $0 <API_URL>"
  exit 1
fi

if [ ! -f "$INDEX_FILE" ]; then
  echo "No se encontró $INDEX_FILE. ¿Ya ejecutaste el build?"
  exit 1
fi

sed -i '' "s|__API_URL__|$API_URL|g" "$INDEX_FILE"
echo "API_URL actualizado a $API_URL en $INDEX_FILE"
