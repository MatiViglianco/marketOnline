from decimal import Decimal

from django.test import TestCase

from shop.models import Category, Product, Coupon, SiteConfig
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

    def test_percent_coupon(self):
        cases = [
            ("PERCENT50", Decimal("50"), Decimal("0"), Decimal("10"), Decimal("10")),
            ("PERCENT50CAP", Decimal("50"), Decimal("5"), Decimal("5"), Decimal("15")),
        ]
        for code, percent, cap, expected_discount, expected_total in cases:
            with self.subTest(code=code):
                Coupon.objects.create(
                    code=code,
                    type=Coupon.TYPE_PERCENT,
                    percent=percent,
                    percent_cap=cap,
                    active=True,
                )
                data = {
                    "name": "John",
                    "phone": "123",
                    "address": "street",
                    "payment_method": "cash",
                    "delivery_method": "pickup",
                    "items": [{"product_id": self.product.id, "quantity": 2}],
                    "coupon_code": code,
                }
                serializer = OrderSerializer(data=data)
                serializer.is_valid(raise_exception=True)
                order = serializer.save()

                order.refresh_from_db()
                self.assertEqual(order.discount_total, expected_discount)
                self.assertEqual(order.coupon_code, code)
                self.assertEqual(order.total, expected_total)
                self.assertEqual(order.shipping_cost, Decimal("0"))

    def test_free_shipping_coupon(self):
        SiteConfig.objects.create(whatsapp_phone="123", shipping_cost=Decimal("10"))
        Coupon.objects.create(
            code="FREESHIP",
            type=Coupon.TYPE_FREE_SHIPPING,
            active=True,
        )
        data = {
            "name": "John",
            "phone": "123",
            "address": "street",
            "payment_method": "cash",
            "delivery_method": "delivery",
            "items": [{"product_id": self.product.id, "quantity": 2}],
            "coupon_code": "FREESHIP",
        }
        serializer = OrderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        order.refresh_from_db()
        self.assertEqual(order.discount_total, Decimal("0"))
        self.assertEqual(order.coupon_code, "FREESHIP")
        self.assertEqual(order.shipping_cost, Decimal("0"))
        self.assertEqual(order.total, Decimal("20"))
