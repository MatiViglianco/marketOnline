from rest_framework import serializers
from django.db import transaction
from .models import Category, Product, SiteConfig, Order, OrderItem, Coupon, Announcement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image']


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False
    )
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'offer_price', 'image', 'stock',
            'is_active', 'promoted', 'promoted_until', 'category', 'category_id'
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return None


class SiteConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteConfig
        fields = ['whatsapp_phone', 'alias_or_cbu', 'shipping_cost', 'updated_at']


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = [
            'id', 'name', 'phone', 'address', 'notes', 'payment_method', 'delivery_method',
            'total', 'shipping_cost', 'created_at', 'items', 'coupon_code'
        ]
        read_only_fields = ['id', 'total', 'shipping_cost', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])

        # Determinar costo de envío y método de entrega
        cfg = SiteConfig.objects.first()
        cfg_shipping = cfg.shipping_cost if cfg else 0

        delivery_method = validated_data.get('delivery_method', 'delivery')
        shipping_cost = 0 if delivery_method == 'pickup' else cfg_shipping

        with transaction.atomic():
            order = Order.objects.create(shipping_cost=shipping_cost, **validated_data)
            total = 0
            for item in items_data:
                product_id = item['product_id']
                quantity = item['quantity']
                try:
                    product = Product.objects.select_for_update().get(id=product_id, is_active=True)
                except Product.DoesNotExist:
                    raise serializers.ValidationError({'items': f'Producto {product_id} inválido'})
                if product.stock < quantity:
                    raise serializers.ValidationError({'items': f'Sin stock suficiente para {product.name} (disponible: {product.stock})'})
                price = product.offer_price if product.offer_price else product.price
                total += price * quantity
                OrderItem.objects.create(order=order, product=product, quantity=quantity, price=price)
                product.stock -= quantity
                product.save(update_fields=['stock'])

            # Aplicar cupón si viene
            code = validated_data.pop('coupon_code', '').strip()
            discount = 0
            if code:
                c = Coupon.objects.filter(code__iexact=code, active=True).first()
                if c and total >= c.min_subtotal:
                    if c.type == Coupon.TYPE_FIXED:
                        discount = min(c.amount, total)
                    elif c.type == Coupon.TYPE_PERCENT:
                        raw = total * (c.percent / 100)
                        cap = c.percent_cap or 0
                        discount = min(raw, cap) if cap > 0 else raw
                    elif c.type == Coupon.TYPE_FREE_SHIPPING:
                        order.shipping_cost = 0

            order.discount_total = discount
            order.coupon_code = code[:40]
            order.total = total - discount + order.shipping_cost
            order.save(update_fields=['total'])
            return order

    def validate_coupon_code(self, value):
        if not value:
            return ''
        code = value.strip()
        coupon = Coupon.objects.filter(code__iexact=code, active=True).first()
        if not coupon:
            raise serializers.ValidationError('Cupón inválido')
        self._coupon = coupon
        return code


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['code', 'type', 'amount', 'percent', 'percent_cap', 'min_subtotal', 'active']


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'message', 'active', 'start_at', 'end_at', 'created_at']
