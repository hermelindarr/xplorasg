# Cómo está organizada la carpeta

| Carpeta / archivo | Qué contiene |
|---|---|
| `frontend/` | La página web (React). |
| `backend/` | El servidor (API). |
| `database/` | Migraciones y datos iniciales de la base. |
| `content/`, `recursos/` | Fichas extraídas e imágenes fuente. |
| `scripts/` | Utilidades (extraer fichas, generar guías PDF, cPanel). |
| `docs/` | Documentación técnica (sistema de diseño). |
| `documentos/fichas/` | Fichas de lugares y servicios en Word. |
| `documentos/proyecto/` | Bitácora, exposición, idea del proyecto, catálogo de interfaces, gráficas. |
| `documentos/marca/` | Logos, iconografía e imágenes de referencia. |
| `documentos/video/` | Video de las interfaces (642 MB; no se sube a Git). |
| `_historial/` | Respaldos y entregas anteriores (.tar.gz). No se usan para compilar. |
| `docker-compose.yml`, `.env` | Arranque con Docker y configuración (claves: no compartir `.env`). |
| `README.md`, `DEPLOY.md`, `DEPLOY_CPANEL.md`, `SEGURIDAD.md` | Guías de uso, despliegue y seguridad. |

## Compilar y arrancar
En la terminal, dentro de esta carpeta:

```
docker compose up -d --build
```

Luego abre http://localhost:5173
