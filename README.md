Supermercado Monorepo (Backend + Frontend)

Estructura:

- backend: Django + DRF, app `shop` con categorías, productos, configuración del sitio y creación de pedidos.
- frontend: Vite + React + Tailwind, catálogo, carrito en localStorage y checkout con envío a WhatsApp.

Requisitos:

- Python 3.10+
- Node 18+

Backend (Django + DRF)

1) Instalar dependencias:

   pip install -r backend/requirements.txt

2) Configurar variables de entorno (crear `.env` en la raíz o exportar variables):

   DJANGO_SECRET_KEY=please-change-this
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=*
   DJANGO_TIME_ZONE=America/Argentina/Cordoba
   DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   SEED_SUPERUSER_USERNAME=<admin>
   SEED_SUPERUSER_PASSWORD=<password-segura>
   SEED_WHATSAPP_PHONE=+5491111111111
   SEED_ALIAS_OR_CBU=alias.cuenta - Nombre Apellido (Banco) - CUIT 20-00000000-0
   DJANGO_RUN_SEED=False

   CLOUDINARY_CLOUD_NAME=<tu-cloud-name>
   CLOUDINARY_API_KEY=<tu-api-key>
   CLOUDINARY_API_SECRET=<tu-api-secret>

   # Almacenamiento de archivos en S3 (opcional)
   DJANGO_DEFAULT_FILE_STORAGE=storages.backends.s3boto3.S3Boto3Storage
   AWS_ACCESS_KEY_ID=<tu-access-key>
   AWS_SECRET_ACCESS_KEY=<tu-secret-key>
   AWS_STORAGE_BUCKET_NAME=<nombre-del-bucket>
   AWS_S3_REGION_NAME=<region>

3) Migraciones y seed de datos:

   cd backend
   python manage.py migrate

   # Crear superusuario y datos de prueba
   export SEED_SUPERUSER_USERNAME=<admin>
   export SEED_SUPERUSER_PASSWORD=<password-segura>
   python manage.py shell -c "import seed; seed.run()"

4) Ejecutar servidor:

   python manage.py runserver

5) Autenticación y API segura:

   Todos los endpoints de la API requieren autenticación mediante cookies de
   sesión. Un usuario administrador puede obtener credenciales vía el endpoint
   de login de DRF:

   curl -c cookies.txt -X POST -d "username=<admin>&password=<password>" \
        http://localhost:8000/api-auth/login/

   Luego, reutilizar la cookie para consumir la API de forma segura:

   curl -b cookies.txt http://localhost:8000/api/products/

Notas:
- El admin está en /admin. Cargar categorías, productos y la configuración del sitio (SiteConfig) ahí.
- Algunos endpoints administrativos (por ejemplo, la configuración del sitio) requieren
  un usuario con permisos de administrador.
- CORS está habilitado para desarrollo (localhost:5173). Ajustar con la variable `DJANGO_CORS_ALLOWED_ORIGINS` si es necesario.

Frontend (Vite + React + Tailwind)

1) Instalar dependencias:

   cd frontend
   npm install

2) Configurar variables de entorno (crear `.env`):

   VITE_API_URL=http://localhost:8000/api
   VITE_WHATSAPP_PHONE=5493511234567

3) Ejecutar en desarrollo:

   npm run dev

Despliegue automático:

- El flujo de trabajo `deploy-frontend.yml` publica el contenido de `frontend/dist`
  en GitHub Pages cada vez que se hace push a la rama `main`.

- El flujo `deploy-backend.yml` construye la imagen de Docker y la despliega en
  Railway usando la CLI. Para que funcione, crea un proyecto en Railway,
  vincúlalo con `railway init` y añade el token como secreto `RAILWAY_TOKEN` en
  GitHub. Define también en Railway las variables `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` para que Django pueda
  autenticarse contra Cloudinary.


Flujo de uso del MVP

- Home: lista categorías y productos con búsqueda y filtro por categoría; se pueden agregar productos al carrito.
- Carrito: se persiste en localStorage.
- Checkout: completar datos y método de pago; al confirmar se crea el pedido en /api/orders/ y se abre WhatsApp con un mensaje prellenado con el detalle.

## Seguridad y HTTPS

Para entornos de producción, el archivo `backend/supermercado/settings.py` permite ajustar opciones de seguridad mediante variables de entorno:

- `DJANGO_SECURE_SSL_REDIRECT`: redirige tráfico HTTP a HTTPS.
- `DJANGO_SECURE_HSTS_SECONDS`: segundos para HSTS (ej. `31536000`).
- `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS` y `DJANGO_SECURE_HSTS_PRELOAD`: activar en despliegues HTTPS.
- `DJANGO_SESSION_COOKIE_SECURE` y `DJANGO_CSRF_COOKIE_SECURE`: marcan cookies como seguras.
- `DJANGO_X_FRAME_OPTIONS`: política de `X-Frame-Options` (`DENY` por defecto).
- `DJANGO_SECURE_CONTENT_TYPE_NOSNIFF`: evita inferencia de tipos de contenido.
- `DJANGO_SECURE_REFERRER_POLICY`: política de referrer (`same-origin` por defecto).

Ajustar estos valores según el entorno (desarrollo o producción) para reforzar la seguridad.
