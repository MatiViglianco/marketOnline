from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.core.cache import cache
from rest_framework.test import APIClient

from shop.models import SiteConfig


class SiteConfigCacheTest(TestCase):
    def setUp(self):
        cache.clear()
        self.url = reverse('config-list')
        self.client = APIClient()
        self.cfg = SiteConfig.objects.create(
            whatsapp_phone='123',
            alias_or_cbu='alias',
            shipping_cost=Decimal('5.00'),
        )

    def test_site_config_response_cached(self):
        with self.assertNumQueries(1):
            first = self.client.get(self.url)
        self.assertEqual(first.status_code, 200)
        with self.assertNumQueries(0):
            second = self.client.get(self.url)
        self.assertEqual(first.data, second.data)

    def test_cache_invalidated_on_update(self):
        self.client.get(self.url)  # prime cache
        self.cfg.shipping_cost = Decimal('7.00')
        self.cfg.save()
        with self.assertNumQueries(1):
            resp = self.client.get(self.url)
        self.assertEqual(resp.data['shipping_cost'], '7.00')
        with self.assertNumQueries(0):
            resp2 = self.client.get(self.url)
        self.assertEqual(resp2.data['shipping_cost'], '7.00')

