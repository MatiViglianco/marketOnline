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
   SEED_SUPERUSER_USERNAME=admin
   SEED_SUPERUSER_PASSWORD=change-me
   SEED_WHATSAPP_PHONE=+5491111111111
   SEED_ALIAS_OR_CBU=alias.cuenta - Nombre Apellido (Banco) - CUIT 20-00000000-0
   DJANGO_RUN_SEED=False

3) Migraciones y usuario admin:

   cd backend
   python manage.py migrate
   python manage.py createsuperuser

4) Ejecutar servidor:

   python manage.py runserver

Notas:
- El admin está en /admin. Cargar categorías, productos y la configuración del sitio (SiteConfig) ahí.
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

Flujo de uso del MVP

- Home: lista categorías y productos con búsqueda y filtro por categoría; se pueden agregar productos al carrito.
- Carrito: se persiste en localStorage.
- Checkout: completar datos y método de pago; al confirmar se crea el pedido en /api/orders/ y se abre WhatsApp con un mensaje prellenado con el detalle.

