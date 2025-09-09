from decimal import Decimal

from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from shop.models import Category, Product


class OrderThrottleTest(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Cat", slug="cat")
        self.product = Product.objects.create(
            category=self.category,
            name="Prod",
            price=Decimal("10.00"),
            stock=100,
        )
        self.url = reverse("order-list")
        self.data = {
            "name": "John",
            "phone": "123",
            "address": "street",
            "payment_method": "cash",
            "delivery_method": "pickup",
            "items": [{"product_id": self.product.id, "quantity": 1}],
        }
        self.user = User.objects.create_user("tester", password="pass")
        self.client.login(username="tester", password="pass")

    def test_orders_throttled_after_limit(self):
        for i in range(10):
            response = self.client.post(self.url, self.data, format="json")
            self.assertNotEqual(
                response.status_code, 429, f"Request {i} was unexpectedly throttled"
            )

        response = self.client.post(self.url, self.data, format="json")
        self.assertEqual(response.status_code, 429)

