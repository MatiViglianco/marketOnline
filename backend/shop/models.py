from django.db import models
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

SITE_CONFIG_CACHE_KEY = 'site_config'
SITE_CONFIG_CACHE_TIMEOUT = 60 * 5


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    offer_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    # Promoción destacada
    promoted = models.BooleanField(default=False, db_index=True)
    promoted_until = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class SiteConfig(models.Model):
    whatsapp_phone = models.CharField(max_length=20, help_text='Ej: 5493511234567')
    alias_or_cbu = models.CharField(max_length=100, blank=True, help_text='Alias o CBU para transferencias')
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración del Sitio'
        verbose_name_plural = 'Configuración del Sitio'

    def __str__(self):
        return f'Config ({self.whatsapp_phone})'


class Announcement(models.Model):
    title = models.CharField(max_length=140)
    message = models.TextField(blank=True)
    active = models.BooleanField(default=True, db_index=True)
    start_at = models.DateTimeField(null=True, blank=True, db_index=True)
    end_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Anuncio'
        verbose_name_plural = 'Anuncios'

    def __str__(self):
        return self.title


class Order(models.Model):
    PAYMENT_METHODS = (
        ('cash', 'Efectivo'),
        ('transfer', 'Transferencia'),
    )
    DELIVERY_METHODS = (
        ('delivery', 'Envío a domicilio'),
        ('pickup', 'Retiro en tienda'),
    )

    name = models.CharField(max_length=140)
    phone = models.CharField(max_length=30)
    address = models.CharField(max_length=240, blank=True)
    notes = models.TextField(blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHODS, default='delivery')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=40, blank=True)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Pedido #{self.id} - {self.name}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'


class Coupon(models.Model):
    TYPE_FIXED = 'fixed'
    TYPE_PERCENT = 'percent'
    TYPE_FREE_SHIPPING = 'free_shipping'
    TYPES = (
        (TYPE_FIXED, 'Monto fijo'),
        (TYPE_PERCENT, 'Porcentaje'),
        (TYPE_FREE_SHIPPING, 'Envío gratis'),
    )

    code = models.CharField(max_length=40, unique=True)
    type = models.CharField(max_length=20, choices=TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # para fijo
    percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # para %
    percent_cap = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # tope del %
    min_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    active = models.BooleanField(default=True, db_index=True)

    def __str__(self):
        return self.code


@receiver([post_save, post_delete], sender=SiteConfig)
def clear_site_config_cache(**kwargs):
    cache.delete(SITE_CONFIG_CACHE_KEY)
