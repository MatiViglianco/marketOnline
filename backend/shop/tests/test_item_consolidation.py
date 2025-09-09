from decimal import Decimal

from django.test import TestCase

from shop.models import Category, Product
from shop.serializers import OrderSerializer


class OrderItemConsolidationTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Cat", slug="cat")
        self.product = Product.objects.create(
            category=self.category, name="Prod", price=Decimal("10.00"), stock=10
        )

    def test_duplicate_items_are_combined(self):
        data = {
            "name": "John",
            "phone": "123",
            "address": "street",
            "payment_method": "cash",
            "delivery_method": "pickup",
            "items": [
                {"product_id": self.product.id, "quantity": 2},
                {"product_id": self.product.id, "quantity": 3},
            ],
        }
        serializer = OrderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        items = order.items.all()
        self.assertEqual(items.count(), 1)
        self.assertEqual(items.first().quantity, 5)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
        self.assertEqual(order.total, Decimal("50"))
