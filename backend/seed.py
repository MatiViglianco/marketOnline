from decimal import Decimal
import io
from urllib.request import urlopen

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from shop.models import Category, Product, SiteConfig


def run():
    # Superuser
    User = get_user_model()
    username = "GeraVinci"
    password = "1473333"
    u, created = User.objects.get_or_create(
        username=username,
        defaults={"is_superuser": True, "is_staff": True, "email": "admin@example.com"},
    )
    u.is_superuser = True
    u.is_staff = True
    u.set_password(password)
    u.save()

    # Site config
    # Upsert site config with requested data
    cfg, _ = SiteConfig.objects.get_or_create(id=1)
    cfg.whatsapp_phone = "+5493584414772"
    cfg.alias_or_cbu = "naranja.ats - Geraldina Vinciguerra (Mercado Pago) - CUIT 27-40679283-3"
    cfg.shipping_cost = Decimal("1200.00")
    cfg.save()

    # Categories
    cats = [
        ("Lácteos", "lacteos"),
        ("Bebidas", "bebidas"),
        ("Almacén", "almacen"),
        ("Limpieza", "limpieza"),
        ("Frutas y Verduras", "frutas-verduras"),
    ]
    cat_map = {}
    for name, slug in cats:
        obj, _ = Category.objects.get_or_create(slug=slug, defaults={"name": name})
        if obj.name != name:
            obj.name = name
            obj.save()
        cat_map[slug] = obj

    # Products
    products = [
        ("Leche entera 1L", "lacteos", "Leche entera larga vida", "1499.90"),
        ("Yogur firme vainilla", "lacteos", "Vaso 190g", "799.00"),
        ("Queso cremoso 300g", "lacteos", "Cremoso de primera", "2899.00"),
        ("Gaseosa cola 2.25L", "bebidas", "Botella PET 2.25L", "2399.00"),
        ("Agua mineral 2L", "bebidas", "Sin gas", "1199.00"),
        ("Jugo naranja 1L", "bebidas", "Listo para beber", "1699.00"),
        ("Arroz largo fino 1kg", "almacen", "Calidad premium", "1399.00"),
        ("Harina 000 1kg", "almacen", "Para panificados", "899.00"),
        ("Azúcar 1kg", "almacen", "Refinada", "1199.00"),
        ("Detergente 750ml", "limpieza", "Limpieza profunda", "1499.00"),
        ("Lavandina 1L", "limpieza", "Cloro tradicional", "999.00"),
        ("Esponja multiuso", "limpieza", "Alta duración", "499.00"),
        ("Manzana roja 1kg", "frutas-verduras", "Fresca selección", "2199.00"),
        ("Banana 1kg", "frutas-verduras", "Ecuador", "1999.00"),
        ("Lechuga criolla unidad", "frutas-verduras", "Hoja fresca", "799.00"),
    ]
    for name, cat_slug, desc, price in products:
        cat = cat_map[cat_slug]
        obj, created = Product.objects.get_or_create(
            name=name,
            defaults={
                "category": cat,
                "description": desc,
                "price": Decimal(price),
                "stock": 25,
                "is_active": True,
            },
        )
        if not created:
            # Update fields if they differ
            changed = False
            if obj.category_id != cat.id:
                obj.category = cat
                changed = True
            if obj.description != desc:
                obj.description = desc
                changed = True
            if str(obj.price) != price:
                obj.price = Decimal(price)
                changed = True
            if obj.stock is None:
                obj.stock = 25
                changed = True
            if not obj.is_active:
                obj.is_active = True
                changed = True
            if changed:
                obj.save()

        # Attach sample image if none
        if not obj.image:
            # Deterministic placeholder based on product name
            seed = name.replace(' ', '-').lower()
            url = f"https://picsum.photos/seed/{seed}/600/400"
            try:
                with urlopen(url) as resp:
                    data = resp.read()
                filename = f"{seed}.jpg"
                obj.image.save(filename, ContentFile(data), save=True)
            except Exception:
                pass

    print("Seed completado: superusuario y datos de prueba listos.")
