from decimal import Decimal

from django.urls import reverse
from rest_framework.test import APITestCase

from shop.models import Coupon


class CouponValidateAPITests(APITestCase):
    def setUp(self):
        self.coupon = Coupon.objects.create(
            code="OFF20",
            type=Coupon.TYPE_FIXED,
            amount=Decimal("20"),
            min_subtotal=Decimal("100"),
            active=True,
        )
        self.url = reverse("coupon-validate")

    def test_fails_when_subtotal_below_minimum(self):
        resp = self.client.post(self.url, {"code": "OFF20", "subtotal": "50"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), {"valid": False, "reason": "min_subtotal"})

    def test_fails_when_subtotal_missing(self):
        resp = self.client.post(self.url, {"code": "OFF20"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), {"valid": False, "reason": "min_subtotal"})

    def test_valid_when_subtotal_meets_minimum(self):
        resp = self.client.post(self.url, {"code": "OFF20", "subtotal": "150"}, format="json")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body.get("valid"))
        self.assertEqual(body.get("code"), "OFF20")

