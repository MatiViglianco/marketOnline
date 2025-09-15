# Naranja Autoservicio

Una tienda online pensada para que cualquiera pueda comprar productos de manera simple y rápida. 
No hace falta saber de programación: solo entrás, elegís lo que necesitás y enviás tu pedido.

## ¿Qué puedes hacer en la página?

- **Explorar el catálogo:** productos organizados por categorías.
- **Buscar fácilmente:** encontrá artículos al instante con la barra de búsqueda.
- **Armar tu carrito:** los productos se guardan aunque cierres la página.
- **Finalizar la compra:** completá tus datos y elegí la forma de pago; el pedido se envía a WhatsApp listo para confirmar.
- **Panel de administración:** quienes gestionan el negocio pueden cargar productos y revisar pedidos.

## Cómo usarla

1. Entrá a la página principal.
2. Navegá por las categorías o utilizá el buscador.
3. Agregá los productos que quieras al carrito.
4. Desde el carrito, hacé clic en **Finalizar compra**.
5. Completá tus datos y confirmá; se abrirá WhatsApp con el mensaje del pedido.

---

## Guía para desarrolladores

Naranja Autoservicio es un monorepo con backend en **Django + DRF** y frontend en **Vite + React + Tailwind**.

### Requisitos

- Python 3.10+
- Node 18+

### Backend

1. Instalar dependencias:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Configurar variables de entorno (crear `.env` o exportar variables):
   ```bash
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
   # Opcional: almacenamiento en S3
   DJANGO_DEFAULT_FILE_STORAGE=storages.backends.s3boto3.S3Boto3Storage
   AWS_ACCESS_KEY_ID=<tu-access-key>
   AWS_SECRET_ACCESS_KEY=<tu-secret-key>
   AWS_STORAGE_BUCKET_NAME=<nombre-del-bucket>
   AWS_S3_REGION_NAME=<region>
   ```
3. Migraciones y datos iniciales:
   ```bash
   cd backend
   python manage.py migrate
   export SEED_SUPERUSER_USERNAME=<admin>
   export SEED_SUPERUSER_PASSWORD=<password-segura>
   python manage.py shell -c "import seed; seed.run()"
   ```
4. Ejecutar servidor:
   ```bash
   python manage.py runserver
   ```
5. Autenticación y API segura:
   ```bash
   curl -c cookies.txt -X POST -d "username=<admin>&password=<password>" http://localhost:8000/api-auth/login/
   curl -b cookies.txt http://localhost:8000/api/products/
   ```

### Frontend

1. Instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Configurar variables de entorno (crear `.env`):
   ```bash
   VITE_API_URL=http://localhost:8000/api
   VITE_WHATSAPP_PHONE=5493511234567
   ```
3. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

### Despliegue automático

- `deploy-frontend.yml` publica `frontend/dist` en GitHub Pages al hacer push a `main`.
- `deploy-backend.yml` construye la imagen de Docker y la despliega en Railway. Configurá el proyecto con `railway init` y añadí el token como secreto `RAILWAY_TOKEN` en GitHub.

### Seguridad y HTTPS

Para producción, `backend/supermercado/settings.py` permite ajustar opciones de seguridad mediante variables de entorno:

- `DJANGO_SECURE_SSL_REDIRECT`: redirige tráfico HTTP a HTTPS.
- `DJANGO_SECURE_HSTS_SECONDS`: segundos para HSTS (ej. `31536000`).
- `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS` y `DJANGO_SECURE_HSTS_PRELOAD`.
- `DJANGO_SESSION_COOKIE_SECURE` y `DJANGO_CSRF_COOKIE_SECURE`.
- `DJANGO_X_FRAME_OPTIONS`.
- `DJANGO_SECURE_CONTENT_TYPE_NOSNIFF`.
- `DJANGO_SECURE_REFERRER_POLICY`.

Ajustá estos valores según el entorno para reforzar la seguridad.
