from decimal import Decimal

from django.test import TestCase

from shop.models import Category, Product, Coupon
from shop.serializers import OrderSerializer


class OrderCouponTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Cat", slug="cat")
        self.product = Product.objects.create(
            category=self.category,
            name="Prod",
            price=Decimal("10.00"),
            stock=5,
        )
        self.coupon = Coupon.objects.create(
            code="OFF5",
            type=Coupon.TYPE_FIXED,
            amount=Decimal("5.00"),
            min_subtotal=0,
            active=True,
        )

    def test_discount_and_coupon_saved(self):
        data = {
            "name": "John",
            "phone": "123",
            "address": "street",
            "payment_method": "cash",
            "delivery_method": "pickup",
            "items": [{"product_id": self.product.id, "quantity": 2}],
            "coupon_code": "OFF5",
        }
        serializer = OrderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        order.refresh_from_db()
        self.assertEqual(order.discount_total, Decimal("5"))
        self.assertEqual(order.coupon_code, "OFF5")
        self.assertEqual(order.total, Decimal("15"))
        self.assertEqual(order.shipping_cost, Decimal("0"))
