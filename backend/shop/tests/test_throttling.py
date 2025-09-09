from django.urls import reverse
from rest_framework.test import APITestCase
from shop.models import Category, Product


class OrderThrottleTests(APITestCase):
    def setUp(self):
        cat = Category.objects.create(name='cat', slug='cat')
        self.product = Product.objects.create(
            category=cat, name='prod', price=10, stock=10
        )
        self.url = reverse('order-list')

    def _payload(self):
        return {
            'name': 'John',
            'phone': '123',
            'address': '',
            'notes': '',
            'payment_method': 'cash',
            'delivery_method': 'delivery',
            'items': [{'product_id': self.product.id, 'quantity': 1}],
        }

    def test_order_throttle(self):
        for _ in range(3):
            resp = self.client.post(self.url, self._payload(), format='json')
            self.assertNotEqual(resp.status_code, 429)
        resp = self.client.post(self.url, self._payload(), format='json')
        self.assertEqual(resp.status_code, 429)


class CouponThrottleTests(APITestCase):
    def test_coupon_throttle(self):
        url = reverse('coupon-validate')
        for _ in range(2):
            resp = self.client.get(url, {'code': 'TEST'})
            self.assertNotEqual(resp.status_code, 429)
        resp = self.client.get(url, {'code': 'TEST'})
        self.assertEqual(resp.status_code, 429)
