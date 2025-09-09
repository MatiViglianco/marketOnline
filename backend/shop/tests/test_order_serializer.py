from decimal import Decimal

from django.test import TestCase

from shop.models import Category, Product, Coupon, Order
from shop.serializers import OrderSerializer


class OrderSerializerCouponTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Cat", slug="cat")
        self.product = Product.objects.create(
            name="Prod",
            description="desc",
            price=Decimal("10"),
            stock=10,
            category=self.category,
        )

    def _base_payload(self):
        return {
            "name": "John",
            "phone": "123",
            "address": "Street",
            "notes": "",
            "payment_method": "cash",
            "delivery_method": "delivery",
            "items": [{"product_id": self.product.id, "quantity": 1}],
        }

    def test_invalid_coupon_code_rejected(self):
        data = self._base_payload()
        data["coupon_code"] = "INVALID!!"
        serializer = OrderSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("coupon_code", serializer.errors)

    def test_valid_coupon_applied(self):
        Coupon.objects.create(
            code="SAVE5",
            type=Coupon.TYPE_FIXED,
            amount=Decimal("5"),
            min_subtotal=0,
            active=True,
        )
        data = self._base_payload()
        data["coupon_code"] = "SAVE5"
        serializer = OrderSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        order = serializer.save()
        self.assertEqual(order.coupon_code, "SAVE5")
        self.assertEqual(order.discount_total, Decimal("5"))
        self.assertEqual(order.total, Decimal("5"))
        # ensure values persisted
        stored = Order.objects.get(pk=order.pk)
        self.assertEqual(stored.coupon_code, "SAVE5")
        self.assertEqual(stored.discount_total, Decimal("5"))

